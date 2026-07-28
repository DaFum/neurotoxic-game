import { DEFAULT_BALANCE_TUNING } from '../../src/utils/balanceTuning'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeRegionalGigHistory,
  appendToRegionalGigHistory
} from '../../src/utils/gameState/regionalGigHistory'

test('normalizeRegionalGigHistory bounds the history correctly', () => {
  assert.deepEqual(normalizeRegionalGigHistory(null), {})
  assert.deepEqual(normalizeRegionalGigHistory(undefined), {})
  assert.deepEqual(normalizeRegionalGigHistory('string'), {})

  const history = {
    region1: [1, 2, 2, 3],
    region2: [5, 4, -1, 3.5, Infinity, NaN, 6],
    __proto__: { injected: true }
  }

  const normalized = normalizeRegionalGigHistory(history)
  assert.deepEqual(normalized.region1, [1, 2, 3], 'Should deduplicate and sort')
  assert.deepEqual(
    normalized.region2,
    [4, 5, 6],
    'Should filter invalid entries and sort'
  )
  assert.equal(
    normalized.__proto__,
    Object.prototype,
    'Should filter forbidden keys'
  )
  assert.equal(
    normalized.injected,
    undefined,
    'Should not have injected properties'
  )
})

test('appendToRegionalGigHistory appends and bounds', () => {
  const history = { region1: [1] }
  const appended = appendToRegionalGigHistory(history, 'region1', 2)
  assert.deepEqual(appended.region1, [1, 2])

  const overLimit = { region1: Array.from({ length: 256 }, (_, i) => i) }
  const appendedOverLimit = appendToRegionalGigHistory(
    overLimit,
    'region1',
    300
  )
  assert.equal(appendedOverLimit.region1.length, 256)
  assert.equal(appendedOverLimit.region1[0], 1, 'Should slice from the end')
  assert.equal(
    appendedOverLimit.region1[255],
    300,
    'Should contain the newest entry'
  )
})

test('normalizeRegionalGigHistory limits to 100 regions', () => {
  const history = {}
  for (let i = 0; i < 150; i++) {
    history[`region${i}`] = [1]
  }

  const normalized = normalizeRegionalGigHistory(history)
  assert.equal(Object.keys(normalized).length, 100)
})

import { validateSaveData } from '../../src/utils/saveValidator'
import { sanitizeSocial } from '../../src/context/reducers/sanitizers/stateSanitizers'
import { createInitialState } from '../../src/context/initialState'

test('regionalGigHistory roundtrip integration', () => {
  // initial state
  const state = createInitialState()
  if (!state.gameMap) state.gameMap = { nodes: [] }
  const history = {}
  // fill history up to limit
  for (let i = 0; i < 256; i++) {
    const updated = appendToRegionalGigHistory(history, 'stendal', i)
    Object.assign(history, updated)
  }
  assert.equal(history.stendal.length, 256)

  // append one more
  const finalHistory = appendToRegionalGigHistory(history, 'stendal', 300)
  assert.equal(finalHistory.stendal.length, 256)
  assert.equal(finalHistory.stendal[255], 300)

  state.social.regionalGigHistory = finalHistory

  // mock createPersistedState implicitly done by just keeping the object
  const persistedString = JSON.stringify(state)
  const parsed = JSON.parse(persistedString)

  // validateSaveData
  validateSaveData(parsed)
  // validateSaveData modifies the object by reference and throws if valid structure is not present
  try {
    validateSaveData(parsed)
    assert.ok(true)
  } catch (e) {
    assert.fail(
      'Validator should not throw: ' +
        (e instanceof Error ? e.message : String(e))
    )
  }

  // sanitizer/reducer load
  const loadedState = sanitizeSocial(parsed.social)
  assert.deepEqual(loadedState.regionalGigHistory, finalHistory)
})

import { calculatePostGigStateUpdates } from '../../src/utils/postGigUtils'
import { getRegionKeyForLocation } from '../../src/utils/mapUtils'

const buildPostGigParams = (social, player) => ({
  option: {
    id: 'post_gig_region_option',
    platform: 'instagram',
    condition: () => true,
    resolve: () => ({
      success: true,
      platform: 'instagram',
      followers: 0,
      message: 'Region history test'
    })
  },
  player: { money: 100, day: 12, ...player },
  band: { harmony: 50, members: [] },
  social: {
    instagram: 0,
    tiktok: 0,
    youtube: 0,
    newsletter: 0,
    viral: 0,
    controversyLevel: 0,
    loyalty: 0,
    zealotry: 0,
    reputationCooldown: 0,
    trend: 'MUSIC',
    activeDeals: [],
    influencers: {},
    ...social
  },
  secureRandomValue: 0.5
})

test('post-gig path normalizes regional gig history through the canonical helper', () => {
  const updates = calculatePostGigStateUpdates(
    buildPostGigParams(
      { regionalGigHistory: { berlin: [12, 5, 5, -3, 2.5] } },
      { location: 'venues:berlin_club.name', day: 12 }
    )
  )

  // Raw appending would yield [12, 5, 5, -3, 2.5, 12]; only the canonical
  // helper dedupes, sorts and drops non-integer/negative days.
  assert.deepEqual(updates.updatedSocial.regionalGigHistory.berlin, [5, 12])
})

// `player.location` is persisted and only loosely constrained, and
// `getRegionKeyForLocation` returns 'constructor' / '__proto__' unchanged (the
// latter because its first underscore sits at index 0). A bare index read then
// resolves an inherited Object.prototype value instead of undefined, and the
// spread throws mid post-gig resolution.
const FORBIDDEN_REGION_LOCATIONS = [
  'constructor',
  '__proto__',
  'venues:constructor.name'
]

FORBIDDEN_REGION_LOCATIONS.forEach(location => {
  test(`appendToRegionalGigHistory rejects the forbidden region key from ${location}`, () => {
    const regionId = getRegionKeyForLocation(location)
    const history = { berlin: [1] }

    const result = appendToRegionalGigHistory(history, regionId, 5)

    assert.deepEqual(result, { berlin: [1] })
    assert.equal(Object.hasOwn(result, '__proto__'), false)
    assert.equal(result.berlin.length, 1)
  })

  test(`post-gig path survives a persisted ${location} location`, () => {
    const updates = calculatePostGigStateUpdates(
      buildPostGigParams({ regionalGigHistory: { berlin: [1] } }, { location })
    )

    assert.deepEqual(updates.updatedSocial.regionalGigHistory, { berlin: [1] })
  })
})

test('post-gig path keeps the played region within the validator region cap', () => {
  const regionalGigHistory = {}
  for (let index = 0; index < 100; index++) {
    regionalGigHistory[`region${index}`] = [index + 1]
  }

  const updates = calculatePostGigStateUpdates(
    buildPostGigParams(
      { regionalGigHistory },
      { location: 'venues:berlin_club.name', day: 200 }
    )
  )
  const history = updates.updatedSocial.regionalGigHistory

  assert.equal(
    Object.keys(history).length,
    100,
    'Must not exceed the 100-region bound the save validator enforces'
  )
  assert.deepEqual(
    history.berlin,
    [200],
    'The region just played must be recorded, not dropped'
  )
  assert.equal(history.region0, undefined, 'Stalest region is evicted')

  const state = createInitialState()
  if (!state.gameMap) state.gameMap = { nodes: [] }
  state.social.regionalGigHistory = history
  assert.doesNotThrow(() => validateSaveData(JSON.parse(JSON.stringify(state))))
})

import fs from 'fs'
import path from 'path'

test('DEFAULT_BALANCE_TUNING match', async () => {
  const reportPath = path.resolve(
    process.cwd(),
    'reports/game-balance-experiments-results.json'
  )
  // The report is committed, so a missing file means the artifact was dropped or
  // the generator failed — skipping silently would hide exactly the drift this
  // test exists to catch.
  assert.ok(
    fs.existsSync(reportPath),
    `Missing committed experiment report at ${reportPath}; regenerate with pnpm run simulate:balance:experiments`
  )

  // The artifact is untrusted JSON: reading straight through to
  // `recommendation.tuning` turns a truncated or half-written report into a
  // TypeError about undefined instead of naming the malformed layer.
  /** @type {unknown} */
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const regenerate = 'regenerate with pnpm run simulate:balance:experiments'
  assert.ok(
    typeof report === 'object' &&
      report !== null &&
      Object.hasOwn(report, 'recommendation'),
    `Experiment report has no \`recommendation\`; ${regenerate}`
  )
  const recommendation = /** @type {Record<string, unknown>} */ (report)
    .recommendation
  assert.ok(
    typeof recommendation === 'object' &&
      recommendation !== null &&
      Object.hasOwn(recommendation, 'tuning'),
    `Experiment report has no \`recommendation.tuning\`; ${regenerate}`
  )
  const tuning = /** @type {Record<string, unknown>} */ (recommendation).tuning
  assert.ok(
    typeof tuning === 'object' && tuning !== null,
    `Experiment report \`recommendation.tuning\` is not an object; ${regenerate}`
  )

  assert.deepEqual(
    DEFAULT_BALANCE_TUNING,
    tuning,
    'Default tuning should exactly match recommended tuning from report'
  )
})
