import { describe, it, expect } from 'vitest'
import {
  calculateAccuracy,
  updateGigPerformanceStats,
  buildGigStatsSnapshot
} from '../../src/utils/gigStats'

describe('gigStats', () => {
  describe('calculateAccuracy', () => {
    it('returns 100 when no notes were attempted', () => {
      expect(calculateAccuracy(0, 0)).toBe(100)
    })

    it('returns 100 for all perfect hits', () => {
      expect(calculateAccuracy(10, 0)).toBe(100)
    })

    it('returns 0 for all misses', () => {
      expect(calculateAccuracy(0, 10)).toBe(0)
    })

    it('calculates 50% for equal hits and misses', () => {
      expect(calculateAccuracy(5, 5)).toBe(50)
    })

    it('rounds properly to nearest integer', () => {
      // 1 / 3 = 33.33% -> 33
      expect(calculateAccuracy(1, 2)).toBe(33)
      // 2 / 3 = 66.66% -> 67
      expect(calculateAccuracy(2, 1)).toBe(67)
    })
  })

  describe('updateGigPerformanceStats', () => {
    it('updates maxCombo if new combo is higher', () => {
      const stats = {
        perfectHits: 10,
        misses: 2,
        maxCombo: 5,
        peakHype: 20
      }
      const updated = updateGigPerformanceStats(stats, { combo: 8, overload: 15 })
      expect(updated.maxCombo).toBe(8)
      expect(updated.peakHype).toBe(20)
    })

    it('updates peakHype if new overload is higher', () => {
      const stats = {
        perfectHits: 10,
        misses: 2,
        maxCombo: 10,
        peakHype: 20
      }
      const updated = updateGigPerformanceStats(stats, { combo: 5, overload: 25 })
      expect(updated.maxCombo).toBe(10)
      expect(updated.peakHype).toBe(25)
    })

    it('keeps existing values if new values are lower', () => {
      const stats = {
        perfectHits: 10,
        misses: 2,
        maxCombo: 10,
        peakHype: 20
      }
      const updated = updateGigPerformanceStats(stats, { combo: 5, overload: 15 })
      expect(updated.maxCombo).toBe(10)
      expect(updated.peakHype).toBe(20)
    })

    it('does not mutate the original stats object', () => {
      const stats = {
        perfectHits: 10,
        misses: 2,
        maxCombo: 5,
        peakHype: 5
      }
      const updated = updateGigPerformanceStats(stats, { combo: 10, overload: 10 })
      expect(stats.maxCombo).toBe(5)
      expect(stats.peakHype).toBe(5)
      expect(updated).not.toBe(stats)
    })
  })

  describe('buildGigStatsSnapshot', () => {
    it('builds a snapshot with provided values and calculates accuracy', () => {
      const stats = {
        perfectHits: 8,
        hits: 2,
        misses: 5,
        maxCombo: 10,
        peakHype: 50,
        corruptionLevel: 10
      }

      const snapshot = buildGigStatsSnapshot(1000, stats, 15, [
        { songId: 'song1', score: 500, accuracy: 90, index: 0 },
        { songId: 'song2', score: 500, accuracy: 85, index: 1 }
      ])

      expect(snapshot).toEqual({
        score: 1000,
        misses: 5,
        perfectHits: 8,
        maxCombo: 10,
        peakHype: 50,
        corruptionLevel: 10,
        toxicTimeTotal: 15,
        accuracy: 67, // (8 + 2) / (8 + 2 + 5) = 10 / 15 = 66.6% -> 67
        songStats: [
          { songId: 'song1', score: 500, accuracy: 90, index: 0 },
          { songId: 'song2', score: 500, accuracy: 85, index: 1 }
        ]
      })
    })

    it('defaults songStats to empty array and handles missing optional stats fields', () => {
      const stats = {
        perfectHits: 10,
        misses: 0,
        maxCombo: 10,
        peakHype: 50
      }

      const snapshot = buildGigStatsSnapshot(1000, stats, 5)

      expect(snapshot).toEqual({
        score: 1000,
        misses: 0,
        perfectHits: 10,
        maxCombo: 10,
        peakHype: 50,
        corruptionLevel: 0, // Should default to 0
        toxicTimeTotal: 5,
        accuracy: 100, // 10 / 10 = 100%
        songStats: []
      })
    })
  })
})
