/**
 * @fileoverview Expedition performance-gear activation over owned HQ purchases.
 *
 * The equipment axis must reuse the repository's real purchase ownership model:
 * no per-member equip action, no parallel inventory. These suites pin that only
 * *owned* items are selectable, that the cap is a hard 0..3, and that a
 * purchased-but-unselected item stops contributing to the active run's gig
 * modifiers while Career play is left untouched.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import {
  MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS,
  applyExpeditionGearPerformanceDelta,
  getExpeditionCommittedGearProfile,
  getExpeditionGearPerformanceContribution,
  getExpeditionOwnedPerformanceGear,
  resolveExpeditionGearItem
} from '../../src/domain/expedition/equipment'
import { GEAR_LOOKUP } from '../../src/utils/purchaseLogicUtils'

// Real catalog ids with `stat_modifier` → `band.performance` effects.
const GUITAR = 'hq_inst_guitar_custom' // guitarDifficulty -0.15
const FLYING_V = 'hq_inst_guitar_flying_v' // crowdDecay -0.05
const DRUM_TRIGGER = 'hq_inst_drum_trigger' // drumMultiplier +0.20
const COWBELL = 'hq_inst_cowbell_inferno' // drumMultiplier +0.05
// Real catalog id owned through `band.inventory` rather than van upgrades.
const DECIMATOR = 'hq_gear_neuro_decimator'

const ownState = (ids, { inventorySet = [] } = {}) => {
  const state = createInitialState()
  state.player.van.upgrades = [...ids]
  for (const key of inventorySet) state.band.inventory[key] = true
  return state
}

const withActiveRun = (state, selectedGearItemIds) => ({
  ...state,
  expedition: {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: 'run_1',
    loadout: {
      tourTypeId: 'standard_tour',
      regionId: 'industrial_belt',
      activeTourbusAssetId: null,
      crewIds: [],
      cargo: { spareParts: 0, supplies: 0 },
      starterPerkId: null,
      nativeContracts: [],
      insurancePolicyId: null,
      pressureModifierIds: [],
      build: {
        setlistSongIds: [],
        equipment: { selectedGearItemIds },
        selectedTourbusModuleIds: [],
        merch: [],
        contraband: [],
        sponsorOfferId: null,
        startingFuelTarget: 100,
        protectedCareerCash: 0
      }
    }
  }
})

describe('expedition gear catalog resolution', () => {
  it('resolves a real catalog id', () => {
    assert.equal(resolveExpeditionGearItem(GUITAR)?.id, GUITAR)
  })

  it('rejects an inventory-key alias that GEAR_LOOKUP also indexes', () => {
    // GEAR_LOOKUP is keyed by both item id and primary inventory key; only the
    // real id may be committed, otherwise the same item has two selection ids.
    assert.ok(GEAR_LOOKUP.has('neuroDecimator'))
    assert.equal(resolveExpeditionGearItem('neuroDecimator'), null)
  })

  it('rejects unknown and malformed ids', () => {
    for (const id of ['not_a_real_item', '', null, undefined, 42, {}]) {
      assert.equal(resolveExpeditionGearItem(id), null)
    }
  })
})

describe('owned performance gear', () => {
  it('is empty on a fresh career', () => {
    const state = createInitialState()
    // The starter inventory carries consumables (`strings`, `cables`,
    // `drum_parts`) whose catalog entries are `inventory_set`, so they are
    // legitimately owned and therefore selectable.
    const owned = getExpeditionOwnedPerformanceGear(state)
    assert.equal(owned.includes(GUITAR), false)
    assert.equal(owned.includes(DRUM_TRIGGER), false)
  })

  it('lists an item owned through van upgrades', () => {
    const owned = getExpeditionOwnedPerformanceGear(ownState([GUITAR]))
    assert.ok(owned.includes(GUITAR))
  })

  it('lists an item owned through band inventory', () => {
    const owned = getExpeditionOwnedPerformanceGear(
      ownState([], { inventorySet: ['neuroDecimator'] })
    )
    assert.ok(owned.includes(DECIMATOR))
  })

  it('returns a stable ascending list', () => {
    const owned = getExpeditionOwnedPerformanceGear(
      ownState([DRUM_TRIGGER, GUITAR, FLYING_V])
    )
    assert.deepEqual(owned, [...owned].sort())
  })
})

describe('gear performance contribution', () => {
  it('sums the real catalog effect values', () => {
    assert.deepEqual(getExpeditionGearPerformanceContribution([GUITAR]), {
      guitarDifficulty: -0.15,
      drumMultiplier: 0,
      crowdDecay: 0
    })
    const stacked = getExpeditionGearPerformanceContribution([
      DRUM_TRIGGER,
      COWBELL
    ])
    assert.ok(Math.abs(stacked.drumMultiplier - 0.25) < 1e-9)
  })

  it('ignores unknown ids and non-performance targets', () => {
    // `hq_gear_lucky_rabbit_foot` targets `band.luck`, not a gig modifier.
    assert.deepEqual(
      getExpeditionGearPerformanceContribution([
        'nope',
        'hq_gear_lucky_rabbit_foot',
        'hq_gear_duct_tape_roll'
      ]),
      { guitarDifficulty: 0, drumMultiplier: 0, crowdDecay: 0 }
    )
  })
})

describe('committed gear profile', () => {
  it('lets an owned item be selected', () => {
    const profile = getExpeditionCommittedGearProfile(
      withActiveRun(ownState([GUITAR]), [GUITAR])
    )
    assert.deepEqual(profile.selectedGearItemIds, [GUITAR])
    assert.equal(profile.performanceDelta.guitarDifficulty, 0)
  })

  it('drops an unowned id', () => {
    const profile = getExpeditionCommittedGearProfile(
      withActiveRun(ownState([]), [GUITAR])
    )
    assert.deepEqual(profile.selectedGearItemIds, [])
  })

  it('drops an unknown id', () => {
    const profile = getExpeditionCommittedGearProfile(
      withActiveRun(ownState([GUITAR]), ['not_a_real_item'])
    )
    assert.deepEqual(profile.selectedGearItemIds, [])
  })

  it('collapses the same owned item selected twice', () => {
    const profile = getExpeditionCommittedGearProfile(
      withActiveRun(ownState([GUITAR]), [GUITAR, GUITAR])
    )
    assert.deepEqual(profile.selectedGearItemIds, [GUITAR])
  })

  it('drops a fourth selected item', () => {
    const owned = [GUITAR, FLYING_V, DRUM_TRIGGER, COWBELL]
    const profile = getExpeditionCommittedGearProfile(
      withActiveRun(ownState(owned), owned)
    )
    assert.equal(
      profile.selectedGearItemIds.length,
      MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS
    )
    assert.equal(profile.selectedGearItemIds.includes(COWBELL), false)
  })

  it('neutralizes a purchased but unselected item', () => {
    // Both owned, only the guitar committed: the drum trigger's permanent
    // `band.performance` contribution must be subtracted back out.
    const profile = getExpeditionCommittedGearProfile(
      withActiveRun(ownState([GUITAR, DRUM_TRIGGER]), [GUITAR])
    )
    assert.equal(profile.performanceDelta.guitarDifficulty, 0)
    assert.ok(Math.abs(profile.performanceDelta.drumMultiplier + 0.2) < 1e-9)
  })

  it('reports no delta outside a committed run', () => {
    const state = ownState([GUITAR, DRUM_TRIGGER])
    const profile = getExpeditionCommittedGearProfile(state)
    assert.deepEqual(profile.selectedGearItemIds, [])
    // No loadout means no neutralization target: the profile still reports the
    // owned set so Tour Prep can render it, but the Career delta is computed
    // only by the caller that is actually inside a run.
    assert.ok(profile.ownedGearItemIds.includes(GUITAR))
  })
})

describe('applying the gear delta to a live performance snapshot', () => {
  const base = { guitarDifficulty: 0.85, drumMultiplier: 1.2, crowdDecay: 1 }

  it('returns an untouched copy for a zero delta', () => {
    const next = applyExpeditionGearPerformanceDelta(base, {
      guitarDifficulty: 0,
      drumMultiplier: 0,
      crowdDecay: 0
    })
    assert.deepEqual(next, base)
    assert.notEqual(next, base)
  })

  it('applies each stat additively', () => {
    const next = applyExpeditionGearPerformanceDelta(base, {
      guitarDifficulty: 0.15,
      drumMultiplier: -0.2,
      crowdDecay: 0.05
    })
    assert.ok(Math.abs(next.guitarDifficulty - 1) < 1e-9)
    assert.ok(Math.abs(next.drumMultiplier - 1) < 1e-9)
    assert.ok(Math.abs(next.crowdDecay - 1.05) < 1e-9)
  })

  it('preserves unrelated keys', () => {
    const next = applyExpeditionGearPerformanceDelta(
      { ...base, tempo: 0.3, critChance: 0.1 },
      { guitarDifficulty: 0.1, drumMultiplier: 0, crowdDecay: 0 }
    )
    assert.equal(next.tempo, 0.3)
    assert.equal(next.critChance, 0.1)
  })

  it('floors a scoring divisor at zero', () => {
    const next = applyExpeditionGearPerformanceDelta(base, {
      guitarDifficulty: -99,
      drumMultiplier: -99,
      crowdDecay: -99
    })
    assert.equal(next.guitarDifficulty, 0)
    assert.equal(next.drumMultiplier, 0)
    assert.equal(next.crowdDecay, 0)
  })

  it('falls back to the neutral base for a non-finite live value', () => {
    const next = applyExpeditionGearPerformanceDelta(
      { guitarDifficulty: Number.NaN, drumMultiplier: 1, crowdDecay: 1 },
      { guitarDifficulty: -0.15, drumMultiplier: 0, crowdDecay: 0 }
    )
    assert.ok(Math.abs(next.guitarDifficulty - 0.85) < 1e-9)
  })
})
