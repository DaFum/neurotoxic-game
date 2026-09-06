/**
 * @fileoverview G5 Task 8 — every legacy HQ/Van entry is classified.
 *
 * The catalog predates Expeditions, so applying it untouched would let a
 * Career buy Expedition advantage with Cash instead of earning it. The design
 * closure classifies all 28 entries, so there is no implicit fallback left:
 * an entry appearing in the catalog without a policy fails here.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog'
import {
  classifyExpeditionLegacyHqItem,
  doesLegacyHqItemTouchExpedition,
  isExpeditionLegacyHqEffectActive,
  isExpeditionLegacyHqPurchaseAllowed
} from '../../src/domain/expedition/legacyHqPolicy'
import { calculateDailyUpdates } from '../../src/utils/simulationUtils'
import { startedState } from '../expeditionLifecycleFixture.js'

const catalog = getUnifiedUpgradeCatalog()

/** The closure's binding table: every catalog id and the policy it carries. */
const EXPECTED_POLICY = {
  hq_van_sound_system: 'between_tours_only',
  hq_van_mattress: 'between_tours_only',
  hq_van_sleeping_bags: 'between_tours_only',
  hq_van_tape_glue: 'between_tours_only',
  hq_room_coffee: 'between_tours_only',
  hq_room_sofa: 'between_tours_only',
  hq_room_old_couch: 'between_tours_only',
  hq_room_cheap_beer_fridge: 'between_tours_only',
  hq_room_diy_soundproofing: 'between_tours_only',

  hq_van_suspension: 'requires_roadtested',
  hq_van_tyre_spare: 'requires_roadtested',
  hq_van_paint_job: 'requires_roadtested',
  hq_van_spoiler: 'requires_roadtested',
  hq_van_disco: 'requires_roadtested',
  hq_room_cat: 'requires_roadtested',
  hq_room_marketing: 'requires_roadtested',
  hq_room_poster_wall: 'requires_roadtested',
  hq_room_shrine: 'requires_roadtested',
  hq_room_void_altar: 'requires_roadtested',
  hq_room_skull: 'requires_roadtested',
  social_bot: 'requires_roadtested',

  hq_van_tuning: 'requires_headliner',
  hq_van_flamethrower: 'requires_headliner',
  hq_room_beer_pipeline: 'requires_headliner',
  label_contact: 'requires_headliner',

  hq_van_storage: 'requires_capability',
  pr_manager_contract: 'requires_capability',
  hq_room_label: 'requires_capability'
}

/** Career counters that derive each rank, plus the slice's other fields. */
const careerAt = (rank, overrides = {}) => {
  const base = startedState({ money: 5000 })
  const counters =
    rank === 'headliner'
      ? {
          finalizedExpeditionRuns: 5,
          completedExpeditionRuns: 5,
          completedExpeditionRegionIds: ['home_turf', 'festival_fields']
        }
      : rank === 'roadtested'
        ? {
            finalizedExpeditionRuns: 2,
            completedExpeditionRuns: 1,
            completedExpeditionRegionIds: []
          }
        : {
            finalizedExpeditionRuns: 1,
            completedExpeditionRuns: 0,
            completedExpeditionRegionIds: []
          }
  return { ...base.career, ...counters, ...overrides }
}

describe('G5 — the catalog has no unclassified Expedition advantage', () => {
  it('names every catalog entry, van included', () => {
    assert.equal(catalog.length, Object.keys(EXPECTED_POLICY).length)
    for (const item of catalog) {
      const id = String(item.id)
      assert.ok(
        Object.hasOwn(EXPECTED_POLICY, id),
        `${id} carries no explicit policy`
      )
      assert.equal(
        classifyExpeditionLegacyHqItem(item).kind,
        EXPECTED_POLICY[id],
        id
      )
    }
  })

  it('leaves no entry on the implicit unaffected fallback', () => {
    // The closure's point: nothing currently purchasable is silently harmless.
    const unaffected = catalog.filter(
      item => classifyExpeditionLegacyHqItem(item).kind === 'unaffected'
    )
    assert.deepEqual(
      unaffected.map(item => String(item.id)),
      []
    )
  })

  it('treats an unrecognized effect shape as touching', () => {
    // A new effect type must not be assumed inert when it is classified.
    assert.equal(
      doesLegacyHqItemTouchExpedition({
        id: 'invented',
        cost: 1,
        effects: [{ type: 'brand_new_effect_kind' }]
      }),
      true
    )
  })
})

describe('G5 — a fresh Career buys no Expedition advantage', () => {
  it('blocks every catalog entry before the first finalized run', () => {
    const fresh = careerAt('rookie', {
      finalizedExpeditionRuns: 0,
      completedExpeditionRuns: 0,
      unlockedSetIds: ['chassis_network', 'industry_network']
    })
    for (const item of catalog) {
      assert.equal(
        isExpeditionLegacyHqPurchaseAllowed(fresh, 'idle', String(item.id)),
        false,
        `${item.id} must not be purchasable by a fresh Career`
      )
    }
  })

  it('leaves a Shop item outside the unified catalog untouched', () => {
    // The Shop and Upgrades tabs share one purchase path, so the gate must be
    // inert for gear: `hq_gear_strings` is Shop-only and not in the catalog.
    assert.ok(
      catalog.every(item => String(item.id) !== 'hq_gear_strings'),
      'hq_gear_strings is in the unified catalog and no longer proves this'
    )
    const fresh = careerAt('rookie', { finalizedExpeditionRuns: 0 })
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(fresh, 'active', 'hq_gear_strings'),
      true
    )
  })
})

describe('G5 — the gates are the ranks and capabilities they name', () => {
  it('opens a roadtested item only at that rank', () => {
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('rookie'),
        'idle',
        'hq_van_suspension'
      ),
      false
    )
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('roadtested'),
        'idle',
        'hq_van_suspension'
      ),
      true
    )
  })

  it('opens a headliner item only at that rank', () => {
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('roadtested'),
        'idle',
        'hq_van_tuning'
      ),
      false
    )
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('headliner'),
        'idle',
        'hq_van_tuning'
      ),
      true
    )
  })

  it('opens a capability item only once its own set is owned', () => {
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('headliner'),
        'idle',
        'hq_van_storage'
      ),
      false
    )
    // A different owned set is not a substitute for the one the entry names.
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('headliner', { unlockedSetIds: ['industry_network'] }),
        'idle',
        'hq_van_storage'
      ),
      false
    )
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('headliner', { unlockedSetIds: ['chassis_network'] }),
        'idle',
        'hq_van_storage'
      ),
      true
    )
  })

  it('ignores rank for a capability item', () => {
    // The set is the whole gate: a roadtested Career that owns it may buy.
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(
        careerAt('roadtested', { unlockedSetIds: ['industry_network'] }),
        'idle',
        'pr_manager_contract'
      ),
      true
    )
  })
})

describe('G5 — between-tours items keep ownership but not their effect', () => {
  it('refuses the purchase while a run is prepared or active', () => {
    const career = careerAt('headliner')
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(career, 'idle', 'hq_room_coffee'),
      true
    )
    for (const status of ['prepared', 'active']) {
      assert.equal(
        isExpeditionLegacyHqPurchaseAllowed(career, status, 'hq_room_coffee'),
        false,
        status
      )
    }
  })

  it('suppresses the effect inside an active run only', () => {
    assert.equal(
      isExpeditionLegacyHqEffectActive(true, 'hq_room_coffee'),
      false
    )
    assert.equal(
      isExpeditionLegacyHqEffectActive(false, 'hq_room_coffee'),
      true
    )
  })

  it("leaves a gated item's effect alone once owned", () => {
    // `requires_*` blocks the purchase, never the effect of what is owned.
    assert.equal(
      isExpeditionLegacyHqEffectActive(true, 'hq_van_suspension'),
      true
    )
  })

  it('is permissive for an id the catalog does not have', () => {
    assert.equal(isExpeditionLegacyHqEffectActive(true, 'nope'), true)
    assert.equal(
      isExpeditionLegacyHqPurchaseAllowed(careerAt('rookie'), 'active', 'nope'),
      true
    )
  })
})

describe('G5 — the daily tick honours the between-tours suppression', () => {
  /** A band that owns every comfort upgrade, at a chosen run status. */
  const dayWithComfort = status => {
    const base = startedState({ money: 5000 })
    return calculateDailyUpdates({
      ...base,
      expedition: { ...base.expedition, status },
      player: {
        ...base.player,
        day: 1,
        money: 1000,
        hqUpgrades: [
          'hq_room_coffee',
          'hq_room_cheap_beer_fridge',
          'hq_room_sofa',
          'hq_room_old_couch',
          'hq_room_diy_soundproofing'
        ],
        van: { ...base.player.van, condition: 100 }
      },
      band: {
        ...base.band,
        members: [{ name: 'Matze', mood: 50, stamina: 50 }],
        harmony: 50
      },
      social: { ...base.social, instagram: 100 }
    })
  }

  it('pays the comfort bonuses between tours', () => {
    const { band } = dayWithComfort('idle')
    // 50 + 2 (coffee) + 1 (beer fridge); 50 - 5 decay + 3 (sofa) + 1 (couch).
    assert.equal(band.members[0].mood, 53)
    assert.equal(band.members[0].stamina, 49)
    assert.equal(band.harmony, 51)
  })

  it('pays none of them inside an active run', () => {
    const { band } = dayWithComfort('active')
    // Ownership is untouched; the recovery simply does not follow the band.
    assert.equal(band.members[0].mood, 50)
    assert.equal(band.members[0].stamina, 45)
    assert.equal(band.harmony, 50)
  })
})
