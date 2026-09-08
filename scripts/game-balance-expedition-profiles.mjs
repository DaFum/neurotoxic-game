/**
 * @fileoverview Strategy-profile definitions and schema for Expedition balance simulation (v15).
 *
 * Implements G6 Tasks 1-4.
 * Cut strictly from historical day horizons to production Expedition terminal outcomes.
 */

import { getExpeditionChassisArchetype } from '../src/domain/expedition/chassis.ts'
import { EXPEDITION_TOUR_TYPES } from '../src/data/expedition/tourTypes.ts'
import { EXPEDITION_REGIONS } from '../src/data/expedition/regions.ts'
import { createInitialState } from '../src/context/initialState.ts'
import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { createUnlockExpeditionAscensionAction } from '../src/context/careerActionCreators.ts'
import {
  purchaseChassis,
  installModule
} from '../src/context/assetActionCreators.ts'
import { isCrewAvailable } from '../src/domain/expedition/crew.ts'
import { EXPEDITION_CREW_BY_ID } from '../src/data/expedition/crew.ts'
import {
  getExpeditionOwnedPerformanceGear,
  resolveExpeditionGearItem,
  MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS
} from '../src/domain/expedition/equipment.ts'
import { getPrimaryEffect } from '../src/utils/purchaseLogicUtils.ts'
import { isFiniteNumber } from '../src/utils/finiteNumber.ts'
import { SONGS_BY_ID } from '../src/data/songs.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { BRAND_DEALS_BY_ID } from '../src/data/brandDeals.ts'
import {
  EXPEDITION_CONTRACTS_BY_ID,
  MAX_NATIVE_EXPEDITION_CONTRACTS
} from '../src/data/expedition/contracts.ts'
import {
  areExpeditionContractsCompatible,
  materializeContractConstraints
} from '../src/domain/expedition/contracts.ts'
import {
  getAvailableNativeContractTemplateIds,
  validateExpeditionBuildCommitment
} from '../src/domain/expedition/loadout.ts'
import { calculateExpeditionCargoCapacity } from '../src/domain/expedition/cargo.ts'
import {
  isExpeditionAscensionEligible,
  EXPEDITION_META_UNLOCK_QUEST_ID
} from '../src/domain/expedition/meta.ts'
import { MODULE_REGISTRY } from '../src/utils/assetModuleRegistry.ts'

export const EXPEDITION_BALANCE_NAMESPACE = '#roguelite-expedition-v1'

export const EXPEDITION_TERMINAL_OUTCOMES = Object.freeze([
  'extracted',
  'completed',
  'failed'
])

export const TOUR_TYPE_CANONICAL_MAP = Object.freeze({
  standard: 'standard_tour',
  blitz: 'blitz_tour',
  underground: 'underground_tour',
  corporate: 'corporate_tour',
  rival_hunt: 'rival_hunt_tour',
  survival: 'survival_tour'
})

export const REGION_CANONICAL_MAP = Object.freeze({
  home: 'home_turf',
  industrial: 'industrial_belt',
  festival: 'festival_fields',
  corporate: 'corporate_circuit',
  underground: 'underground_scene'
})

/**
 * Resolves a profile tour type to its canonical production ID.
 */
export const toCanonicalTourTypeId = tourTypeId => {
  if (typeof tourTypeId === 'string') {
    if (Object.hasOwn(EXPEDITION_TOUR_TYPES, tourTypeId)) {
      return tourTypeId
    }
    if (Object.hasOwn(TOUR_TYPE_CANONICAL_MAP, tourTypeId)) {
      return TOUR_TYPE_CANONICAL_MAP[tourTypeId]
    }
  }
  throw new Error(`Unknown expedition tour type: ${tourTypeId}`)
}

/**
 * Resolves a profile region to its canonical production ID.
 */
export const toCanonicalRegionId = regionId => {
  if (typeof regionId === 'string') {
    if (Object.hasOwn(EXPEDITION_REGIONS, regionId)) {
      return regionId
    }
    if (Object.hasOwn(REGION_CANONICAL_MAP, regionId)) {
      return REGION_CANONICAL_MAP[regionId]
    }
  }
  throw new Error(`Unknown expedition region: ${regionId}`)
}

/**
 * Reads route depth from production TourTypeDefinition.
 */
export const getTourDepth = tourTypeId => {
  const canonical = toCanonicalTourTypeId(tourTypeId)
  const def = EXPEDITION_TOUR_TYPES[canonical]
  if (!def || typeof def.depth !== 'number') {
    throw new Error(`Missing depth for tour: ${canonical}`)
  }
  return def.depth
}

/**
 * Reads extraction windows range from production TourTypeDefinition.
 */
export const getExtractionWindowRange = tourTypeId => {
  const canonical = toCanonicalTourTypeId(tourTypeId)
  const def = EXPEDITION_TOUR_TYPES[canonical]
  if (!def || !Array.isArray(def.extractionWindowRange)) {
    throw new Error(`Missing extraction window range for tour: ${canonical}`)
  }
  return [...def.extractionWindowRange]
}

export const VALID_DECISION_POLICIES = Object.freeze([
  'safe_value',
  'push_heat',
  'repair_first',
  'intel_then_value',
  'performance_push',
  'rival_pressure'
])

export const VALID_SPONSOR_POLICIES = Object.freeze([
  'none',
  'highest_clean_value',
  'highest_exposure_value',
  'highest_nonrival_value'
])

export const VALID_CARGO_POLICIES = Object.freeze([
  'safe',
  'balanced',
  'merch',
  'contraband'
])

export const VALID_SETLIST_POLICIES = Object.freeze([
  'balanced_four',
  'lowest_difficulty_four',
  'highest_energy_four'
])

export const VALID_EQUIPMENT_POLICIES = Object.freeze([
  'current_selection',
  'best_owned_selection'
])

/**
 * Validates a strategy profile against the schema and domain invariants.
 */
export const validateExpeditionBalanceProfile = profile => {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Profile must be a non-null object')
  }

  if (typeof profile.id !== 'string' || profile.id.length === 0) {
    throw new Error('Profile must have a non-empty string id')
  }

  toCanonicalTourTypeId(profile.tourTypeId)
  toCanonicalRegionId(profile.regionId)

  if (!profile.chassisSpec || typeof profile.chassisSpec !== 'object') {
    throw new Error(`Profile ${profile.id}: missing chassisSpec`)
  }
  const { flavor, tier, expectedArchetype } = profile.chassisSpec
  if (flavor !== 'legit' && flavor !== 'diy') {
    throw new Error(`Profile ${profile.id}: invalid chassis flavor ${flavor}`)
  }
  if (tier !== 1 && tier !== 2 && tier !== 3) {
    throw new Error(`Profile ${profile.id}: invalid chassis tier ${tier}`)
  }
  const computedArchetype = getExpeditionChassisArchetype({
    chassisFlavor: flavor,
    chassisTier: tier
  })
  if (computedArchetype !== expectedArchetype) {
    throw new Error(
      `Profile ${profile.id}: expectedArchetype mismatch. Computed: ${computedArchetype}, Expected: ${expectedArchetype}`
    )
  }

  const fixture = profile.matureFixture
  if (!fixture || typeof fixture !== 'object') {
    throw new Error(
      `Profile ${profile.id}: missing matureFixture. G6 Task 2 forbids hidden Cash/Fame/skill/equipment defaults, so every fixture input that can move a balance number must be declared on the profile.`
    )
  }
  if (fixture.version !== MATURE_FIXTURE_VERSION) {
    throw new Error(
      `Profile ${profile.id}: matureFixture.version ${fixture.version} is not the supported ${MATURE_FIXTURE_VERSION}`
    )
  }
  if (!isFiniteNumber(fixture.money) || fixture.money < 0) {
    throw new Error(`Profile ${profile.id}: matureFixture.money must be a non-negative finite number`)
  }

  // Declared per profile and serialized into provenance, so the artifact
  // reproduces the run without reading builder internals. It changes
  // `protectedCareerCash`, refuel capacity and bankruptcy reachability, which
  // is far too much for a shared constant nobody can see from the profile.
  if (!isFiniteNumber(fixture.operatingCash) || fixture.operatingCash < 0) {
    throw new Error(
      `Profile ${profile.id}: matureFixture.operatingCash must be a non-negative finite number`
    )
  }
  if (!isFiniteNumber(fixture.fame) || fixture.fame < 0) {
    throw new Error(`Profile ${profile.id}: matureFixture.fame must be a non-negative finite number`)
  }
  if (!fixture.memberSkills || typeof fixture.memberSkills !== 'object') {
    throw new Error(`Profile ${profile.id}: matureFixture.memberSkills must be an object`)
  }
  for (const skill of ['tech', 'technical', 'charisma']) {
    if (!isFiniteNumber(fixture.memberSkills[skill])) {
      throw new Error(
        `Profile ${profile.id}: matureFixture.memberSkills.${skill} must be a finite number`
      )
    }
  }
  if (
    !Array.isArray(fixture.vanUpgrades) ||
    fixture.vanUpgrades.some(id => typeof id !== 'string')
  ) {
    throw new Error(
      `Profile ${profile.id}: matureFixture.vanUpgrades must be an array of strings`
    )
  }
  if (
    !isFiniteNumber(fixture.startingVanFuel) ||
    fixture.startingVanFuel < 0 ||
    fixture.startingVanFuel > 100
  ) {
    throw new Error(
      `Profile ${profile.id}: matureFixture.startingVanFuel must be a finite number in 0..100`
    )
  }
  // A build may only top the tank up, so a declared level above the committed
  // target would make the loadout illegal rather than merely odd.
  if (fixture.startingVanFuel > profile.startingFuelTarget) {
    throw new Error(
      `Profile ${profile.id}: matureFixture.startingVanFuel ${fixture.startingVanFuel} exceeds startingFuelTarget ${profile.startingFuelTarget}`
    )
  }

  if (!Array.isArray(profile.requiredModuleIds)) {
    throw new Error(`Profile ${profile.id}: requiredModuleIds must be an array`)
  }

  if (
    !Array.isArray(profile.crewRoleOrder) ||
    profile.crewRoleOrder.length === 0
  ) {
    throw new Error(
      `Profile ${profile.id}: crewRoleOrder must be a non-empty array`
    )
  }

  const validPerks = [
    null,
    'mechanic_kit',
    'press_pass',
    'underground_contact',
    'rehearsed_set'
  ]
  if (!validPerks.includes(profile.starterPerkId)) {
    throw new Error(
      `Profile ${profile.id}: invalid starterPerkId ${profile.starterPerkId}`
    )
  }

  const validInsurance = [null, 'roadside', 'equipment', 'touring']
  if (!validInsurance.includes(profile.insurancePolicyId)) {
    throw new Error(
      `Profile ${profile.id}: invalid insurancePolicyId ${profile.insurancePolicyId}`
    )
  }

  if (!Array.isArray(profile.pressureModifierIds)) {
    throw new Error(
      `Profile ${profile.id}: pressureModifierIds must be an array`
    )
  }

  if (!VALID_SPONSOR_POLICIES.includes(profile.sponsorPolicy)) {
    throw new Error(
      `Profile ${profile.id}: invalid sponsorPolicy ${profile.sponsorPolicy}`
    )
  }
  if (!VALID_CARGO_POLICIES.includes(profile.cargoPolicy)) {
    throw new Error(
      `Profile ${profile.id}: invalid cargoPolicy ${profile.cargoPolicy}`
    )
  }
  if (!VALID_SETLIST_POLICIES.includes(profile.setlistPolicy)) {
    throw new Error(
      `Profile ${profile.id}: invalid setlistPolicy ${profile.setlistPolicy}`
    )
  }
  if (!VALID_EQUIPMENT_POLICIES.includes(profile.equipmentPolicy)) {
    throw new Error(
      `Profile ${profile.id}: invalid equipmentPolicy ${profile.equipmentPolicy}`
    )
  }
  if (!VALID_DECISION_POLICIES.includes(profile.decisionPolicy)) {
    throw new Error(
      `Profile ${profile.id}: invalid decisionPolicy ${profile.decisionPolicy}`
    )
  }

  if (
    typeof profile.startingFuelTarget !== 'number' ||
    profile.startingFuelTarget <= 0
  ) {
    throw new Error(
      `Profile ${profile.id}: startingFuelTarget must be a positive number`
    )
  }
  if (
    typeof profile.protectedCashRatio !== 'number' ||
    profile.protectedCashRatio < 0 ||
    profile.protectedCashRatio > 1
  ) {
    throw new Error(
      `Profile ${profile.id}: protectedCashRatio must be between 0 and 1`
    )
  }

  if (!Array.isArray(profile.requiredCapabilitySetIds)) {
    throw new Error(
      `Profile ${profile.id}: requiredCapabilitySetIds must be an array`
    )
  }
  if (typeof profile.requiresAscension !== 'boolean') {
    throw new Error(
      `Profile ${profile.id}: requiresAscension must be a boolean`
    )
  }
  if (
    profile.requiresAscension &&
    profile.requiredCapabilitySetIds.length < 3
  ) {
    throw new Error(
      `Profile ${profile.id}: requiresAscension must declare >= 3 capability sets (got ${profile.requiredCapabilitySetIds.length})`
    )
  }
  if (
    !profile.betweenTourMetaPolicy ||
    typeof profile.betweenTourMetaPolicy !== 'object'
  ) {
    throw new Error(`Profile ${profile.id}: missing betweenTourMetaPolicy`)
  }

  return true
}

/**
 * Six production-valid mature-build strategies (G6 Task 3).
 */
/**
 * Schema version of the declared mature-fixture block.
 *
 * @remarks
 * Bumped whenever a field is added or its meaning changes, so an artifact
 * generated against an older shape cannot be mistaken for current evidence.
 */
/**
 * Career Cash a mature fixture actually tours with, after construction.
 *
 * @remarks
 * Measured, not chosen: 5,682 (calibration) and 5,601 (holdout) is the mean
 * Career balance after six Tours across 12,000 release sequences, so this is
 * what a Career that has played the game holds.
 *
 * `matureFixture.money` stays a *construction* budget - steps 4-8 buy the
 * chassis, install modules and stock cargo through the real purchase paths,
 * and those cost real money. What it must not also be is the balance the run
 * operates on. Leaving 500,000 in the account disarmed two of production's
 * three lethal paths by construction: `bankruptcy` reads
 * `shouldTriggerBankruptcy` against spendable Cash, and `fuel_stranded` runs
 * `checkSoftlock` over the same view, where a refuel or a tow is always
 * affordable. That was the whole of the 0.0% `failedRate` across all six
 * mature profiles - not a wear curve, a fixture that could not go broke.
 */
export const MATURE_FIXTURE_OPERATING_CASH = 5600

export const MATURE_FIXTURE_VERSION = 1

export const EXPEDITION_BALANCE_PROFILES = Object.freeze([
  Object.freeze({
    id: 'clean_sponsor',
    tourTypeId: 'corporate',
    regionId: 'corporate',
    chassisSpec: { flavor: 'legit', tier: 2, expectedArchetype: 'coach' },
    requiredModuleIds: ['tb_solar_panel', 'tb_sleeping_bunks'],
    crewRoleOrder: ['manager', 'roadie', 'scout'],
    starterPerkId: 'press_pass',
    insurancePolicyId: 'touring',
    pressureModifierIds: [],
    nativeContractPreferenceIds: [
      'contract_keep_it_clean',
      'contract_three_good_gigs'
    ],
    sponsorPolicy: 'highest_clean_value',
    betweenTourMetaPolicy: Object.freeze({
      crew_debrief: ['develop_signature', 'rest_band'],
      sponsor_follow_up: ['keep_relationship', 'walk_away'],
      rival_response: ['cool_down', 'confront']
    }),
    cargoPolicy: 'safe',
    setlistPolicy: 'balanced_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 90,
    protectedCashRatio: 0.4,
    requiredCapabilitySetIds: ['industry_network', 'chassis_network'],
    requiresAscension: false,
    // Every mature-fixture input that can move a balance number, declared
    // rather than defaulted. The builder used to raise these silently, so two
    // runs of the same profile could only be reproduced by knowing the
    // builder's constants; they are versioned here and echoed into the
    // artifact's fixture provenance.
    matureFixture: Object.freeze({
      version: 1,
      money: 500000,
      operatingCash: MATURE_FIXTURE_OPERATING_CASH,
      fame: 150,
      memberSkills: Object.freeze({ tech: 5, technical: 5, charisma: 5 }),
      // Declared, not derived. Task 2 lists Fuel among the inputs that may
      // not have a hidden builder default: this value decides the START
      // top-up charge and therefore retained Cash. It is the committed
      // target minus the 10 litres the builder used to subtract
      // implicitly, so the balance corridors are unchanged.
      startingVanFuel: 80,
      vanUpgrades: Object.freeze([
        'stage_monitors',
        'amp_overdrive',
        'effects_rack'
      ])
    }),
    decisionPolicy: 'safe_value'
  }),
  Object.freeze({
    id: 'underground_heat',
    tourTypeId: 'underground',
    regionId: 'underground',
    chassisSpec: {
      flavor: 'diy',
      tier: 3,
      expectedArchetype: 'armored_hauler'
    },
    requiredModuleIds: ['tb_gps_jammer', 'tb_trailer_hitch', 'tb_roof_rack'],
    crewRoleOrder: ['security', 'driver', 'scout'],
    starterPerkId: 'underground_contact',
    insurancePolicyId: 'roadside',
    pressureModifierIds: ['media_frenzy', 'hostile_territory'],
    nativeContractPreferenceIds: ['contract_all_in'],
    sponsorPolicy: 'none',
    betweenTourMetaPolicy: Object.freeze({
      crew_debrief: ['develop_signature', 'rest_band'],
      rival_response: ['confront', 'cool_down'],
      sponsor_follow_up: ['walk_away', 'keep_relationship']
    }),
    cargoPolicy: 'contraband',
    setlistPolicy: 'highest_energy_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 95,
    protectedCashRatio: 0.15,
    requiredCapabilitySetIds: [
      'underground_network',
      'chassis_network',
      'mechanic_network'
    ],
    requiresAscension: true,
    // Every mature-fixture input that can move a balance number, declared
    // rather than defaulted. The builder used to raise these silently, so two
    // runs of the same profile could only be reproduced by knowing the
    // builder's constants; they are versioned here and echoed into the
    // artifact's fixture provenance.
    matureFixture: Object.freeze({
      version: 1,
      money: 500000,
      operatingCash: MATURE_FIXTURE_OPERATING_CASH,
      fame: 150,
      memberSkills: Object.freeze({ tech: 5, technical: 5, charisma: 5 }),
      // Declared, not derived. Task 2 lists Fuel among the inputs that may
      // not have a hidden builder default: this value decides the START
      // top-up charge and therefore retained Cash. It is the committed
      // target minus the 10 litres the builder used to subtract
      // implicitly, so the balance corridors are unchanged.
      startingVanFuel: 85,
      vanUpgrades: Object.freeze([
        'stage_monitors',
        'amp_overdrive',
        'effects_rack'
      ])
    }),
    decisionPolicy: 'push_heat'
  }),
  Object.freeze({
    id: 'diy_repair',
    tourTypeId: 'survival',
    regionId: 'industrial',
    chassisSpec: { flavor: 'diy', tier: 2, expectedArchetype: 'diy' },
    requiredModuleIds: [
      'tb_cb_radio_mesh',
      'tb_roof_rack',
      'tb_sleeping_bunks'
    ],
    crewRoleOrder: ['technician', 'roadie', 'driver'],
    starterPerkId: 'mechanic_kit',
    insurancePolicyId: 'equipment',
    pressureModifierIds: ['bad_roads'],
    nativeContractPreferenceIds: ['contract_route_target'],
    sponsorPolicy: 'none',
    betweenTourMetaPolicy: Object.freeze({
      crew_debrief: ['develop_signature', 'rest_band'],
      rival_response: ['cool_down', 'confront'],
      sponsor_follow_up: ['walk_away', 'keep_relationship']
    }),
    cargoPolicy: 'balanced',
    setlistPolicy: 'lowest_difficulty_four',
    equipmentPolicy: 'current_selection',
    startingFuelTarget: 85,
    protectedCashRatio: 0.3,
    requiredCapabilitySetIds: [
      'mechanic_network',
      'industry_network',
      'crew_network',
      'chassis_network'
    ],
    requiresAscension: true,
    // Every mature-fixture input that can move a balance number, declared
    // rather than defaulted. The builder used to raise these silently, so two
    // runs of the same profile could only be reproduced by knowing the
    // builder's constants; they are versioned here and echoed into the
    // artifact's fixture provenance.
    matureFixture: Object.freeze({
      version: 1,
      money: 500000,
      operatingCash: MATURE_FIXTURE_OPERATING_CASH,
      fame: 150,
      memberSkills: Object.freeze({ tech: 5, technical: 5, charisma: 5 }),
      // Declared, not derived. Task 2 lists Fuel among the inputs that may
      // not have a hidden builder default: this value decides the START
      // top-up charge and therefore retained Cash. It is the committed
      // target minus the 10 litres the builder used to subtract
      // implicitly, so the balance corridors are unchanged.
      startingVanFuel: 75,
      vanUpgrades: Object.freeze([
        'stage_monitors',
        'amp_overdrive',
        'effects_rack'
      ])
    }),
    decisionPolicy: 'repair_first'
  }),
  Object.freeze({
    id: 'scout_intel',
    tourTypeId: 'standard',
    regionId: 'home',
    chassisSpec: { flavor: 'legit', tier: 1, expectedArchetype: 'compact' },
    requiredModuleIds: ['tb_gps_jammer', 'tb_solar_panel'],
    crewRoleOrder: ['scout', 'manager', 'driver'],
    starterPerkId: null,
    insurancePolicyId: 'roadside',
    pressureModifierIds: [],
    nativeContractPreferenceIds: ['contract_route_target'],
    sponsorPolicy: 'none',
    betweenTourMetaPolicy: Object.freeze({
      crew_debrief: ['rest_band', 'develop_signature'],
      rival_response: ['cool_down', 'confront'],
      sponsor_follow_up: ['keep_relationship', 'walk_away']
    }),
    cargoPolicy: 'safe',
    setlistPolicy: 'balanced_four',
    equipmentPolicy: 'current_selection',
    startingFuelTarget: 80,
    protectedCashRatio: 0.35,
    requiredCapabilitySetIds: ['industry_network'],
    requiresAscension: false,
    // Every mature-fixture input that can move a balance number, declared
    // rather than defaulted. The builder used to raise these silently, so two
    // runs of the same profile could only be reproduced by knowing the
    // builder's constants; they are versioned here and echoed into the
    // artifact's fixture provenance.
    matureFixture: Object.freeze({
      version: 1,
      money: 500000,
      operatingCash: MATURE_FIXTURE_OPERATING_CASH,
      fame: 150,
      memberSkills: Object.freeze({ tech: 5, technical: 5, charisma: 5 }),
      // Declared, not derived. Task 2 lists Fuel among the inputs that may
      // not have a hidden builder default: this value decides the START
      // top-up charge and therefore retained Cash. It is the committed
      // target minus the 10 litres the builder used to subtract
      // implicitly, so the balance corridors are unchanged.
      startingVanFuel: 70,
      vanUpgrades: Object.freeze([
        'stage_monitors',
        'amp_overdrive',
        'effects_rack'
      ])
    }),
    decisionPolicy: 'intel_then_value'
  }),
  Object.freeze({
    id: 'high_exposure_performance',
    tourTypeId: 'blitz',
    regionId: 'festival',
    chassisSpec: { flavor: 'legit', tier: 2, expectedArchetype: 'coach' },
    requiredModuleIds: [
      'tb_subwoofer_stack',
      'tb_side_graphics',
      'tb_sleeping_bunks'
    ],
    crewRoleOrder: ['roadie', 'manager', 'scout'],
    starterPerkId: 'rehearsed_set',
    insurancePolicyId: 'equipment',
    pressureModifierIds: ['media_frenzy'],
    nativeContractPreferenceIds: [
      'contract_three_good_gigs',
      'contract_no_rest_finale'
    ],
    sponsorPolicy: 'highest_exposure_value',
    betweenTourMetaPolicy: Object.freeze({
      crew_debrief: ['develop_signature', 'rest_band'],
      rival_response: ['confront', 'cool_down'],
      sponsor_follow_up: ['keep_relationship', 'walk_away']
    }),
    cargoPolicy: 'merch',
    setlistPolicy: 'highest_energy_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 90,
    protectedCashRatio: 0.25,
    requiredCapabilitySetIds: [
      'festival_network',
      'industry_network',
      'chassis_network'
    ],
    requiresAscension: true,
    // Every mature-fixture input that can move a balance number, declared
    // rather than defaulted. The builder used to raise these silently, so two
    // runs of the same profile could only be reproduced by knowing the
    // builder's constants; they are versioned here and echoed into the
    // artifact's fixture provenance.
    matureFixture: Object.freeze({
      version: 1,
      money: 500000,
      operatingCash: MATURE_FIXTURE_OPERATING_CASH,
      fame: 150,
      memberSkills: Object.freeze({ tech: 5, technical: 5, charisma: 5 }),
      // Declared, not derived. Task 2 lists Fuel among the inputs that may
      // not have a hidden builder default: this value decides the START
      // top-up charge and therefore retained Cash. It is the committed
      // target minus the 10 litres the builder used to subtract
      // implicitly, so the balance corridors are unchanged.
      startingVanFuel: 80,
      vanUpgrades: Object.freeze([
        'stage_monitors',
        'amp_overdrive',
        'effects_rack'
      ])
    }),
    decisionPolicy: 'performance_push'
  }),
  Object.freeze({
    id: 'rival_hunter',
    tourTypeId: 'rival_hunt',
    regionId: 'festival',
    chassisSpec: { flavor: 'diy', tier: 2, expectedArchetype: 'diy' },
    requiredModuleIds: [
      'tb_gps_jammer',
      'tb_subwoofer_stack',
      'tb_side_graphics'
    ],
    crewRoleOrder: ['security', 'scout', 'driver'],
    starterPerkId: 'rehearsed_set',
    insurancePolicyId: 'touring',
    pressureModifierIds: ['hostile_territory'],
    nativeContractPreferenceIds: ['contract_all_in', 'contract_no_rest_finale'],
    sponsorPolicy: 'highest_nonrival_value',
    betweenTourMetaPolicy: Object.freeze({
      crew_debrief: ['develop_signature', 'rest_band'],
      rival_response: ['confront', 'cool_down'],
      sponsor_follow_up: ['keep_relationship', 'walk_away']
    }),
    cargoPolicy: 'balanced',
    setlistPolicy: 'highest_energy_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 95,
    protectedCashRatio: 0.2,
    requiredCapabilitySetIds: [
      'festival_network',
      'underground_network',
      'rival_network',
      'chassis_network'
    ],
    requiresAscension: true,
    // Every mature-fixture input that can move a balance number, declared
    // rather than defaulted. The builder used to raise these silently, so two
    // runs of the same profile could only be reproduced by knowing the
    // builder's constants; they are versioned here and echoed into the
    // artifact's fixture provenance.
    matureFixture: Object.freeze({
      version: 1,
      money: 500000,
      operatingCash: MATURE_FIXTURE_OPERATING_CASH,
      fame: 150,
      memberSkills: Object.freeze({ tech: 5, technical: 5, charisma: 5 }),
      // Declared, not derived. Task 2 lists Fuel among the inputs that may
      // not have a hidden builder default: this value decides the START
      // top-up charge and therefore retained Cash. It is the committed
      // target minus the 10 litres the builder used to subtract
      // implicitly, so the balance corridors are unchanged.
      startingVanFuel: 85,
      vanUpgrades: Object.freeze([
        'stage_monitors',
        'amp_overdrive',
        'effects_rack'
      ])
    }),
    decisionPolicy: 'rival_pressure'
  })
])

export const EXPEDITION_BALANCE_PROFILE_IDS = Object.freeze(
  EXPEDITION_BALANCE_PROFILES.map(p => p.id)
)

export const getExpeditionBalanceProfile = id =>
  EXPEDITION_BALANCE_PROFILES.find(p => p.id === id) ?? null

/**
 * Selects a staged sponsor offer according to profile policy.
 *
 * @param {Array<{ dealId: string, offerId: string }>} stagedOffers
 * @param {string} policy
 * @param {string | null} [rivalAlignment] - Brand alignment of the active
 * Rival, which `highest_nonrival_value` steers away from.
 */
export const pickSponsorOffer = (stagedOffers, policy, rivalAlignment = null) => {
  if (!Array.isArray(stagedOffers) || stagedOffers.length === 0) return null
  if (policy === 'none') return null
  const scored = stagedOffers.map(offer => {
    const deal = BRAND_DEALS_BY_ID.get(offer.dealId)
    let score = 0
    if (deal) {
      const upfront = deal.offer?.upfront ?? 0
      const perGig = (deal.offer?.perGig ?? 0) * 4
      const penalty = (deal.penalty?.controversy ?? 0) * 20
      if (policy === 'highest_clean_value') {
        score =
          upfront + perGig - penalty - (deal.alignment === 'EVIL' ? 500 : 0)
      } else if (policy === 'highest_exposure_value') {
        score =
          upfront + perGig + ((deal.requirements?.followers ?? 0) > 0 ? 100 : 0)
      } else if (policy === 'highest_nonrival_value') {
        // "Non-rival" has to mean something. A Rival's `style` is its brand
        // alignment (`rivals.ts` stores `String(rivalBand.alignment)`), so a
        // deal sharing that alignment is the one that walks the Career into
        // the Rival's territory. Without this the policy scored exactly like a
        // plain value policy and `rival_hunter`'s declared Sponsor strategy
        // was a label with no behaviour.
        const sharesRivalAlignment =
          rivalAlignment !== null && deal.alignment === rivalAlignment
        score = upfront + perGig - (sharesRivalAlignment ? 10000 : 0)
      }
    }
    return { offer, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.offer ?? null
}

/**
 * Builds a mature single-run loadout through production owners only (G6 Task 4).
 *
 * @param {import('../src/types').GameState | null} fixtureState
 * @param {typeof EXPEDITION_BALANCE_PROFILES[number]} profile
 * @param {number} seed
 * @returns {import('../src/types').GameState} Validated active state with provenance attached.
 */
export const buildProductionSimulationLoadout = (
  fixtureState,
  profile,
  seed
) => {
  validateExpeditionBalanceProfile(profile)
  const canonicalTour = toCanonicalTourTypeId(profile.tourTypeId)
  const canonicalRegion = toCanonicalRegionId(profile.regionId)

  // 1. Start from createInitialState or supplied linked mature fixture
  let state = fixtureState
    ? structuredClone(fixtureState)
    : createInitialState()

  // The mature fixture is applied from the profile's own declaration, not from
  // builder constants. These values drive protected Cash, Sponsor quality and
  // post-gig outcomes, so a reader of the profile has to be able to see them.
  const matureFixture = profile.matureFixture
  state.player.money = matureFixture.money
  state.player.fame = matureFixture.fame
  if (!state.player.van) {
    state.player.van = { fuel: 0, condition: 100, maxFuel: 100, upgrades: [] }
  }
  // Applied exactly as declared. Deriving `target - 10` here made the START
  // top-up charge - and so retained Cash - depend on a constant the profile
  // never stated.
  state.player.van.fuel = matureFixture.startingVanFuel
  if (state.band?.members) {
    for (const member of state.band.members) {
      if (member) {
        member.skills = {
          ...(member.skills ?? {}),
          ...matureFixture.memberSkills
        }
      }
    }
  }

  // 2. Record required capability-set fixture markers in provenance
  const fixtureCapabilitySetIds = [...profile.requiredCapabilitySetIds]
  state = {
    ...state,
    career: {
      ...state.career,
      unlockedSetIds: [
        ...new Set([
          ...(state.career?.unlockedSetIds ?? []),
          ...profile.requiredCapabilitySetIds
        ])
      ]
    }
  }

  // 3. If requiresAscension:
  if (profile.requiresAscension) {
    state = {
      ...state,
      completedQuestIds: [
        ...new Set([
          ...(state.completedQuestIds ?? []),
          EXPEDITION_META_UNLOCK_QUEST_ID
        ])
      ],
      career: {
        ...state.career,
        finalizedExpeditionRuns: Math.max(
          state.career?.finalizedExpeditionRuns ?? 0,
          5
        ),
        completedExpeditionRuns: Math.max(
          state.career?.completedExpeditionRuns ?? 0,
          5
        ),
        completedExpeditionRegionIds: [
          ...new Set([
            ...(state.career?.completedExpeditionRegionIds ?? []),
            'home_turf',
            'festival_fields'
          ])
        ],
        settledExpeditionRunIds: [
          ...new Set([
            ...(state.career?.settledExpeditionRunIds ?? []),
            'run_prereq_evidence'
          ])
        ]
      }
    }
    if (!isExpeditionAscensionEligible(state)) {
      throw new Error(
        `Profile ${profile.id}: Ascension prerequisites not satisfied`
      )
    }
    state = gameReducer(
      state,
      createUnlockExpeditionAscensionAction('run_prereq_evidence')
    )
    if (!state.career.ascensionUnlocked) {
      throw new Error(
        `Profile ${profile.id}: UNLOCK_EXPEDITION_ASCENSION failed`
      )
    }
  }

  // 4. Ensure exact production chassis exists through purchase/asset fixture path
  const { flavor, tier, expectedArchetype } = profile.chassisSpec
  let chassis = (state.assets ?? []).find(
    a =>
      a.kind === 'tourbus_chassis' &&
      a.chassisFlavor === flavor &&
      a.chassisTier === tier
  )
  if (!chassis) {
    const purchaseAction = purchaseChassis(
      { kind: 'tourbus_chassis', flavor, tier, mode: 'cash' },
      state
    )
    if (purchaseAction.type === ActionTypes.PURCHASE_CHASSIS_FAILED) {
      throw new Error(
        `Profile ${profile.id}: purchaseChassis failed: ${purchaseAction.payload?.reason}`
      )
    }
    state = gameReducer(state, purchaseAction)
    chassis = (state.assets ?? []).find(
      a =>
        a.kind === 'tourbus_chassis' &&
        a.chassisFlavor === flavor &&
        a.chassisTier === tier
    )
    if (!chassis) {
      throw new Error(
        `Profile ${profile.id}: purchased chassis not found in assets`
      )
    }
  }

  // 5. Install required modules through production INSTALL_MODULE; failure throws
  for (const moduleId of profile.requiredModuleIds) {
    const moduleInfo = MODULE_REGISTRY[moduleId]
    if (!moduleInfo) {
      throw new Error(`Profile ${profile.id}: unknown module ${moduleId}`)
    }
    chassis = (state.assets ?? []).find(a => a.id === chassis.id)
    const alreadyInstalled = chassis.slots.some(
      s => s.installedModuleId === moduleId
    )
    if (!alreadyInstalled) {
      const emptySlot = chassis.slots.find(
        s => s.installedModuleId === null && s.slotType === moduleInfo.slotType
      )
      if (!emptySlot) {
        throw new Error(
          `Profile ${profile.id}: no empty slot for module ${moduleId} (slotType: ${moduleInfo.slotType})`
        )
      }
      const installAction = installModule(
        { assetId: chassis.id, slotId: emptySlot.id, moduleId },
        state
      )
      if (installAction.type === ActionTypes.INSTALL_MODULE_FAILED) {
        throw new Error(
          `Profile ${profile.id}: installModule failed for ${moduleId}: ${installAction.payload?.reason}`
        )
      }
      state = gameReducer(state, installAction)
    }
  }

  // 6. Resolve exact archetype through G2 production helper; mismatch throws
  chassis = (state.assets ?? []).find(a => a.id === chassis.id)
  const resolvedArchetype = getExpeditionChassisArchetype(chassis)
  if (resolvedArchetype !== expectedArchetype) {
    throw new Error(
      `Profile ${profile.id}: chassis archetype mismatch: expected ${expectedArchetype}, got ${resolvedArchetype}`
    )
  }

  // 7. Choose Crew through isCrewAvailable; missing declared capability throws
  const selectedCrewIds = []
  for (const role of profile.crewRoleOrder) {
    if (selectedCrewIds.length >= 3) break
    const crew = Object.values(EXPEDITION_CREW_BY_ID).find(
      c => c.role === role && !selectedCrewIds.includes(c.id)
    )
    if (!crew) {
      throw new Error(
        `Profile ${profile.id}: no crew definition found for role ${role}`
      )
    }
    if (!isCrewAvailable(state, crew.id)) {
      throw new Error(
        `Profile ${profile.id}: crew role ${role} (${crew.id}) is not available with declared capabilities`
      )
    }
    selectedCrewIds.push(crew.id)
  }

  // 8. Equipment: current_selection vs best_owned_selection
  //
  // The declared list is applied unconditionally, like the rest of the mature
  // fixture. Applying it only when the state happened to have no upgrades meant
  // a linked fixture carrying its own set silently overrode the profile's
  // declaration - the hidden-input problem this block exists to close.
  state = {
    ...state,
    player: {
      ...state.player,
      van: {
        ...state.player.van,
        upgrades: [...matureFixture.vanUpgrades]
      }
    }
  }
  const ownedGear = getExpeditionOwnedPerformanceGear(state)
  let selectedGearItemIds
  if (profile.equipmentPolicy === 'best_owned_selection') {
    const scoredGear = ownedGear.map(id => {
      const item = resolveExpeditionGearItem(id)
      const effect = item ? getPrimaryEffect(item) : null
      const utility =
        effect && isFiniteNumber(effect.value) ? Math.abs(effect.value) : 0
      return { id, utility }
    })
    scoredGear.sort((a, b) => b.utility - a.utility || a.id.localeCompare(b.id))
    selectedGearItemIds = scoredGear
      .slice(0, MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS)
      .map(g => g.id)
  } else {
    selectedGearItemIds = ownedGear.slice(
      0,
      Math.min(2, MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS)
    )
  }

  // 9. Choose first four legal unique songs by profile policy; insufficient songs throws
  const allSongs = [...SONGS_BY_ID.values()]
  if (allSongs.length < 4) {
    throw new Error(`Profile ${profile.id}: insufficient songs in catalog`)
  }
  const sortedSongs = [...allSongs]
  if (profile.setlistPolicy === 'lowest_difficulty_four') {
    sortedSongs.sort(
      (a, b) =>
        (a.difficultyRank ?? 0) - (b.difficultyRank ?? 0) ||
        a.id.localeCompare(b.id)
    )
  } else if (profile.setlistPolicy === 'highest_energy_four') {
    sortedSongs.sort(
      (a, b) =>
        (b.crowdAppeal ?? 0) - (a.crowdAppeal ?? 0) || a.id.localeCompare(b.id)
    )
  } else {
    sortedSongs.sort((a, b) => a.id.localeCompare(b.id))
  }
  const setlistSongIds = sortedSongs.slice(0, 4).map(s => s.id)

  // 9b. Hand the fixture the Cash a Career actually tours with, now that the
  // construction budget has bought everything the build declares.
  state = {
    ...state,
    player: { ...state.player, money: matureFixture.operatingCash }
  }

  // 10. Dispatch G1 PREPARE_EXPEDITION_RUN with seed; assert root state.runSeed === seed
  const prepId = `prep_${profile.id}_${seed}`
  state = gameReducer(state, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId, runSeed: seed }
  })
  if (state.runSeed !== seed) {
    throw new Error(
      `Profile ${profile.id}: runSeed mismatch after PREPARE_EXPEDITION_RUN`
    )
  }

  // 11. Build prepared map from the exact root runSeed
  const preparedMap = buildExpeditionMap(
    state.runSeed,
    canonicalTour,
    canonicalRegion
  )

  // 12. Dispatch G4 PREPARE_EXPEDITION_SPONSOR_OFFERS; select staged sponsorOfferId by policy
  state = gameReducer(state, {
    type: ActionTypes.PREPARE_EXPEDITION_SPONSOR_OFFERS,
    payload: {
      expectedRunSeed: seed,
      regionId: canonicalRegion,
      tourTypeId: canonicalTour,
      starterPerkId: profile.starterPerkId
    }
  })
  const stagedOffers = state.expedition.preparedSponsorOffers
  let selectedSponsorOfferId = null
  let acceptedSponsorDealId = null
  if (profile.sponsorPolicy !== 'none' && stagedOffers.length > 0) {
    const selectedOffer = pickSponsorOffer(
      stagedOffers,
      profile.sponsorPolicy,
      state.rivalBand?.alignment ?? null
    )
    if (selectedOffer) {
      selectedSponsorOfferId = selectedOffer.offerId
      acceptedSponsorDealId = selectedOffer.dealId
    }
  }

  // 13. Build native Contract offers from G4 registry
  const availableTemplates = getAvailableNativeContractTemplateIds(
    state,
    preparedMap
  )
  const nativeContracts = []
  for (const prefId of profile.nativeContractPreferenceIds) {
    if (nativeContracts.length >= MAX_NATIVE_EXPEDITION_CONTRACTS) break
    if (availableTemplates.includes(prefId)) {
      const template = EXPEDITION_CONTRACTS_BY_ID.get(prefId)
      if (template) {
        const candidateIds = [...nativeContracts.map(c => c.templateId), prefId]
        if (areExpeditionContractsCompatible(candidateIds)) {
          const constraints = materializeContractConstraints(
            template,
            preparedMap
          )
          if (constraints) {
            const routeTarget = constraints.find(c => c.kind === 'visit_node')
            nativeContracts.push({
              templateId: prefId,
              targetNodeId: routeTarget ? routeTarget.targetNodeId : null
            })
          }
        }
      }
    }
  }

  // 14. Materialize cargo
  const installedModuleIds = chassis.slots
    .map(s => s.installedModuleId)
    .filter(Boolean)
  const _capacity = calculateExpeditionCargoCapacity(
    chassis,
    installedModuleIds
  )
  let spareParts = 0
  let supplies = 0
  const merch = []
  const contraband = []
  if (profile.cargoPolicy === 'safe') {
    spareParts = 2
    supplies = 2
  } else if (profile.cargoPolicy === 'balanced') {
    spareParts = 1
    supplies = 1
  } else if (profile.cargoPolicy === 'merch') {
    spareParts = 0
    supplies = 1
  } else if (profile.cargoPolicy === 'contraband') {
    spareParts = 1
    supplies = 0
  }

  // 15. Set startingFuelTarget and protectedCareerCash
  const protectedCareerCash = Math.floor(
    state.player.money * profile.protectedCashRatio
  )

  // 16. Set insurance/perk/pressure
  const candidateLoadout = {
    tourTypeId: canonicalTour,
    regionId: canonicalRegion,
    activeTourbusAssetId: chassis.id,
    crewIds: selectedCrewIds,
    cargo: { spareParts, supplies },
    starterPerkId: profile.starterPerkId,
    nativeContracts,
    insurancePolicyId: profile.insurancePolicyId,
    pressureModifierIds: [...profile.pressureModifierIds],
    build: {
      setlistSongIds,
      equipment: { selectedGearItemIds },
      selectedTourbusModuleIds: profile.requiredModuleIds,
      merch,
      contraband,
      sponsorOfferId: selectedSponsorOfferId,
      startingFuelTarget: profile.startingFuelTarget,
      protectedCareerCash
    }
  }

  // 17. Validate with one G1 canonical loadout validator
  const validation = validateExpeditionBuildCommitment(
    state,
    candidateLoadout,
    preparedMap
  )
  if (!validation.valid) {
    throw new Error(
      `Profile ${profile.id} loadout rejected by validateExpeditionBuildCommitment: ${validation.reason}`
    )
  }

  // 18. Dispatch production START_EXPEDITION
  const activeState = gameReducer(state, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: state.expedition.prep.prepId,
      expectedRunSeed: seed,
      loadout: validation.normalized
    }
  })
  if (activeState.expedition.status !== 'active') {
    throw new Error(
      `Profile ${profile.id}: failed to transition to active status on START_EXPEDITION`
    )
  }

  const provenance = {
    profileId: profile.id,
    seed,
    tourTypeId: canonicalTour,
    regionId: canonicalRegion,
    chassis: { flavor, tier, archetype: resolvedArchetype },
    moduleIds: [...profile.requiredModuleIds],
    crewIds: [...selectedCrewIds],
    selectedGearItemIds: [...selectedGearItemIds],
    starterPerkId: profile.starterPerkId,
    insurancePolicyId: profile.insurancePolicyId,
    pressureModifierIds: [...profile.pressureModifierIds],
    sponsorOfferId: selectedSponsorOfferId,
    acceptedSponsorDealId,
    nativeContracts: [...nativeContracts],
    cargo: { spareParts, supplies, gearCount: selectedGearItemIds.length },
    setlistSongIds: [...setlistSongIds],
    startingFuelTarget: profile.startingFuelTarget,
    protectedCareerCash,
    fixtureCapabilitySetIds,
    // Task 15 requires the artifact to carry enough provenance to reproduce a
    // run from the profile alone. These are the resolved fixture inputs, so a
    // reader never has to know a builder constant to repeat the run.
    matureFixture: {
      version: matureFixture.version,
      money: matureFixture.money,
      operatingCash: matureFixture.operatingCash,
      resolvedOperatingCash: state.player?.money ?? null,
      fame: matureFixture.fame,
      memberSkills: { ...matureFixture.memberSkills },
      vanUpgrades: [...matureFixture.vanUpgrades],
      startingVanFuel: matureFixture.startingVanFuel,
      resolvedVanUpgrades: [...(state.player?.van?.upgrades ?? [])],
      resolvedStartingVanFuel: state.player?.van?.fuel ?? null
    }
  }

  activeState.expedition.provenance = provenance
  return activeState
}
