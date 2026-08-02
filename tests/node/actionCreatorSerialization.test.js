/**
 * @fileoverview Enforces that every action creator produces a JSON-serializable
 * action.
 *
 * A `Date`, `Set`, `Map`, callback, or `undefined` inside a payload survives in
 * memory but not through `JSON.stringify` — the save silently loses it and the
 * failure surfaces at load time, far from the change that caused it. This suite
 * catches that at the creator boundary.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as actionCreators from '../../src/context/actionCreators'
import * as assetActionCreators from '../../src/context/assetActionCreators'
import { createInitialState } from '../../src/context/initialState'
import { GAME_PHASES } from '../../src/context/gameConstants'

/**
 * Walks a value and returns the path of the first non-serializable member.
 *
 * `JSON.stringify` coerces or drops these types instead of throwing, so a
 * round-trip alone cannot name the offender.
 */
const findNonSerializable = (value, path = '$') => {
  if (value === undefined) return { path, kind: 'undefined' }
  if (typeof value === 'function') return { path, kind: 'function' }
  if (typeof value === 'symbol') return { path, kind: 'symbol' }
  if (typeof value === 'bigint') return { path, kind: 'bigint' }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { path, kind: `non-finite number (${value})` }
  }
  if (value === null || typeof value !== 'object') return null

  if (value instanceof Date) return { path, kind: 'Date' }
  if (value instanceof Set) return { path, kind: 'Set' }
  if (value instanceof Map) return { path, kind: 'Map' }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      const found = findNonSerializable(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return null
  }

  for (const key of Object.keys(value)) {
    const found = findNonSerializable(value[key], `${path}.${key}`)
    if (found) return found
  }
  return null
}

/**
 * Asserts the action names no non-serializable member and survives a JSON
 * round-trip unchanged.
 */
const assertSerializable = (name, action) => {
  const offender = findNonSerializable(action)
  assert.strictEqual(
    offender,
    null,
    offender
      ? `${name} payload holds a ${offender.kind} at ${offender.path}`
      : ''
  )
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(action)),
    action,
    `${name} action changed across a JSON round-trip`
  )
}

const baseState = () => createInitialState()

/**
 * Call arguments per creator.
 *
 * Creators that also accept a `(prev) => …` updater or a `getSuccessToast`
 * closure are exercised through their plain-data variant only: those function
 * payloads are consumed by the reducer at dispatch time and never reach a save,
 * so they are intentionally out of scope here.
 */
const CREATOR_ARGS = {
  createChangeSceneAction: () => [GAME_PHASES.OVERWORLD],
  createUpdatePlayerAction: () => [{ money: 500, fame: 10 }],
  createUpdateBandAction: () => [{ harmony: 80 }],
  toggleNeuroDecimator: () => [true],
  createUpdateSocialAction: () => [{ instagram: 1000 }],
  createUpdateSettingsAction: () => [{ crtEnabled: false }],
  createSetMapAction: () => [{ nodes: {}, connections: [] }],
  createSetGigAction: () => [{ name: 'Test Venue', capacity: 100 }],
  createStartGigAction: () => [{ name: 'Test Venue', capacity: 100, diff: 2 }],
  createSetSetlistAction: () => [[{ songId: 'song_1' }]],
  createSetLastGigStatsAction: () => [
    { score: 1000, accuracy: 92, misses: 3, failed: false }
  ],
  createSetActiveEventAction: () => [{ id: 'evt_1', type: 'flavor' }],
  createAddToastAction: () => ['hello', 'info'],
  createRemoveToastAction: () => ['toast_1'],
  createSetGigModifiersAction: () => [{ merch: true }],
  createLoadGameAction: () => [{ version: 1, player: { money: 100 } }],
  createResetStateAction: () => [{ settings: {}, unlocks: [] }],
  createApplyEventDeltaAction: () => [
    { money: -50, activeStoryFlags: ['flag_a'], pendingEvents: [] }
  ],
  createPopPendingEventAction: () => [],
  createConsumeItemAction: () => ['beer'],
  createAddCooldownAction: () => ['evt_1'],
  createStartTravelMinigameAction: () => ['node_1'],
  createCompleteTravelMinigameAction: () => [10, ['FUEL'], 0.5],
  createStartRoadieMinigameAction: () => ['gig_1'],
  createCompleteRoadieMinigameAction: () => [20, 1, 'stash_1'],
  createStartKabelsalatMinigameAction: () => ['gig_1'],
  createCompleteKabelsalatMinigameAction: () => [
    { isPoweredOn: true, timeLeft: 10, cablesConnected: 4 }
  ],
  createStartAmpCalibrationAction: () => ['gig_1'],
  createCompleteAmpCalibrationAction: () => [80, 2, 1, 0],
  createSpawnRivalBandAction: () => [baseState()],
  createMoveRivalBandAction: () => [
    { id: 'rival_1', currentNodeId: 'node_1', fame: 10 },
    { nodes: { node_1: { id: 'node_1', connections: [] } }, connections: [] }
  ],
  createCheckRivalEncounterAction: () => [],
  createUpdateRivalBandAction: () => [{ fame: 25 }],
  createUnlockTraitAction: () => ['matze', 'gear_nerd'],
  createUnblacklistVenueAction: () => ['venue_1'],
  createCraftItemAction: () => ['recipe_1', 'instance_1'],
  createAddQuestAction: () => [{ id: 'quest_1', progress: 0 }],
  createAdvanceQuestAction: () => ['quest_1', 1, 0],
  createAddUnlockAction: () => ['unlock_1'],
  createUseContrabandAction: () => ['instance_1', 'contraband_1', 'matze'],
  createClinicHealAction: () => [
    { memberId: 'matze', type: 'heal', staminaGain: 50, moodGain: 20 }
  ],
  createClinicEnhanceAction: () => [
    { memberId: 'matze', type: 'enhance', trait: 'gear_nerd' }
  ],
  createPirateBroadcastAction: () => [
    {
      cost: 100,
      fameGain: 5,
      zealotryGain: 3,
      controversyGain: 4,
      harmonyCost: 2
    }
  ],
  createSetPendingBandHQOpenAction: () => [true],
  createSetPendingSupplyStopInventoryAction: () => [
    [{ id: 'item_1', price: 10 }]
  ],
  dismissForeclosureNotice: () => ['tourbus_chassis'],
  createSetPendingRiskEventAction: () => [
    { assetId: 'asset_1', kind: 'tourbus_chassis', severity: 'minor' }
  ],
  createBloodBankDonateAction: () => [
    { moneyGain: 60, harmonyCost: 2, staminaCost: 10, controversyGain: 1 }
  ],
  createTradeVoidItemAction: () => [
    { contrabandId: 'contraband_1', fameCost: 10, instanceId: 'instance_1' }
  ],
  createDarkWebLeakAction: () => [
    {
      cost: 200,
      fameGain: 8,
      zealotryGain: 4,
      controversyGain: 10,
      harmonyCost: 5
    }
  ],
  createMerchPressAction: () => [
    {
      cost: 150,
      loyaltyGain: 5,
      controversyGain: 2,
      fameGain: 3,
      harmonyCost: 1
    }
  ],
  advanceDay: () => [baseState()],
  createApplyQuestEventAction: () => [{ type: 'gig_completed', amount: 1 }],
  graftNeuroOverclock: () => ['matze'],
  createCultIndoctrinationAction: () => [
    {
      cost: 300,
      fameGain: 10,
      zealotryGain: 12,
      controversyGain: 6,
      harmonyCost: 4
    }
  ],
  // Asset-system creators: each needs a shape-correct state to validate against.
  purchaseChassis: () => [
    { kind: 'tourbus_chassis', flavor: 'legit', financing: 'cash' },
    baseState()
  ],
  installModule: () => [
    { assetId: 'asset_1', moduleId: 'module_1', slotId: 'tb_roof' },
    baseState()
  ],
  removeModule: () => ['asset_1', 'tb_roof'],
  upgradeChassisTier: () => ['asset_1', 2, baseState()],
  sellChassis: () => ['asset_1', baseState()],
  repairChassis: () => ['asset_1', baseState()],
  refinanceLiability: () => ['liability_1', 'bank_standard', baseState()],
  startCrowdfund: () => [
    { assetKind: 'tourbus_chassis', goal: 5000 },
    { assets: [], crowdfundCampaigns: [] }
  ],
  assetForeclosed: () => ['asset_1']
}

const collectCreators = () =>
  [
    ...Object.entries(actionCreators),
    ...Object.entries(assetActionCreators)
  ].filter(([, value]) => typeof value === 'function')

describe('action creator payload serialization', () => {
  it('has a sample call for every exported creator', () => {
    const missing = collectCreators()
      .map(([name]) => name)
      .filter(name => !Object.hasOwn(CREATOR_ARGS, name))

    assert.deepStrictEqual(
      missing,
      [],
      'Add sample arguments in CREATOR_ARGS for these creators'
    )
  })

  it('names no creator in CREATOR_ARGS that is not exported', () => {
    const exported = new Set(collectCreators().map(([name]) => name))
    const stale = Object.keys(CREATOR_ARGS).filter(name => !exported.has(name))

    assert.deepStrictEqual(stale, [])
  })

  for (const [name, creator] of collectCreators()) {
    it(`${name} produces a serializable action`, () => {
      const args = CREATOR_ARGS[name]
      if (!args) return
      assertSerializable(name, creator(...args()))
    })
  }
})
