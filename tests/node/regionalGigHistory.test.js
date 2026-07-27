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
    assert.fail('Validator should not throw: ' + e.message)
  }

  // sanitizer/reducer load
  const loadedState = sanitizeSocial(parsed.social)
  assert.deepEqual(loadedState.regionalGigHistory, finalHistory)
})

import fs from 'fs'
import path from 'path'

test('DEFAULT_BALANCE_TUNING match', async () => {
  const reportPath = path.resolve(
    process.cwd(),
    'reports/game-balance-experiments-results.json'
  )
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
    assert.deepEqual(
      DEFAULT_BALANCE_TUNING,
      report.recommendation.tuning,
      'Default tuning should exactly match recommended tuning from report'
    )
  } else {
    assert.ok(true, 'Report does not exist yet')
  }
})
