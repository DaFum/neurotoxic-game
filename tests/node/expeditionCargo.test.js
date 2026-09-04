import test from 'node:test'
import assert from 'node:assert/strict'
import {
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
        assert.equal(result.reason, 'CARGO_OUT_OF_RANGE')
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
        assert.equal(result.reason, 'CARGO_OUT_OF_RANGE')
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
