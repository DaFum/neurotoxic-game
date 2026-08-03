/**
 * @fileoverview Per-slice round-trip serialization for the persisted save.
 *
 * The assertion is `serialize(deserialize(serialize(slice))) === serialize(slice)`
 * for every slice `createPersistedState` writes. Slice-level rather than
 * whole-state on purpose: a migration that drops or reorders a field then names
 * the offending slice instead of producing an unreadable diff of the whole save.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import {
  createPersistedState,
  createRawLoadPayload
} from '../../src/context/usePersistence'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { createFixedClock } from '../../src/utils/clock'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig'

const clock = createFixedClock(Date.parse('2026-01-01T00:00:00Z'))

/**
 * A state with every persisted slice populated.
 *
 * An empty slice round-trips trivially, so the fixture fills each one with a
 * representative shape — nested objects, arrays of records, and a numeric map —
 * to give the round-trip something to lose.
 */
const buildPopulatedState = () => {
  const state = createInitialState()

  state.currentScene = 'OVERWORLD'
  state.player.money = 4200
  state.player.day = 12
  state.player.fame = 340
  state.player.van = { condition: 72, fuel: 30, upgrades: ['van_tuning'] }
  state.band.harmony = 64
  state.band.inventory = { shirts: 12, vinyl: 3 }
  state.social.regionalGigHistory = { berlin: [2, 4], hamburg: [7] }
  state.social.instagram = 1500
  state.gameMap = {
    nodes: {
      node_1: {
        id: 'node_1',
        x: 10,
        y: 20,
        type: 'venue',
        connections: ['node_2']
      },
      node_2: { id: 'node_2', x: 30, y: 40, type: 'city', connections: [] }
    },
    connections: [['node_1', 'node_2']]
  }
  state.currentGig = { id: 'venue_1', name: 'Bunker', capacity: 200, diff: 3 }
  // `failed: true` rather than `false`: `sanitizeLastGigStats` only preserves
  // the flag when it is `true` (absence is the default), and its own comment
  // says the flag must survive a save/load round-trip — so this is the value
  // worth asserting.
  state.lastGigStats = {
    score: 12000,
    accuracy: 41.5,
    misses: 44,
    combo: 12,
    failed: true
  }
  state.activeEvent = { id: 'evt_1', type: 'flavor', titleKey: 'events:evt_1' }
  state.activeStoryFlags = ['flag_a', 'flag_b']
  state.eventCooldowns = [{ eventId: 'evt_1', until: 18 }]
  state.pendingEvents = ['evt_2']
  state.venueBlacklist = ['venue_9']
  state.pendingForeclosureNotices = [{ kind: 'tourbus_chassis', day: 11 }]
  // Must satisfy `sanitizeRiskEventDescriptor`: a descriptor missing
  // `eventType` or `conditionLoss` is legitimately dropped to null on load.
  state.pendingRiskEvent = {
    assetId: 'asset_1',
    eventType: 'theft',
    conditionLoss: 12
  }
  state.activeQuests = [{ id: 'quest_1', progress: 2, target: 5 }]
  state.questCooldowns = [{ questId: 'quest_1', until: 20 }]
  state.completedQuestIds = ['quest_0']
  state.completedQuestScopes = ['scope_a']
  state.reputationByRegion = { berlin: 25, hamburg: -10 }
  state.npcs = { promoter_1: { trust: 40 } }
  state.gigModifiers = { ...state.gigModifiers, merch: true, promo: true }
  state.setlist = [{ songId: 'song_1' }, { songId: 'song_2' }]
  state.minigame = { ...state.minigame, type: 'travel', targetNodeId: 'node_2' }
  state.completedMilestones = ['milestone_1']
  // Shapes must match what `sanitizeAssets` / `sanitizeLiabilities` /
  // `sanitizeCrowdfundCampaigns` accept, otherwise the load legitimately drops
  // them and this suite would be asserting against sanitizer rejection rather
  // than round-trip fidelity.
  // `sanitizeAssets` re-derives the chassis economics from `CHASSIS_CONFIG` on
  // load, so the fixture carries the derived fields too — read from the config
  // rather than hardcoded, so retuning upkeep or revenue does not break this
  // suite for an unrelated reason.
  const chassisTier = CHASSIS_CONFIG.tourbus_chassis.legit[1]
  state.assets = [
    {
      id: 'asset_1',
      kind: 'tourbus_chassis',
      chassisFlavor: 'legit',
      chassisTier: 1,
      condition: 88,
      baseUpkeep: chassisTier.upkeep,
      baseDailyRevenue: chassisTier.revenue,
      slots: [],
      acquiredOnDay: 4,
      acquisitionMode: 'loan',
      baseRiskEventChance: chassisTier.baseRiskEventChance
    }
  ]
  state.liabilities = [
    {
      id: 'liability_1',
      source: 'loan',
      assetId: 'asset_1',
      principalRemaining: 3000,
      interestRate: 0.01,
      dailyPayment: 25,
      termDaysRemaining: 120,
      defaultCounter: 0
    }
  ]
  state.crowdfundCampaigns = [
    {
      id: 'campaign_1',
      assetSpec: {
        kind: 'studio_chassis',
        flavor: 'diy',
        chassisTier: 1
      },
      targetAmount: 5000,
      fameStake: 40,
      daysRemaining: 6,
      // `sanitizeCrowdfundCampaigns` requires the materialized ids and the
      // planned-roll fields; omitting them makes it synthesize defaults, which
      // would read as a round-trip mismatch here.
      plannedSuccessRoll: 0.42,
      plannedSuccessProbability: 0.6,
      materializedAssetId: 'campaign_1_materialized_asset',
      materializedSlotIds: ['slot_1']
    }
  ]
  state.rngSeed = 123456
  state.runSeed = 654321
  // `sanitizeRivalBand` returns exactly these five fields — `fame` is not one of
  // them, so an invented field would read as a round-trip loss.
  state.rivalBand = {
    id: 'rival_1',
    name: 'Kranker Schrank',
    alignment: 'NEUTRAL',
    powerLevel: 12,
    currentLocationId: 'node_1'
  }
  state.unlocks = ['unlock_1', 'unlock_2']

  return state
}

const serialize = value => JSON.stringify(value)
const deserialize = value => JSON.parse(value)

describe('persisted save slice round-trip', () => {
  const persisted = createPersistedState(buildPopulatedState(), clock)
  const sliceNames = Object.keys(persisted)

  it('writes every slice the fixture populates', () => {
    // Guards against a slice silently disappearing from the snapshot picker.
    assert.ok(sliceNames.length > 20, `only ${sliceNames.length} slices found`)
    assert.ok(sliceNames.includes('version'))
    assert.ok(sliceNames.includes('unlocks'))
  })

  for (const slice of sliceNames) {
    it(`${slice} survives a serialize → deserialize → serialize round-trip`, () => {
      const once = serialize(persisted[slice])
      // `undefined` at the top of a slice serializes to the literal `undefined`
      // return value of JSON.stringify, which is itself a red flag.
      assert.strictEqual(
        typeof once,
        'string',
        `${slice} is not serializable at all`
      )
      const twice = serialize(deserialize(once))

      assert.strictEqual(twice, once, `${slice} changed across the round-trip`)
    })
  }

  it('the whole snapshot is stable across a round-trip', () => {
    const once = serialize(persisted)
    assert.strictEqual(serialize(deserialize(once)), once)
  })

  it('a reloaded save keeps every slice populated and round-trip stable', () => {
    // The load path is where a dropped field actually costs the player their
    // run, so the round-trip is repeated through the reducer.
    const parsed = deserialize(serialize(persisted))
    const reloaded = handleLoadGame(
      createInitialState(),
      createRawLoadPayload(parsed, parsed.unlocks ?? [])
    )
    const reserialized = createPersistedState(reloaded, clock)

    for (const slice of sliceNames) {
      const original = serialize(persisted[slice])
      const after = serialize(reserialized[slice])

      // A dropped slice is the failure this case exists to catch, and
      // `typeof x === 'string'` alone would not catch it: `JSON.stringify` of a
      // dropped slice returns the string `"null"` or `undefined`.
      assert.notStrictEqual(
        after,
        undefined,
        `${slice} became undefined across the load`
      )
      if (original !== 'null') {
        assert.notStrictEqual(
          after,
          'null',
          `${slice} was dropped to null across the load`
        )
      }
      // The reloaded value must itself be round-trip stable. An exact match
      // against the original is deliberately not asserted: several slices are
      // intentionally normalized on load (the setlist through
      // `normalizeSetlistForSave`, regional gig history through deduping), and
      // pinning those here would only re-test the normalizers.
      assert.strictEqual(
        serialize(deserialize(after)),
        after,
        `${slice} is not round-trip stable after a load`
      )
    }
  })

  it('the reloaded snapshot preserves the slices that are not normalized on load', () => {
    // Named explicitly rather than swept, so a slice that silently starts
    // getting rewritten on load shows up as a failure instead of being absorbed
    // by a blanket allowance.
    const STABLE_SLICES = [
      'version',
      'currentScene',
      'currentGig',
      'lastGigStats',
      'activeStoryFlags',
      'pendingEvents',
      'venueBlacklist',
      'completedQuestIds',
      'reputationByRegion',
      'completedMilestones',
      'assets',
      'crowdfundCampaigns',
      'rngSeed',
      'runSeed',
      'rivalBand'
    ]

    const parsed = deserialize(serialize(persisted))
    const reloaded = handleLoadGame(
      createInitialState(),
      createRawLoadPayload(parsed, parsed.unlocks ?? [])
    )
    const reserialized = createPersistedState(reloaded, clock)

    for (const slice of STABLE_SLICES) {
      assert.ok(
        sliceNames.includes(slice),
        `${slice} is no longer a persisted slice — update this list`
      )
      assert.deepStrictEqual(
        reserialized[slice],
        persisted[slice],
        `${slice} changed across the load round-trip`
      )
    }
  })
})
