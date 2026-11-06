/**
 * @fileoverview Browser-compatible shared Expedition fixture foundation.
 *
 * Provides baseline constants, legal loadout construction, and pure PREPARE -> START
 * transaction construction without Node-only dependencies (e.g., node:assert).
 * Shared between Node lifecycle fixtures (`tests/expeditionLifecycleFixture.js`)
 * and Playwright browser fixtures (`e2e/fixtures/expeditionFixtures.js`).
 */

import { createInitialState } from '../src/context/initialState.ts'
import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { SONGS_BY_ID } from '../src/data/songs.ts'

/** Seed used by every lifecycle fixture, so route assertions stay stable. */
export const FIXTURE_RUN_SEED = 4242

export const FIXTURE_TOUR_ID = 'standard_tour'

/**
 * The Region a fresh Career actually books.
 */
export const FIXTURE_REGION_ID = 'home_turf'

export const FIXTURE_PREP_ID = 'run_fixture'

export const FIXTURE_MONEY = 5000

export const FIXTURE_SONG_ID = [...SONGS_BY_ID.keys()][0]

/**
 * Builds the minimal legal G1A loadout.
 *
 * @param {Record<string, unknown>} overrides - Custom loadout field overrides.
 * @returns {Record<string, unknown>} Minimal legal loadout.
 */
export const fixtureLoadout = (overrides = {}) => ({
  tourTypeId: FIXTURE_TOUR_ID,
  regionId: FIXTURE_REGION_ID,
  activeTourbusAssetId: null,
  crewIds: [],
  cargo: { spareParts: 0, supplies: 0 },
  starterPerkId: null,
  nativeContracts: [],
  insurancePolicyId: null,
  pressureModifierIds: [],
  ...overrides,
  build: {
    setlistSongIds: [FIXTURE_SONG_ID],
    equipment: { selectedGearItemIds: [] },
    selectedTourbusModuleIds: [],
    merch: [],
    contraband: [],
    sponsorOfferId: null,
    startingFuelTarget: 100,
    protectedCareerCash: 0,
    ...(overrides.build ?? {})
  }
})

/**
 * A Career sitting at the prepared stage with the fixture seed claimed.
 *
 * @param {object} options - Initial resources and unlock options.
 * @returns {import('../src/types/game').GameState} Prepared game state.
 */
export const preparedExpeditionState = ({
  money = FIXTURE_MONEY,
  fame = 100,
  fuel = 100,
  runSeed = FIXTURE_RUN_SEED,
  prepId = FIXTURE_PREP_ID,
  unlockedSetIds = []
} = {}) => {
  const fresh = createInitialState()
  fresh.player.money = money
  fresh.player.fame = fame
  fresh.player.van.fuel = fuel
  fresh.career = { ...fresh.career, unlockedSetIds: [...unlockedSetIds] }
  return gameReducer(fresh, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId, runSeed }
  })
}

/**
 * Starts the fixture run through the real START transaction.
 *
 * @param {object} options - State options.
 * @param {object} loadoutOverrides - Custom loadout overrides.
 * @returns {import('../src/types/game').GameState} Started game state.
 */
export const startedExpeditionState = (options = {}, loadoutOverrides = {}) => {
  const runSeed = options.runSeed ?? FIXTURE_RUN_SEED
  const prepId = options.prepId ?? FIXTURE_PREP_ID
  const prepared = preparedExpeditionState({ ...options, runSeed, prepId })
  return gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId,
      expectedRunSeed: runSeed,
      loadout: fixtureLoadout(loadoutOverrides)
    }
  })
}
