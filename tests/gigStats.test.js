import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGigStatsSnapshot,
  updateGigPerformanceStats,
  calculateAccuracy
} from '../src/utils/gigStats.js'

test('calculateAccuracy computes correct percentages', () => {
  assert.equal(calculateAccuracy(0, 0), 100)
  assert.equal(calculateAccuracy(10, 0), 100)
  assert.equal(calculateAccuracy(0, 10), 0)
  assert.equal(calculateAccuracy(5, 5), 50)
  assert.equal(calculateAccuracy(1, 2), 33)
  assert.equal(calculateAccuracy(2, 1), 67)
})

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
  const songStats = [{ songId: 'neurotoxic_1_raw', score: 4200, accuracy: 75 }]

  const snapshot = buildGigStatsSnapshot(4200, stats, 1500, songStats)

  assert.deepEqual(snapshot, {
    score: 4200,
    misses: 1,
    perfectHits: 3,
    maxCombo: 7,
    peakHype: 90,
    toxicTimeTotal: 1500,
    accuracy: 75, // 3 perfect / (3 + 1) * 100
    songStats
  })
})
