/**
 * @fileoverview G5 Task 7 — unlock sets, their gates, and the purchase journal.
 *
 * A set is only ever worth its capabilities, so consumers ask for a capability
 * and never for a set id. The purchase is a three-step journal because a
 * process that dies mid-purchase must leave evidence of what it took.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  EXPEDITION_UNLOCK_SETS,
  EXPEDITION_UNLOCK_SET_IDS,
  isExpeditionCapabilityUnlocked
} from '../../src/data/expedition/unlockSets'
import {
  HQ_FACILITY_IDS,
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL
} from '../../src/data/expedition/hqFacilities'
import {
  getAvailableExpeditionRegionIds,
  getAvailableExpeditionTourTypeIds
} from '../../src/domain/expedition/loadout'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers'
import { startedState } from '../expeditionLifecycleFixture.js'

/** A Career that satisfies everything one set needs, and nothing more. */
const readyFor = (setId, overrides = {}) => {
  const set = EXPEDITION_UNLOCK_SETS[setId]
  const base = startedState({ money: 5000 })
  const rankCounters =
    set.requiredRank === 'headliner'
      ? {
          completedExpeditionRuns: 5,
          finalizedExpeditionRuns: 5,
          completedExpeditionRegionIds: ['home_turf', 'festival_fields']
        }
      : set.requiredRank === 'roadtested'
        ? {
            completedExpeditionRuns: 1,
            finalizedExpeditionRuns: 2,
            completedExpeditionRegionIds: []
          }
        : {}
  return {
    ...base,
    career: {
      ...base.career,
      ...rankCounters,
      tourTokens: set.cost,
      hqFacilityLevels: {
        [set.requiredFacility.id]: set.requiredFacility.level
      },
      ...overrides
    }
  }
}

const begin = (state, setId) =>
  gameReducer(state, {
    type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })
const complete = (state, setId) =>
  gameReducer(state, {
    type: ActionTypes.COMPLETE_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })
const rollback = (state, setId) =>
  gameReducer(state, {
    type: ActionTypes.ROLLBACK_EXPEDITION_UNLOCK_PURCHASE,
    payload: { setId }
  })

describe('G5 — the unlock registry pays for every facility level', () => {
  it('gives each purchasable facility level at least one consumer', () => {
    // The Task 6 requirement: a level nothing needs must not be sellable.
    const required = new Set(
      EXPEDITION_UNLOCK_SET_IDS.map(id => {
        const facility = EXPEDITION_UNLOCK_SETS[id].requiredFacility
        return `${facility.id}:${facility.level}`
      })
    )
    for (const facilityId of HQ_FACILITY_IDS) {
      for (
        let level = 1;
        level <= HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[facilityId];
        level++
      ) {
        assert.ok(
          required.has(`${facilityId}:${level}`),
          `${facilityId} L${level} is purchasable but no unlock set needs it`
        )
      }
    }
  })

  it('requires only levels the facility registry implements', () => {
    for (const id of EXPEDITION_UNLOCK_SET_IDS) {
      const { requiredFacility, capabilities, cost } =
        EXPEDITION_UNLOCK_SETS[id]
      assert.ok(
        requiredFacility.level <=
          HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[requiredFacility.id],
        `${id} needs an unbuilt level`
      )
      assert.ok(cost > 0, `${id} must cost something`)
      assert.ok(capabilities.length > 0, `${id} grants nothing`)
    }
  })

  it('never grants the same capability from two sets', () => {
    const seen = new Set()
    for (const id of EXPEDITION_UNLOCK_SET_IDS) {
      for (const capability of EXPEDITION_UNLOCK_SETS[id].capabilities) {
        assert.ok(!seen.has(capability), `${capability} is sold twice`)
        seen.add(capability)
      }
    }
  })
})

describe('G5 — capability is the only question a consumer asks', () => {
  it('resolves a capability from any owning set', () => {
    assert.equal(
      isExpeditionCapabilityUnlocked(['festival_network'], 'tour_blitz_tour'),
      true
    )
    assert.equal(
      isExpeditionCapabilityUnlocked(['festival_network'], 'crew_manager'),
      false
    )
  })

  it('refuses a malformed or forged owned-set list', () => {
    for (const owned of [null, undefined, 'festival_network', [42], ['nope']]) {
      assert.equal(
        isExpeditionCapabilityUnlocked(owned, 'tour_blitz_tour'),
        false
      )
    }
  })
})

describe('G5 — availability follows the capability', () => {
  it('offers only the baseline pair to a fresh Career', () => {
    const fresh = startedState({ money: 5000 })
    assert.deepEqual(getAvailableExpeditionTourTypeIds(fresh), [
      'standard_tour'
    ])
    // `home_turf` is the plan's numeric baseline and carries no gate.
    assert.deepEqual(getAvailableExpeditionRegionIds(fresh).slice().sort(), [
      'home_turf',
      'industrial_belt'
    ])
  })

  it('opens exactly what the bought set is worth', () => {
    const base = startedState({ money: 5000 })
    const withFestival = {
      ...base,
      career: { ...base.career, unlockedSetIds: ['festival_network'] }
    }
    assert.ok(
      getAvailableExpeditionTourTypeIds(withFestival).includes('blitz_tour')
    )
    assert.ok(
      getAvailableExpeditionRegionIds(withFestival).includes('festival_fields')
    )
    // and nothing another set owns
    assert.ok(
      !getAvailableExpeditionTourTypeIds(withFestival).includes(
        'corporate_tour'
      )
    )
  })
})

describe('G5 — the purchase journal', () => {
  it('debits with the entry and grants only on complete', () => {
    const ready = readyFor('mechanic_network')
    const cost = EXPEDITION_UNLOCK_SETS.mechanic_network.cost

    const opened = begin(ready, 'mechanic_network')
    assert.equal(opened.career.tourTokens, 0)
    assert.deepEqual(opened.career.pendingUnlockPurchase, {
      setId: 'mechanic_network',
      debitedTokens: cost
    })
    // Not granted yet — the debit and the grant are deliberately separate.
    assert.deepEqual(opened.career.unlockedSetIds, [])

    const done = complete(opened, 'mechanic_network')
    assert.deepEqual(done.career.unlockedSetIds, ['mechanic_network'])
    assert.equal(done.career.pendingUnlockPurchase, null)
    assert.equal(done.career.tourTokens, 0)
  })

  it('refunds exactly what it debited on rollback', () => {
    const ready = readyFor('mechanic_network')
    const rolled = rollback(
      begin(ready, 'mechanic_network'),
      'mechanic_network'
    )
    assert.equal(rolled.career.tourTokens, ready.career.tourTokens)
    assert.deepEqual(rolled.career.unlockedSetIds, [])
    assert.equal(rolled.career.pendingUnlockPurchase, null)
  })

  it('holds one purchase open at a time', () => {
    const ready = readyFor('mechanic_network', { tourTokens: 50 })
    const opened = begin(ready, 'mechanic_network')
    // A second begin would stack debits, so it is refused outright.
    assert.equal(begin(opened, 'mechanic_network'), opened)
  })

  it('refuses a complete or rollback that names a different set', () => {
    const opened = begin(readyFor('mechanic_network'), 'mechanic_network')
    assert.equal(complete(opened, 'rival_network'), opened)
    assert.equal(rollback(opened, 'rival_network'), opened)
  })

  it('refuses a set whose rank the Career has not earned', () => {
    // rival_network needs headliner; a rookie with the Tokens and the facility
    // still cannot buy it.
    const rookie = readyFor('rival_network', {
      completedExpeditionRuns: 0,
      finalizedExpeditionRuns: 0,
      completedExpeditionRegionIds: []
    })
    assert.equal(begin(rookie, 'rival_network'), rookie)
  })

  it('refuses a set whose facility level is missing', () => {
    const noFacility = readyFor('mechanic_network', { hqFacilityLevels: {} })
    assert.equal(begin(noFacility, 'mechanic_network'), noFacility)
    // Management Office L1 does not pay for the set that needs L2.
    const tooLow = readyFor('rival_network', {
      hqFacilityLevels: { management_office: 1 }
    })
    assert.equal(begin(tooLow, 'rival_network'), tooLow)
  })

  it('refuses a set the Career cannot afford or already owns', () => {
    const broke = readyFor('mechanic_network', { tourTokens: 0 })
    assert.equal(begin(broke, 'mechanic_network'), broke)
    const owned = readyFor('mechanic_network', {
      unlockedSetIds: ['mechanic_network']
    })
    assert.equal(begin(owned, 'mechanic_network'), owned)
  })

  it('refuses malformed and hostile payloads', () => {
    const ready = readyFor('mechanic_network')
    for (const payload of [
      null,
      42,
      {},
      { setId: 'nope' },
      { setId: '__proto__' }
    ]) {
      assert.equal(
        gameReducer(ready, {
          type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
          payload
        }),
        ready
      )
    }
  })
})

describe('G5 — the journal survives a load', () => {
  it('clamps a forged refund to what the set actually costs', () => {
    const sanitized = sanitizeCareerState({
      pendingUnlockPurchase: {
        setId: 'mechanic_network',
        debitedTokens: 9999
      }
    })
    assert.deepEqual(sanitized.pendingUnlockPurchase, {
      setId: 'mechanic_network',
      debitedTokens: EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    })
  })

  it('drops an entry naming a set that does not exist', () => {
    for (const entry of [
      { setId: 'nope', debitedTokens: 3 },
      { setId: '__proto__', debitedTokens: 3 },
      'not-an-object',
      null
    ]) {
      assert.equal(
        sanitizeCareerState({ pendingUnlockPurchase: entry })
          .pendingUnlockPurchase,
        null
      )
    }
  })

  it('keeps only unlock ids the registry knows', () => {
    const sanitized = sanitizeCareerState({
      unlockedSetIds: [
        'mechanic_network',
        'mechanic_network',
        'nope',
        '__proto__',
        42
      ]
    })
    assert.deepEqual(sanitized.unlockedSetIds, ['mechanic_network'])
  })
})
