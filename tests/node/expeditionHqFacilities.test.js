/**
 * @fileoverview G5 Task 6 — the HQ facility registry and its purchase.
 *
 * The registry states what is actually built, so the reducer can refuse a
 * level nothing implements. Cost and ceiling are derived from it and never
 * carried by the caller.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createPurchaseExpeditionHqFacilityAction } from '../../src/context/careerActionCreators'
import {
  HQ_FACILITY_IDS,
  HQ_FACILITY_LEVEL_COSTS,
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL,
  getExpeditionHqFacilityLevelCost
} from '../../src/data/expedition/hqFacilities'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers'
import { startedState } from '../expeditionLifecycleFixture.js'

/** The fixture Career with a Token balance to spend. */
const withTokens = (tourTokens, hqFacilityLevels = {}) => {
  const base = startedState({ money: 5000 })
  return {
    ...base,
    career: { ...base.career, tourTokens, hqFacilityLevels }
  }
}

const buy = (state, facilityId, expectedLevel) =>
  gameReducer(state, {
    type: ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY,
    payload: { facilityId, expectedLevel }
  })

describe('G5 — the facility registry states what is built', () => {
  it('implements every listed facility to at least level 1', () => {
    assert.deepEqual(HQ_FACILITY_IDS.slice().sort(), [
      'black_market_contact',
      'crew_lounge',
      'garage',
      'management_office',
      'rehearsal',
      'workshop'
    ])
    for (const id of HQ_FACILITY_IDS) {
      const max = HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[id]
      assert.ok(max >= 1 && max <= 2, `${id} ceiling ${max} is not purchasable`)
      // Every level up to the ceiling must have a price, or it cannot be sold.
      for (let level = 1; level <= max; level++) {
        assert.equal(
          getExpeditionHqFacilityLevelCost(id, level),
          HQ_FACILITY_LEVEL_COSTS[level]
        )
      }
      // Nothing above the ceiling is purchasable at any price.
      assert.equal(getExpeditionHqFacilityLevelCost(id, max + 1), null)
    }
  })

  it('prices no level the registry does not implement', () => {
    for (const bad of ['not_a_facility', '', null, 42, '__proto__']) {
      assert.equal(getExpeditionHqFacilityLevelCost(bad, 1), null)
    }
    for (const level of [0, 3, -1, 1.5, Number.NaN]) {
      assert.equal(getExpeditionHqFacilityLevelCost('workshop', level), null)
    }
  })
})

describe('G5 — purchasing a facility level', () => {
  it('debits the registry cost once and raises the level', () => {
    const bought = buy(withTokens(5), 'workshop', 0)
    assert.equal(bought.career.hqFacilityLevels.workshop, 1)
    assert.equal(bought.career.tourTokens, 5 - HQ_FACILITY_LEVEL_COSTS[1])
  })

  it('walks Management Office to its level 2 at the level-2 price', () => {
    const first = buy(withTokens(10), 'management_office', 0)
    assert.equal(first.career.hqFacilityLevels.management_office, 1)
    const second = buy(first, 'management_office', 1)
    assert.equal(second.career.hqFacilityLevels.management_office, 2)
    assert.equal(
      second.career.tourTokens,
      10 - HQ_FACILITY_LEVEL_COSTS[1] - HQ_FACILITY_LEVEL_COSTS[2]
    )
    // Level 3 is not implemented, so it cannot be reached at any balance.
    assert.equal(buy(second, 'management_office', 2), second)
  })

  it('refuses a level above the facility ceiling', () => {
    // Workshop stops at 1, so the second level is refused even with Tokens.
    const first = buy(withTokens(20), 'workshop', 0)
    assert.equal(buy(first, 'workshop', 1), first)
  })

  it('refuses a replay through the stale guard', () => {
    const first = buy(withTokens(10), 'garage', 0)
    // The same dispatch again still claims level 0, which no longer matches.
    assert.equal(buy(first, 'garage', 0), first)
  })

  it('refuses a purchase the Career cannot afford', () => {
    const broke = withTokens(HQ_FACILITY_LEVEL_COSTS[1] - 1)
    assert.equal(buy(broke, 'workshop', 0), broke)
  })

  it('refuses malformed and hostile payloads', () => {
    const state = withTokens(20)
    for (const payload of [
      null,
      42,
      {},
      { facilityId: 'workshop' },
      { facilityId: '__proto__', expectedLevel: 0 },
      { facilityId: 'not_a_facility', expectedLevel: 0 },
      { facilityId: 'workshop', expectedLevel: 5 },
      { facilityId: 'workshop', expectedLevel: Number.NaN }
    ]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY,
          payload
        }),
        state
      )
    }
    assert.equal(
      Object.hasOwn(state.career.hqFacilityLevels, '__proto__'),
      false
    )
  })

  it('narrows a poisoned Token balance before debiting', () => {
    for (const poisoned of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const state = withTokens(poisoned)
      // A non-finite balance cannot afford anything, so nothing is bought and
      // the balance is never carried into arithmetic.
      assert.equal(buy(state, 'workshop', 0), state)
    }
  })

  it('is built by the creator with no cost in the payload', () => {
    const action = createPurchaseExpeditionHqFacilityAction('rehearsal', 0)
    assert.equal(action.type, ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY)
    assert.deepEqual(action.payload, {
      facilityId: 'rehearsal',
      expectedLevel: 0
    })
    assert.equal(Object.hasOwn(action.payload, 'cost'), false)
  })
})

describe('G5 — the load sanitizer holds the same ceiling', () => {
  it('clamps a save that claims an unimplemented level', () => {
    const sanitized = sanitizeCareerState({
      hqFacilityLevels: { workshop: 9, management_office: 9 }
    })
    assert.equal(sanitized.hqFacilityLevels.workshop, 1)
    assert.equal(sanitized.hqFacilityLevels.management_office, 2)
  })

  it('drops a facility the registry does not know', () => {
    // `{ __proto__: 2 }` sets the prototype instead of creating an own key, so
    // the literal never exercised the stripping at all. `JSON.parse` is how a
    // hostile save actually arrives, and it does create the own property.
    const raw = JSON.parse('{"not_a_facility":1,"__proto__":2,"workshop":1}')
    assert.equal(Object.hasOwn(raw, '__proto__'), true)
    const sanitized = sanitizeCareerState({ hqFacilityLevels: raw })
    assert.deepEqual(Object.keys(sanitized.hqFacilityLevels), ['workshop'])
    assert.equal(Object.hasOwn(sanitized.hqFacilityLevels, '__proto__'), false)
  })
})
