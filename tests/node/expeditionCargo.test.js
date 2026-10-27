import test from 'node:test'
import assert from 'node:assert/strict'
import {
  countPackedContraband,
  creditPackedContraband,
  debitPackedContraband,
  getCarriedContrabandStash,
  isPackedContrabandEntry,
  materializeExpeditionCargo,
  getExpeditionCargoView
} from '../../src/domain/expedition/cargo'
import { validateExpeditionBuildCommitment } from '../../src/domain/expedition/loadout'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import {
  BASE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID,
  NEUTRAL_EXPEDITION_ROUTE_PROFILE
} from '../../src/domain/expedition/defaults'
import { createInitialState } from '../../src/context/initialState'
import { SONGS_BY_ID } from '../../src/data/songs'

const TOUR = BASE_EXPEDITION_TOUR_TYPE_ID
const REGION = BASE_EXPEDITION_REGION_ID
const SONG_A = [...SONGS_BY_ID.keys()][0]
const GEAR_1 = 'hq_inst_guitar_custom'
const GEAR_2 = 'hq_inst_guitar_flying_v'
const GEAR_3 = 'hq_inst_drum_trigger'
const GEAR_4 = 'hq_inst_cowbell_inferno'

test('Task 4: Expedition Cargo Manifest and Capacity Model', async t => {
  const seed = 12345
  const map = buildExpeditionMap(
    seed,
    TOUR,
    REGION,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )

  const createBaseCandidate = overrides => ({
    tourTypeId: TOUR,
    regionId: REGION,
    activeTourbusAssetId: null,
    crewIds: [],
    cargo: { spareParts: 2, supplies: 2 },
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
      startingFuelTarget: 50,
      protectedCareerCash: 0,
      ...(overrides?.build ?? {})
    }
  })

  const createBaseState = () => {
    const state = createInitialState()
    state.runSeed = seed
    state.player.money = 5000
    state.player.van = {
      fuel: 50,
      condition: 100,
      upgrades: [GEAR_1, GEAR_2, GEAR_3, GEAR_4]
    }
    // The subject here is cargo capacity, not bookability. `industrial_belt`
    // and the higher-tier chassis these expectations are pinned to are both
    // sold from G5 on, so the booking rights are granted explicitly rather
    // than letting a Region or chassis gate decide a capacity assertion.
    state.career = {
      ...state.career,
      unlockedSetIds: ['mechanic_network', 'chassis_network']
    }
    return state
  }

  await t.test(
    'three selected gear items consume three cargo slots and validate when within capacity',
    () => {
      const state = createBaseState()
      const candidate = createBaseCandidate()
      candidate.build.equipment.selectedGearItemIds = [GEAR_1, GEAR_2, GEAR_3]
      // 3 gear + 2 spare parts + 2 supplies = 7 slots (capacity is 8)
      const result = validateExpeditionBuildCommitment(state, candidate, map)
      assert.equal(result.valid, true)
      if (!result.valid) return

      const materialized = materializeExpeditionCargo(result.normalized, state)
      assert.equal(materialized.technicalGearItemIds.length, 3)
      assert.equal(materialized.spareParts, 2)
      assert.equal(materialized.supplies, 2)
    }
  )

  await t.test(
    'fourth G1 gear selection is rejected as EQUIPMENT_TOO_MANY_ITEMS before cargo capacity',
    () => {
      const state = createBaseState()
      const candidate = createBaseCandidate()
      candidate.build.equipment.selectedGearItemIds = [
        GEAR_1,
        GEAR_2,
        GEAR_3,
        GEAR_4
      ]
      const result = validateExpeditionBuildCommitment(state, candidate, map)
      assert.equal(result.valid, false)
      if (!result.valid) {
        assert.equal(result.reason, 'EQUIPMENT_TOO_MANY_ITEMS')
      }
    }
  )

  await t.test(
    'selected gear + merch + parts cannot exceed visible capacity',
    () => {
      const state = createBaseState()
      const candidate = createBaseCandidate()
      // Capacity = 8 (default compact with no modules)
      // 3 gear + 4 parts + 2 supplies = 9 slots > 8
      candidate.build.equipment.selectedGearItemIds = [GEAR_1, GEAR_2, GEAR_3]
      candidate.cargo = { spareParts: 4, supplies: 2 }
      const result = validateExpeditionBuildCommitment(state, candidate, map)
      assert.equal(result.valid, false)
      if (!result.valid) {
        assert.equal(result.reason, 'CARGO_OVER_CAPACITY')
      }
    }
  )

  await t.test(
    'hidden Contraband capacity cannot carry merch/gear/supplies',
    () => {
      // DIY tier 3 (armored_hauler): cargoCapacityBonus = 4 (visible: 8+4=12), hiddenContrabandCapacity = 2
      const state = createBaseState()
      state.assets = [
        {
          id: 'tb_hauler',
          kind: 'tourbus_chassis',
          chassisFlavor: 'diy',
          chassisTier: 3,
          slots: []
        }
      ]
      const candidate = createBaseCandidate()
      candidate.activeTourbusAssetId = 'tb_hauler'

      // Visible items: 3 gear + 7 spare parts + 3 supplies = 13 visible slots > 12
      // Hidden capacity of 2 should NOT absorb any gear/parts/supplies
      candidate.build.equipment.selectedGearItemIds = [GEAR_1, GEAR_2, GEAR_3]
      candidate.cargo = { spareParts: 7, supplies: 3 }
      const result = validateExpeditionBuildCommitment(state, candidate, map)
      assert.equal(result.valid, false)
      if (!result.valid) {
        assert.equal(result.reason, 'CARGO_OVER_CAPACITY')
      }
    }
  )

  await t.test(
    'unselected owned gear does not enter cargo view or active modifier profile',
    () => {
      const state = createBaseState()
      // Player owns 4 gear items, commits only 1
      const candidate = createBaseCandidate()
      candidate.build.equipment.selectedGearItemIds = [GEAR_1]
      const validation = validateExpeditionBuildCommitment(
        state,
        candidate,
        map
      )
      assert.equal(validation.valid, true)
      if (!validation.valid) return

      const cargo = materializeExpeditionCargo(validation.normalized, state)
      state.expedition = {
        status: 'active',
        loadout: validation.normalized,
        cargo
      }

      const cargoView = getExpeditionCargoView(state)
      assert.equal(cargoView.technicalGearItemIds.length, 1)
      assert.equal(cargoView.technicalGearItemIds[0], GEAR_1)
      assert.equal(cargoView.technicalGearItemIds.includes(GEAR_2), false)
      assert.equal(cargoView.technicalGearItemIds.includes(GEAR_3), false)
    }
  )
})

test('isPackedContrabandEntry matches id, positive stacks and instance', () => {
  const packed = (instanceId, stacks = 1) => ({
    stashKey: 'item_a',
    instanceId,
    stacks
  })

  assert.equal(isPackedContrabandEntry(packed('i1'), 'item_a', 'i1'), true)
  // A null packed instance covers any instance of the same contraband.
  assert.equal(isPackedContrabandEntry(packed(null), 'item_a', 'i2'), true)
  assert.equal(isPackedContrabandEntry(packed(null), 'item_a', undefined), true)
  assert.equal(isPackedContrabandEntry(packed('i1'), 'item_a', 'i2'), false)
  assert.equal(
    isPackedContrabandEntry(packed('i1'), 'item_a', undefined),
    false
  )
  assert.equal(isPackedContrabandEntry(packed('i1'), 'item_b', 'i1'), false)
  assert.equal(isPackedContrabandEntry(packed('i1', 0), 'item_a', 'i1'), false)
})

test('packed contraband helpers count, debit and credit by id', () => {
  const manifest = [
    { stashKey: 'item_a', instanceId: 'i1', stacks: 2 },
    { stashKey: 'item_b', instanceId: null, stacks: 1 },
    { stashKey: 'item_a', instanceId: 'i2', stacks: 3 }
  ]

  assert.equal(countPackedContraband(manifest, 'item_a'), 5)
  assert.equal(countPackedContraband(manifest, 'item_c'), 0)

  // Debits take from the first entries and drop the ones they empty.
  assert.deepEqual(debitPackedContraband(manifest, 'item_a', 3), [
    { stashKey: 'item_b', instanceId: null, stacks: 1 },
    { stashKey: 'item_a', instanceId: 'i2', stacks: 2 }
  ])
  assert.deepEqual(debitPackedContraband(manifest, 'item_c', 1), manifest)
  assert.equal(manifest[0].stacks, 2) // input is not mutated

  // Credits merge into a covering entry, else add one.
  assert.equal(creditPackedContraband(manifest, 'item_a', 'i2', 1)[2].stacks, 4)
  assert.deepEqual(creditPackedContraband([], 'item_c', 'i9', 1), [
    { stashKey: 'item_c', instanceId: 'i9', stacks: 1 }
  ])
})

test('getCarriedContrabandStash narrows the stash only during an active run', () => {
  const stash = {
    item_a: { id: 'item_a', stacks: 5 },
    item_b: { id: 'item_b', stacks: 2 },
    item_c: { id: 'item_c', stacks: null }
  }
  const cargo = {
    spareParts: 0,
    supplies: 0,
    technicalGearItemIds: [],
    merch: [],
    contraband: [
      { stashKey: 'item_a', instanceId: null, stacks: 3 },
      { stashKey: 'item_c', instanceId: null, stacks: 1 }
    ]
  }

  assert.equal(getCarriedContrabandStash(stash, { status: 'idle' }), stash)
  assert.equal(getCarriedContrabandStash(stash, { status: 'prepared' }), stash)

  const carried = getCarriedContrabandStash(stash, { status: 'active', cargo })
  // item_b stays at HQ; item_a is capped at what is packed.
  assert.deepEqual(Object.keys(carried).sort(), ['item_a', 'item_c'])
  assert.equal(carried.item_a.stacks, 3)
  assert.equal(carried.item_c.stacks, 1)
})
