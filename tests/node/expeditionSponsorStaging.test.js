/**
 * @fileoverview G4 Sponsor offer staging and START_EXPEDITION snapshot validation contract.
 *
 * Pins the staging contract specified in G4 Task 2:
 * 1. PREPARE_EXPEDITION_SPONSOR_OFFERS recomputes the pure offer snapshot from canonical state.
 * 2. Selection causes zero Money/item/Social/Quest mutation before START.
 * 3. START_EXPEDITION verifies committed sponsorOfferId exists in persisted preparedSponsorOffers.
 * 4. Stale runSeed or terms hash rejects.
 * 5. Valid staged offer is accepted on START, emits canonical effects, and clears preparedSponsorOffers.
 * 6. START replay does not pay twice.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import {
  createPrepareExpeditionSponsorOffersAction,
  prepareExpeditionSponsorOffers
} from '../../src/context/expeditionActionCreators.ts'
import { getCanonicalBrandDealTermsHash } from '../../src/domain/expedition/sponsors.ts'
import {
  FIXTURE_REGION_ID,
  FIXTURE_RUN_SEED,
  FIXTURE_TOUR_ID,
  fixtureLoadout,
  preparedState
} from '../expeditionLifecycleFixture.js'

describe('G4 Sponsor Offer Staging & Snapshot Validation', () => {
  it('stages deterministic offers via PREPARE_EXPEDITION_SPONSOR_OFFERS', () => {
    const prep = preparedState()
    assert.deepEqual(prep.expedition.preparedSponsorOffers, [])

    const stagedState = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        FIXTURE_REGION_ID,
        FIXTURE_TOUR_ID
      )
    )

    const offers = stagedState.expedition.preparedSponsorOffers
    assert.ok(offers.length > 0)
    assert.ok(offers.length <= 3)

    for (const offer of offers) {
      assert.equal(typeof offer.offerId, 'string')
      assert.equal(typeof offer.dealId, 'string')
      assert.equal(offer.runSeed, FIXTURE_RUN_SEED)
      assert.equal(
        offer.canonicalTermsHash,
        getCanonicalBrandDealTermsHash(offer.dealId)
      )
    }

    // Identical call yields identical offers in identical order
    const stagedStateAgain = gameReducer(
      prep,
      prepareExpeditionSponsorOffers(prep, FIXTURE_REGION_ID, FIXTURE_TOUR_ID)
    )
    assert.deepEqual(stagedStateAgain.expedition.preparedSponsorOffers, offers)
  })

  it('causes zero Money, item, Social, or Quest mutation during staging', () => {
    const prep = preparedState({ money: 5000 })
    const staged = gameReducer(
      prep,
      prepareExpeditionSponsorOffers(prep, FIXTURE_REGION_ID, FIXTURE_TOUR_ID)
    )

    assert.equal(staged.player.money, prep.player.money)
    assert.deepEqual(staged.band, prep.band)
    assert.deepEqual(staged.social, prep.social)
    assert.deepEqual(staged.quests, prep.quests)
  })

  it('rejects PREPARE_EXPEDITION_SPONSOR_OFFERS when not in prepared status', () => {
    const idle = createInitialState()
    const resultIdle = gameReducer(
      idle,
      createPrepareExpeditionSponsorOffersAction(idle.runSeed)
    )
    assert.equal(resultIdle, idle)
  })

  it('rejects PREPARE_EXPEDITION_SPONSOR_OFFERS on expectedRunSeed mismatch', () => {
    const prep = preparedState()
    const mismatched = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(999999)
    )
    assert.equal(mismatched, prep)
    assert.deepEqual(mismatched.expedition.preparedSponsorOffers, [])
  })

  it('rejects START_EXPEDITION if selected sponsorOfferId was not staged', () => {
    const prep = preparedState()
    // Do NOT stage offers: preparedSponsorOffers remains []
    assert.deepEqual(prep.expedition.preparedSponsorOffers, [])

    const loadout = fixtureLoadout({
      build: { sponsorOfferId: 'unstaged_offer_id' }
    })

    const started = gameReducer(prep, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })

    // START must be rejected: status remains prepared
    assert.equal(started, prep)
    assert.equal(started.expedition.status, 'prepared')
  })

  it('rejects START_EXPEDITION if staged offer has mismatched runSeed or terms hash', () => {
    const prep = preparedState()
    const stagedState = gameReducer(
      prep,
      prepareExpeditionSponsorOffers(prep, FIXTURE_REGION_ID, FIXTURE_TOUR_ID)
    )
    const validOffer = stagedState.expedition.preparedSponsorOffers[0]
    assert.ok(validOffer)

    // Tampered seed
    const tamperedSeedState = {
      ...stagedState,
      expedition: {
        ...stagedState.expedition,
        preparedSponsorOffers: [
          { ...validOffer, runSeed: validOffer.runSeed + 1 }
        ]
      }
    }
    const loadout = fixtureLoadout({
      build: { sponsorOfferId: validOffer.offerId }
    })
    const rejectSeed = gameReducer(tamperedSeedState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(rejectSeed, tamperedSeedState)

    // Tampered terms hash
    const tamperedHashState = {
      ...stagedState,
      expedition: {
        ...stagedState.expedition,
        preparedSponsorOffers: [
          { ...validOffer, canonicalTermsHash: 'tampered_hash' }
        ]
      }
    }
    const rejectHash = gameReducer(tamperedHashState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(rejectHash, tamperedHashState)
  })

  it('accepts valid staged offer on START_EXPEDITION, emits effects and clears snapshot', () => {
    const prep = preparedState({ money: 5000 })
    const stagedState = gameReducer(
      prep,
      prepareExpeditionSponsorOffers(prep, FIXTURE_REGION_ID, FIXTURE_TOUR_ID)
    )
    const validOffer = stagedState.expedition.preparedSponsorOffers[0]
    assert.ok(validOffer)

    const loadout = fixtureLoadout({
      build: { sponsorOfferId: validOffer.offerId }
    })

    const started = gameReducer(stagedState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })

    assert.equal(started.expedition.status, 'active')
    assert.equal(
      started.expedition.loadout?.build.sponsorOfferId,
      validOffer.offerId
    )
    // preparedSponsorOffers is cleared on active transition
    assert.deepEqual(started.expedition.preparedSponsorOffers, [])

    // Sponsor obligation is materialized
    const sponsorObligation = started.expedition.activeObligations.find(
      o => o.sourceType === 'brandDeal' && o.sourceId === validOffer.dealId
    )
    assert.ok(
      sponsorObligation,
      'linked brandDeal obligation must be materialized'
    )
    assert.equal(sponsorObligation.status, 'active')

    // Replay START does not award money or change state
    const replayed = gameReducer(started, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(replayed, started)
    assert.equal(replayed.player.money, started.player.money)
  })

  it('starts normally without sponsor obligation when sponsorOfferId is null', () => {
    const prep = preparedState()
    const loadout = fixtureLoadout({
      build: { sponsorOfferId: null }
    })
    const started = gameReducer(prep, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })

    assert.equal(started.expedition.status, 'active')
    assert.equal(started.expedition.loadout?.build.sponsorOfferId, null)
    assert.equal(
      started.expedition.activeObligations.some(
        o => o.sourceType === 'brandDeal'
      ),
      false
    )
  })
})
