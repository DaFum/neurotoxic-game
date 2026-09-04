/**
 * @fileoverview Canonical Expedition build validation and the Career Cash
 * spend boundary.
 *
 * The build is the design's central constraint: the player must not be able to
 * bring every solution, and every axis must resolve against the repository's
 * real ownership state rather than a caller's claim. These suites drive the
 * validator with owned, unowned and hostile candidates, and pin that a wealthy
 * Career cannot spend its way past a run's protected slice.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import {
  canSpendExpeditionCash,
  getExpeditionFuelTopUpCost,
  getExpeditionSpendableCash,
  validateExpeditionBuildCommitment
} from '../../src/domain/expedition/loadout'
import { SONGS_BY_ID } from '../../src/data/songs'
import { CONTRABAND_BY_ID } from '../../src/data/contraband'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig'

const TOUR = 'standard_tour'
const REGION = 'industrial_belt'
const SONG_A = [...SONGS_BY_ID.keys()][0]
const SONG_B = [...SONGS_BY_ID.keys()][1]
const CONTRABAND_A = [...CONTRABAND_BY_ID.keys()][0]
const GUITAR = 'hq_inst_guitar_custom'

const preparedMap = buildExpeditionMap(4242, TOUR, REGION)

const baseCandidate = overrides => ({
  tourTypeId: TOUR,
  regionId: REGION,
  activeTourbusAssetId: null,
  crewIds: [],
  cargo: { spareParts: 0, supplies: 0 },
  starterPerkId: null,
  nativeContracts: [],
  insurancePolicyId: null,
  pressureModifierIds: [],
  ...overrides,
  build: {
    setlistSongIds: [SONG_A],
    equipment: { selectedGearItemIds: [] },
    selectedTourbusModuleIds: [],
    merch: [],
    contraband: [],
    sponsorOfferId: null,
    startingFuelTarget: 100,
    protectedCareerCash: 0,
    ...(overrides?.build ?? {})
  }
})

const validate = (state, overrides) =>
  validateExpeditionBuildCommitment(
    state,
    baseCandidate(overrides),
    preparedMap
  )

const expectReason = (result, reason) => {
  assert.equal(result.valid, false, `expected rejection with ${reason}`)
  assert.equal(result.reason, reason)
}

describe('minimum legal G1A build', () => {
  it('accepts a neutral build on a fresh career', () => {
    const result = validate(createInitialState())
    assert.equal(result.valid, true, JSON.stringify(result))
    assert.deepEqual(result.normalized.build.setlistSongIds, [SONG_A])
    assert.equal(result.normalized.build.sponsorOfferId, null)
    assert.deepEqual(result.normalized.nativeContracts, [])
  })

  it('rebuilds the loadout instead of spreading the candidate', () => {
    const state = createInitialState()
    const candidate = baseCandidate()
    candidate.smuggledField = 'nope'
    candidate.build.smuggledField = 'nope'
    const result = validateExpeditionBuildCommitment(
      state,
      candidate,
      preparedMap
    )
    assert.equal(result.valid, true)
    assert.equal(Object.hasOwn(result.normalized, 'smuggledField'), false)
    assert.equal(Object.hasOwn(result.normalized.build, 'smuggledField'), false)
  })

  it('rejects a non-object candidate', () => {
    for (const candidate of [null, undefined, 42, 'x', []]) {
      const result = validateExpeditionBuildCommitment(
        createInitialState(),
        candidate,
        preparedMap
      )
      expectReason(result, 'MALFORMED_CANDIDATE')
    }
  })
})

describe('tour and region', () => {
  it('rejects an unknown tour or region', () => {
    expectReason(
      validate(createInitialState(), { tourTypeId: 'blitz_tour' }),
      'TOUR_OR_REGION_UNKNOWN'
    )
    expectReason(
      validate(createInitialState(), { regionId: 'underground_network' }),
      'TOUR_OR_REGION_UNKNOWN'
    )
  })

  it('rejects a build assembled against a different prepared route', () => {
    const otherMap = buildExpeditionMap(4242, 'blitz_tour', REGION)
    const result = validateExpeditionBuildCommitment(
      createInitialState(),
      baseCandidate(),
      otherMap
    )
    expectReason(result, 'TOUR_OR_REGION_UNKNOWN')
  })
})

describe('setlist', () => {
  it('requires a non-empty unique setlist of real songs', () => {
    expectReason(
      validate(createInitialState(), { build: { setlistSongIds: [] } }),
      'SETLIST_EMPTY'
    )
    expectReason(
      validate(createInitialState(), {
        build: { setlistSongIds: [SONG_A, SONG_A] }
      }),
      'SETLIST_DUPLICATE'
    )
    expectReason(
      validate(createInitialState(), {
        build: { setlistSongIds: [SONG_A, 'not_a_song'] }
      }),
      'SETLIST_UNKNOWN_SONG'
    )
  })

  it('accepts several real songs in order', () => {
    const result = validate(createInitialState(), {
      build: { setlistSongIds: [SONG_B, SONG_A] }
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.normalized.build.setlistSongIds, [SONG_B, SONG_A])
  })
})

describe('equipment axis', () => {
  const ownGuitar = () => {
    const state = createInitialState()
    state.player.van.upgrades = [GUITAR]
    return state
  }

  it('accepts an owned catalog item', () => {
    const result = validate(ownGuitar(), {
      build: { equipment: { selectedGearItemIds: [GUITAR] } }
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.normalized.build.equipment.selectedGearItemIds, [
      GUITAR
    ])
  })

  it('rejects an unowned item', () => {
    expectReason(
      validate(createInitialState(), {
        build: { equipment: { selectedGearItemIds: [GUITAR] } }
      }),
      'EQUIPMENT_NOT_OWNED'
    )
  })

  it('rejects an unknown item', () => {
    expectReason(
      validate(ownGuitar(), {
        build: { equipment: { selectedGearItemIds: ['not_a_real_item'] } }
      }),
      'EQUIPMENT_NOT_OWNED'
    )
  })

  it('rejects the same owned item twice', () => {
    expectReason(
      validate(ownGuitar(), {
        build: { equipment: { selectedGearItemIds: [GUITAR, GUITAR] } }
      }),
      'EQUIPMENT_DUPLICATE'
    )
  })

  it('rejects a fourth item', () => {
    const owned = [
      GUITAR,
      'hq_inst_guitar_flying_v',
      'hq_inst_drum_trigger',
      'hq_inst_cowbell_inferno'
    ]
    const state = createInitialState()
    state.player.van.upgrades = owned
    expectReason(
      validate(state, { build: { equipment: { selectedGearItemIds: owned } } }),
      'EQUIPMENT_TOO_MANY_ITEMS'
    )
  })
})

describe('chassis and module drift', () => {
  const withChassis = installedModuleId => {
    const state = createInitialState()
    const tier = CHASSIS_CONFIG.tourbus_chassis.legit[1]
    state.assets = [
      {
        id: 'asset_bus',
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 90,
        baseUpkeep: tier.upkeep,
        baseDailyRevenue: tier.revenue,
        slots: [
          {
            id: 'slot_1',
            slotType: 'tb_roof',
            position: { x: 0.5, y: 0.2 },
            installedModuleId
          }
        ],
        acquiredOnDay: 2,
        acquisitionMode: 'cash',
        baseRiskEventChance: tier.baseRiskEventChance
      }
    ]
    return state
  }

  it('accepts the exact installed module set', () => {
    const result = validate(withChassis('tb_module_a'), {
      activeTourbusAssetId: 'asset_bus',
      build: { selectedTourbusModuleIds: ['tb_module_a'] }
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.normalized.build.selectedTourbusModuleIds, [
      'tb_module_a'
    ])
  })

  it('rejects a module the chassis does not have installed', () => {
    expectReason(
      validate(withChassis('tb_module_a'), {
        activeTourbusAssetId: 'asset_bus',
        build: { selectedTourbusModuleIds: ['tb_module_b'] }
      }),
      'MODULES_DRIFT'
    )
  })

  it('rejects an installed module the build omits', () => {
    expectReason(
      validate(withChassis('tb_module_a'), {
        activeTourbusAssetId: 'asset_bus',
        build: { selectedTourbusModuleIds: [] }
      }),
      'MODULES_DRIFT'
    )
  })

  it('rejects modules without a committed chassis', () => {
    expectReason(
      validate(createInitialState(), {
        build: { selectedTourbusModuleIds: ['tb_module_a'] }
      }),
      'MODULES_DRIFT'
    )
  })

  it('rejects an unowned or wrong-kind chassis id', () => {
    expectReason(
      validate(createInitialState(), { activeTourbusAssetId: 'asset_ghost' }),
      'MODULES_DRIFT'
    )
    const state = withChassis(null)
    state.assets[0].kind = 'studio_chassis'
    expectReason(
      validate(state, { activeTourbusAssetId: 'asset_bus' }),
      'MODULES_DRIFT'
    )
  })

  it('accepts an empty module set on an empty chassis', () => {
    const result = validate(withChassis(null), {
      activeTourbusAssetId: 'asset_bus'
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.normalized.build.selectedTourbusModuleIds, [])
  })
})

describe('merch and contraband drawn from owned stock', () => {
  it('accepts a quantity the band actually owns', () => {
    const result = validate(createInitialState(), {
      build: { merch: [{ inventoryKey: 'shirts', quantity: 10 }] }
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.normalized.build.merch, [
      { inventoryKey: 'shirts', quantity: 10 }
    ])
  })

  it('rejects more merch than owned', () => {
    expectReason(
      validate(createInitialState(), {
        build: { merch: [{ inventoryKey: 'shirts', quantity: 10_000 }] }
      }),
      'MERCH_NOT_OWNED'
    )
  })

  it('rejects an unknown, duplicated or hostile merch key', () => {
    for (const merch of [
      [{ inventoryKey: 'gold_bars', quantity: 1 }],
      [
        { inventoryKey: 'shirts', quantity: 1 },
        { inventoryKey: 'shirts', quantity: 1 }
      ],
      [{ inventoryKey: '__proto__', quantity: 1 }],
      [{ inventoryKey: 'shirts', quantity: 0 }],
      [{ inventoryKey: 'shirts', quantity: 1.5 }],
      [{ inventoryKey: 'shirts', quantity: Number.NaN }]
    ]) {
      expectReason(
        validate(createInitialState(), { build: { merch } }),
        'MERCH_NOT_OWNED'
      )
    }
  })

  it('accepts contraband stacks the stash actually holds', () => {
    const state = createInitialState()
    state.band.stash[CONTRABAND_A] = { stacks: 3, instanceId: 'inst_a' }
    const result = validate(state, {
      build: {
        contraband: [
          { stashKey: CONTRABAND_A, instanceId: 'inst_a', stacks: 2 }
        ]
      }
    })
    assert.equal(result.valid, true)
    assert.deepEqual(result.normalized.build.contraband, [
      { stashKey: CONTRABAND_A, instanceId: 'inst_a', stacks: 2 }
    ])
  })

  it('rejects contraband that is not in the stash', () => {
    expectReason(
      validate(createInitialState(), {
        build: {
          contraband: [{ stashKey: CONTRABAND_A, instanceId: null, stacks: 1 }]
        }
      }),
      'CONTRABAND_NOT_OWNED'
    )
  })

  it('rejects more stacks than owned and a mismatched instance', () => {
    const state = createInitialState()
    state.band.stash[CONTRABAND_A] = { stacks: 1, instanceId: 'inst_a' }
    expectReason(
      validate(state, {
        build: {
          contraband: [{ stashKey: CONTRABAND_A, instanceId: null, stacks: 5 }]
        }
      }),
      'CONTRABAND_NOT_OWNED'
    )
    expectReason(
      validate(state, {
        build: {
          contraband: [
            { stashKey: CONTRABAND_A, instanceId: 'inst_other', stacks: 1 }
          ]
        }
      }),
      'CONTRABAND_NOT_OWNED'
    )
  })

  it('rejects an unknown contraband id', () => {
    const state = createInitialState()
    state.band.stash.not_real = { stacks: 5 }
    expectReason(
      validate(state, {
        build: {
          contraband: [{ stashKey: 'not_real', instanceId: null, stacks: 1 }]
        }
      }),
      'CONTRABAND_NOT_OWNED'
    )
  })
})

describe('later-gate axes stay neutral in G1A', () => {
  it('rejects a sponsor offer before G4 prepares any', () => {
    expectReason(
      validate(createInitialState(), {
        build: { sponsorOfferId: 'sponsor_offer_1' }
      }),
      'SPONSOR_OFFER_UNKNOWN'
    )
  })

  it('rejects a native contract before G4 defines templates', () => {
    expectReason(
      validate(createInitialState(), {
        nativeContracts: [{ templateId: 'contract_a', targetNodeId: null }]
      }),
      'NATIVE_CONTRACT_INVALID'
    )
  })

  it('rejects crew before G3 defines a roster', () => {
    expectReason(
      validate(createInitialState(), { crewIds: ['crew_scout'] }),
      'CREW_DUPLICATE'
    )
  })

  it('rejects tour pressure modifiers before G5 unlocks Ascension', () => {
    expectReason(
      validate(createInitialState(), { pressureModifierIds: ['bad_roads'] }),
      'PRESSURE_MODIFIERS_INVALID'
    )
    expectReason(
      validate(createInitialState(), {
        pressureModifierIds: ['bad_roads', 'bad_roads']
      }),
      'PRESSURE_MODIFIERS_INVALID'
    )
  })

  it('rejects an insurance policy before G2 defines any', () => {
    expectReason(
      validate(createInitialState(), { insurancePolicyId: 'policy_basic' }),
      'MALFORMED_CANDIDATE'
    )
  })
})

describe('fuel target and protected career cash', () => {
  it('requires a target at or above the current level', () => {
    const state = createInitialState()
    state.player.van.fuel = 60
    expectReason(
      validate(state, { build: { startingFuelTarget: 59 } }),
      'FUEL_TARGET_OUT_OF_RANGE'
    )
    assert.equal(
      validate(state, { build: { startingFuelTarget: 60 } }).valid,
      true
    )
    assert.equal(
      validate(state, { build: { startingFuelTarget: 100 } }).valid,
      true
    )
  })

  it('rejects a target above a full tank or a fractional one', () => {
    const state = createInitialState()
    for (const startingFuelTarget of [101, 100.5, -1, Number.NaN]) {
      expectReason(
        validate(state, { build: { startingFuelTarget } }),
        'FUEL_TARGET_OUT_OF_RANGE'
      )
    }
  })

  it('rejects protecting more cash than the player has', () => {
    const state = createInitialState()
    state.player.money = 500
    assert.equal(
      validate(state, { build: { protectedCareerCash: 500 } }).valid,
      true
    )
    expectReason(
      validate(state, { build: { protectedCareerCash: 501 } }),
      'PROTECTED_CASH_OUT_OF_RANGE'
    )
    for (const protectedCareerCash of [-1, 10.5, Number.POSITIVE_INFINITY]) {
      expectReason(
        validate(state, { build: { protectedCareerCash } }),
        'PROTECTED_CASH_OUT_OF_RANGE'
      )
    }
  })

  it('prices a partial top-up from the canonical fuel price', () => {
    assert.equal(getExpeditionFuelTopUpCost(100, 100), 0)
    assert.equal(getExpeditionFuelTopUpCost(60, 60), 0)
    // 40 litres at 1.75 €/l, rounded up.
    assert.equal(getExpeditionFuelTopUpCost(60, 100), 70)
    assert.equal(getExpeditionFuelTopUpCost(60, 80), 35)
    // A target below the current level is not a refund.
    assert.equal(getExpeditionFuelTopUpCost(80, 60), 0)
    assert.equal(getExpeditionFuelTopUpCost(Number.NaN, 100), 175)
  })

  it('rejects cargo counts that cannot exist', () => {
    for (const cargo of [
      { spareParts: -1, supplies: 0 },
      { spareParts: 0, supplies: 1.5 },
      { spareParts: Number.NaN, supplies: 0 }
    ]) {
      expectReason(
        validate(createInitialState(), { cargo }),
        'CARGO_OUT_OF_RANGE'
      )
    }
  })
})

describe('career cash spend boundary', () => {
  const activeRun = (money, protectedCareerCash) => {
    const state = createInitialState()
    state.player.money = money
    state.expedition = {
      ...createDefaultExpeditionState(),
      status: 'active',
      runId: 'run_1',
      protectedCareerCash
    }
    return state
  }

  it('spends the full balance outside a run', () => {
    const state = createInitialState()
    state.player.money = 9000
    assert.equal(getExpeditionSpendableCash(state), 9000)
    assert.equal(canSpendExpeditionCash(state, 9000), true)
  })

  it('withholds the protected slice during a run', () => {
    const state = activeRun(9000, 8500)
    assert.equal(getExpeditionSpendableCash(state), 500)
    assert.equal(canSpendExpeditionCash(state, 500), true)
    assert.equal(canSpendExpeditionCash(state, 501), false)
  })

  it('stops a wealthy career from trivializing run safety', () => {
    // The whole point of the protected slice: a 250k Career balance must not
    // make an in-run rescue free.
    const state = activeRun(250_000, 250_000)
    assert.equal(getExpeditionSpendableCash(state), 0)
    assert.equal(canSpendExpeditionCash(state, 1), false)
  })

  it('never reports a negative spendable balance', () => {
    assert.equal(getExpeditionSpendableCash(activeRun(100, 500)), 0)
    assert.equal(getExpeditionSpendableCash(activeRun(-50, 0)), 0)
  })

  it('rejects a malformed spend amount rather than treating it as free', () => {
    const state = activeRun(9000, 0)
    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      assert.equal(canSpendExpeditionCash(state, amount), false)
    }
  })
})
