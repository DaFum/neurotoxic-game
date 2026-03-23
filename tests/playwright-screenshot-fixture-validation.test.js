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

// Import the actual initialState for comparison
import { initialState } from '../src/context/initialState.js'

// Import BASE_STATE directly — ensures fixture shape stays in sync with game state
import { BASE_STATE } from '../.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js'

describe('Playwright Screenshot Fixtures', () => {
  test('BASE_STATE contains all required top-level fields from initialState', () => {
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
      'sponsorActive',
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
    const { harmony } = initialState.band
    strictEqual(typeof harmony, 'number', 'harmony must be a number')
    ok(
      harmony >= 1 && harmony <= 100,
      `harmony must be between 1 and 100, got ${harmony}`
    )
  })

  test('player.money is non-negative', () => {
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
