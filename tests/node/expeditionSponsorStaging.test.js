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
import { EXPEDITION_UNLOCK_SETS } from '../../src/data/expedition/unlockSets.ts'
import {
  FIXTURE_REGION_ID,
  FIXTURE_RUN_SEED,
  FIXTURE_TOUR_ID,
  fixtureLoadout,
  preparedState,
  withExpeditionCapabilities
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

  it('survives a LOAD_GAME round trip for an unlocked non-baseline route', () => {
    // The snapshot is only re-derivable from the Region/Tour/perk it was
    // staged for. A prepared run has no committed loadout, so a validator
    // reading the loadout resolved the baseline profile and wiped every
    // non-baseline staging on load - and START then had no offer to accept.
    const prep = withExpeditionCapabilities(
      preparedState(),
      Object.keys(EXPEDITION_UNLOCK_SETS)
    )
    const stagedState = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        'underground_scene',
        'underground_tour',
        'underground_contact'
      )
    )
    const stagedOffers = stagedState.expedition.preparedSponsorOffers
    assert.ok(stagedOffers.length > 0)
    assert.deepEqual(stagedState.expedition.preparedSponsorProvenance, {
      regionId: 'underground_scene',
      tourTypeId: 'underground_tour',
      starterPerkId: 'underground_contact'
    })

    const loaded = gameReducer(createInitialState(), {
      type: ActionTypes.LOAD_GAME,
      payload: JSON.parse(JSON.stringify(stagedState))
    })

    assert.equal(loaded.expedition.status, 'prepared')
    assert.deepEqual(loaded.expedition.preparedSponsorOffers, stagedOffers)
    assert.deepEqual(
      loaded.expedition.preparedSponsorProvenance,
      stagedState.expedition.preparedSponsorProvenance
    )

    // START accepts the staged offer that survived the round trip.
    const started = gameReducer(loaded, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout: fixtureLoadout({
          regionId: 'underground_scene',
          tourTypeId: 'underground_tour',
          starterPerkId: 'underground_contact',
          build: { sponsorOfferId: stagedOffers[0].offerId }
        })
      }
    })
    assert.equal(started.expedition.status, 'active')
    assert.deepEqual(started.expedition.preparedSponsorOffers, [])
    assert.equal(started.expedition.preparedSponsorProvenance, undefined)
    assert.equal(
      started.expedition.activeObligations.some(
        obligation => obligation.sourceType === 'brandDeal'
      ),
      true
    )
  })

  it('clears offers and provenance together when the staged route is no longer available', () => {
    const prep = withExpeditionCapabilities(
      preparedState(),
      Object.keys(EXPEDITION_UNLOCK_SETS)
    )
    const stagedState = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        'underground_scene',
        'underground_tour'
      )
    )
    assert.ok(stagedState.expedition.preparedSponsorOffers.length > 0)

    // A save that kept the staging but lost the capability that unlocked it.
    const revoked = JSON.parse(JSON.stringify(stagedState))
    revoked.career.unlockedSetIds = []

    const loaded = gameReducer(createInitialState(), {
      type: ActionTypes.LOAD_GAME,
      payload: revoked
    })

    assert.deepEqual(loaded.expedition.preparedSponsorOffers, [])
    assert.equal(loaded.expedition.preparedSponsorProvenance, undefined)
  })

  it('rejects PREPARE_EXPEDITION_SPONSOR_OFFERS for locked or invalid route and perks', () => {
    const prep = preparedState()

    // Invalid region
    const rejectInvalidRegion = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        'nonexistent_region',
        FIXTURE_TOUR_ID
      )
    )
    assert.equal(rejectInvalidRegion, prep)
    assert.deepEqual(rejectInvalidRegion.expedition.preparedSponsorOffers, [])

    // Locked region (fresh Career lacks region_industrial_belt)
    const rejectLockedRegion = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        'industrial_belt',
        FIXTURE_TOUR_ID
      )
    )
    assert.equal(rejectLockedRegion, prep)

    // Invalid tour type
    const rejectInvalidTour = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        FIXTURE_REGION_ID,
        'nonexistent_tour'
      )
    )
    assert.equal(rejectInvalidTour, prep)

    // Locked tour type
    const rejectLockedTour = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        FIXTURE_REGION_ID,
        'survival_tour'
      )
    )
    assert.equal(rejectLockedTour, prep)

    // Invalid starter perk
    const rejectInvalidPerk = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        FIXTURE_REGION_ID,
        FIXTURE_TOUR_ID,
        'nonexistent_perk'
      )
    )
    assert.equal(rejectInvalidPerk, prep)

    // Locked starter perk (fresh Career lacks any perk unlock)
    const rejectLockedPerk = gameReducer(
      prep,
      createPrepareExpeditionSponsorOffersAction(
        FIXTURE_RUN_SEED,
        FIXTURE_REGION_ID,
        FIXTURE_TOUR_ID,
        'press_pass'
      )
    )
    assert.equal(rejectLockedPerk, prep)
  })

  it('rejects START_EXPEDITION if preparedSponsorProvenance mismatches candidate build route or perk', () => {
    const prep = preparedState()
    const stagedState = gameReducer(
      prep,
      prepareExpeditionSponsorOffers(prep, FIXTURE_REGION_ID, FIXTURE_TOUR_ID)
    )
    const validOffer = stagedState.expedition.preparedSponsorOffers[0]
    assert.ok(validOffer)
    assert.deepEqual(stagedState.expedition.preparedSponsorProvenance, {
      regionId: FIXTURE_REGION_ID,
      tourTypeId: FIXTURE_TOUR_ID,
      starterPerkId: null
    })

    // Mismatched region in provenance
    const tamperedRegionState = {
      ...stagedState,
      expedition: {
        ...stagedState.expedition,
        preparedSponsorProvenance: {
          ...stagedState.expedition.preparedSponsorProvenance,
          regionId: 'industrial_belt'
        }
      }
    }
    const loadout = fixtureLoadout({
      build: { sponsorOfferId: validOffer.offerId }
    })
    const rejectRegion = gameReducer(tamperedRegionState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(rejectRegion, tamperedRegionState)

    // Mismatched tourTypeId in provenance
    const tamperedTourState = {
      ...stagedState,
      expedition: {
        ...stagedState.expedition,
        preparedSponsorProvenance: {
          ...stagedState.expedition.preparedSponsorProvenance,
          tourTypeId: 'survival_tour'
        }
      }
    }
    const rejectTour = gameReducer(tamperedTourState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(rejectTour, tamperedTourState)

    // Mismatched starterPerkId in provenance
    const tamperedPerkState = {
      ...stagedState,
      expedition: {
        ...stagedState.expedition,
        preparedSponsorProvenance: {
          ...stagedState.expedition.preparedSponsorProvenance,
          starterPerkId: 'press_pass'
        }
      }
    }
    const rejectPerk = gameReducer(tamperedPerkState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(rejectPerk, tamperedPerkState)

    // Missing provenance entirely while sponsorOfferId is present
    const missingProvenanceState = {
      ...stagedState,
      expedition: {
        ...stagedState.expedition,
        preparedSponsorProvenance: undefined
      }
    }
    const rejectMissingProvenance = gameReducer(missingProvenanceState, {
      type: ActionTypes.START_EXPEDITION,
      payload: {
        prepId: 'run_fixture',
        expectedRunSeed: FIXTURE_RUN_SEED,
        loadout
      }
    })
    assert.equal(rejectMissingProvenance, missingProvenanceState)
  })
})
