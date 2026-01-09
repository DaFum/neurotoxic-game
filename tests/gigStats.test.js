import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGigStatsSnapshot,
  updateGigPerformanceStats
} from '../src/utils/gigStats.js'

test('updateGigPerformanceStats tracks peak combo and hype', () => {
  const baseStats = {
    perfectHits: 10,
    misses: 2,
    maxCombo: 5,
    peakHype: 20
  }

  const updated = updateGigPerformanceStats(baseStats, {
    combo: 12,
    overload: 55
  })

  assert.equal(updated.maxCombo, 12)
  assert.equal(updated.peakHype, 55)
  assert.equal(updated.misses, 2)
  assert.equal(updated.perfectHits, 10)
})

test('buildGigStatsSnapshot includes required economy fields', () => {
  const stats = { perfectHits: 3, misses: 1, maxCombo: 7, peakHype: 90 }

  const snapshot = buildGigStatsSnapshot(4200, stats, 1500)

  assert.deepEqual(snapshot, {
    score: 4200,
    misses: 1,
    perfectHits: 3,
    maxCombo: 7,
    peakHype: 90,
    toxicTimeTotal: 1500
  })
})
