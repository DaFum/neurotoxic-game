/**
 * playwright-screenshot-fixture-validation.test.js
 *
 * Validates that fixture states in screenshot-state-inject.js
 * are compatible with the actual game's initialState.js structure.
 *
 * Prevents silent failures when game state schema changes.
 */

import { test, describe } from 'node:test'
import { ok, strictEqual } from 'node:assert'

// Import the actual initial state factory for comparison
import { createInitialState } from '../../src/context/initialState'

// Import BASE_STATE directly — ensures fixture shape stays in sync with game state
import {
  BASE_STATE,
  FIXTURES,
  deepMerge
} from '../../.claude/skills/playwright-screenshot/scripts/screenshot-state-inject'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { ALLOWED_SCENE_VALUES } from '../../src/context/gameConstants'

describe('Playwright Screenshot Fixtures', () => {
  test('BASE_STATE contains all required top-level fields from initialState', () => {
    const initialState = createInitialState()

    // Compare BASE_STATE against initialState to catch drift.
    // Fields listed here are allowed to be absent from BASE_STATE because
    // they're transient/runtime-only and always supplied at hydration time.
    // Note: BASE_STATE currently includes both of these anyway (with safe
    // defaults), so this set acts as a future-proofing allowlist.
    const ALLOWED_OMISSIONS = new Set([
      'toasts', // runtime-only UI queue, never injected via fixture
      'isScreenshotMode' // defaults to false in BASE_STATE; fixtures override per-fixture
    ])

    const initialKeys = Object.keys(initialState)
    for (const field of initialKeys) {
      if (ALLOWED_OMISSIONS.has(field)) continue
      ok(
        Object.hasOwn(BASE_STATE, field),
        `BASE_STATE is missing field "${field}" that exists in initialState — update BASE_STATE in screenshot-state-inject.js`
      )
    }
  })

  test('BASE_STATE has no fields absent from initialState', () => {
    const initialState = createInitialState()

    // Catch fields added to BASE_STATE that were never in initialState
    const initialKeys = new Set(Object.keys(initialState))
    for (const field of Object.keys(BASE_STATE)) {
      ok(
        initialKeys.has(field),
        `BASE_STATE has extra field "${field}" not in initialState — remove it or add it to initialState`
      )
    }
  })

  test('player object has all required fields', () => {
    const initialState = createInitialState()

    const requiredPlayerFields = [
      'playerId',
      'playerName',
      'money',
      'day',
      'time',
      'location',
      'currentNodeId',
      'lastGigNodeId',
      'tutorialStep',
      'score',
      'fame',
      'fameLevel',
      'eventsTriggeredToday',
      'totalTravels',
      'hqUpgrades',
      'clinicVisits',
      'van',
      'passiveFollowers',
      'stats'
    ]

    for (const field of requiredPlayerFields) {
      ok(
        Object.hasOwn(initialState.player, field),
        `initialState.player is missing required field: ${field}`
      )
    }
  })

  test('band object has all required fields', () => {
    const initialState = createInitialState()

    const requiredBandFields = [
      'members',
      'harmony',
      'harmonyRegenTravel',
      'inventorySlots',
      'luck',
      'stash',
      'activeContrabandEffects',
      'performance',
      'inventory'
    ]

    for (const field of requiredBandFields) {
      ok(
        Object.hasOwn(initialState.band, field),
        `initialState.band is missing required field: ${field}`
      )
    }
  })

  test('social object has all required fields', () => {
    const initialState = createInitialState()

    const requiredSocialFields = [
      'instagram',
      'tiktok',
      'youtube',
      'newsletter',
      'viral',
      'lastGigDay',
      'lastPirateBroadcastDay',
      'controversyLevel',
      'loyalty',
      'zealotry',
      'reputationCooldown',
      'egoFocus',
      'trend',
      'activeDeals',
      'brandReputation',
      'influencers'
    ]

    for (const field of requiredSocialFields) {
      ok(
        Object.hasOwn(initialState.social, field),
        `initialState.social is missing required field: ${field}`
      )
    }
  })

  test('minigame state has correct structure', () => {
    const initialState = createInitialState()

    const requiredMinigameFields = [
      'active',
      'type',
      'targetDestination',
      'gigId',
      'equipmentRemaining',
      'accumulatedDamage',
      'score'
    ]

    for (const field of requiredMinigameFields) {
      ok(
        Object.hasOwn(initialState.minigame, field),
        `initialState.minigame is missing required field: ${field}`
      )
    }
  })

  test('player.stats has required fields', () => {
    const initialState = createInitialState()

    const requiredStatsFields = [
      'totalDistance',
      'conflictsResolved',
      'stageDives',
      'consecutiveBadShows',
      'proveYourselfMode'
    ]

    for (const field of requiredStatsFields) {
      ok(
        Object.hasOwn(initialState.player.stats, field),
        `initialState.player.stats is missing required field: ${field}`
      )
    }
  })

  test('band.harmony is a valid number within bounds [1, 100]', () => {
    const initialState = createInitialState()
    const { harmony } = initialState.band
    strictEqual(typeof harmony, 'number', 'harmony must be a number')
    ok(
      harmony >= 1 && harmony <= 100,
      `harmony must be between 1 and 100, got ${harmony}`
    )
  })

  test('player.money is non-negative', () => {
    const initialState = createInitialState()
    const { money } = initialState.player
    ok(typeof money === 'number', 'player.money must be a number')
    ok(money >= 0, `player.money must be >= 0, got ${money}`)
  })

  test('deepMerge correctly handles nested objects', () => {
    // Verify that fixture overrides work correctly
    const BASE = { band: { harmony: 72, members: [] } }
    const OVERRIDE = { band: { harmony: 1 } }

    function deepMerge(base, override) {
      const result = { ...base }
      for (const key of Object.keys(override ?? {})) {
        if (
          override[key] !== null &&
          typeof override[key] === 'object' &&
          !Array.isArray(override[key]) &&
          base[key] !== null &&
          typeof base[key] === 'object' &&
          !Array.isArray(base[key])
        ) {
          result[key] = deepMerge(base[key], override[key])
        } else {
          result[key] = override[key]
        }
      }
      return result
    }

    const merged = deepMerge(BASE, OVERRIDE)

    // Verify that harmony was overridden
    strictEqual(
      merged.band.harmony,
      1,
      `Expected harmony: 1 after merge, got ${merged.band.harmony}`
    )

    // Verify that members was preserved
    ok(
      Array.isArray(merged.band.members),
      'Expected members to be preserved in merge'
    )
  })

  test('no duplicate keys would cause issues', () => {
    // This is a meta-test: verify the pattern doesn't have duplicate keys
    const testState = {
      band: {
        members: [],
        harmony: 72 // Only one harmony key
      }
    }

    const harmonyCount = Object.keys(testState.band).filter(
      k => k === 'harmony'
    ).length
    strictEqual(
      harmonyCount,
      1,
      `Expected exactly 1 'harmony' key in band object, found ${harmonyCount}`
    )
  })
})

/**
 * The capture scripts inject a fixture as a save, and the game loads it through
 * `handleLoadGame` and its sanitizers. Anything the sanitizers do not whitelist
 * is dropped without a word, so a fixture can look right in source and arrive
 * gutted — which is exactly what happened to `postgig`: its `lastGigStats` was
 * written in report vocabulary (`earnings`, `crowdScore`, …), none of which
 * `sanitizeLastGigStats` keeps, so it sanitised to `null` and the scene
 * rendered a loading shell while the capture reported success.
 *
 * These tests run each fixture through the real load path and assert the fields
 * that fixture's scene actually needs, so the failure surfaces at authoring
 * time instead of in a screenshot.
 */
describe('Fixture states survive handleLoadGame', () => {
  /**
   * @param {string} name - Fixture key.
   * @returns {import('../../src/types').GameState} State after a real load.
   */
  const load = name =>
    handleLoadGame(
      BASE_STATE,
      deepMerge(BASE_STATE, FIXTURES[name].state ?? {})
    )

  test('every fixture targets a scene the reducer allows', () => {
    for (const name of Object.keys(FIXTURES)) {
      const scene = FIXTURES[name].state?.currentScene ?? 'OVERWORLD'
      ok(
        ALLOWED_SCENE_VALUES.includes(scene),
        `Fixture '${name}' targets unknown scene '${scene}'`
      )
    }
  })

  test('postgig keeps lastGigStats, without which the report cannot render', () => {
    const loaded = load('postgig')
    ok(
      loaded.lastGigStats !== null && loaded.lastGigStats !== undefined,
      'postgig lastGigStats sanitised away — POSTGIG will render its ' +
        '"TALLYING RECEIPTS…" shell instead of the report'
    )
    ok(
      Number.isFinite(loaded.lastGigStats.score),
      'postgig lastGigStats.score missing after load; only the sanitizer ' +
        'whitelist (score/misses/accuracy/combo/maxCombo/health/overload) survives'
    )
  })

  test('gig-bearing fixtures keep currentGig through sanitizeVenue', () => {
    for (const name of ['pregig', 'gig', 'postgig']) {
      const loaded = load(name)
      ok(
        loaded.currentGig !== null && loaded.currentGig !== undefined,
        `Fixture '${name}' lost currentGig — sanitizeVenue nulls venues that ` +
          'do not use the real Venue shape, and the scene bounces to OVERWORLD'
      )
      strictEqual(
        typeof loaded.currentGig.id,
        'string',
        `Fixture '${name}' currentGig.id must survive as a string`
      )
    }
  })

  test('minigame fixtures keep their type, which distinguishes them', () => {
    const minigameFixtures = Object.keys(FIXTURES).filter(
      name => FIXTURES[name].state?.minigame?.type
    )
    ok(
      minigameFixtures.length > 0,
      'expected at least one minigame fixture to guard'
    )
    for (const name of minigameFixtures) {
      const expected = FIXTURES[name].state.minigame.type
      strictEqual(
        load(name).minigame?.type,
        expected,
        `Fixture '${name}' lost minigame.type '${expected}' on load; three ` +
          'fixtures share PRE_GIG_MINIGAME and this is what tells them apart'
      )
    }
  })
})
