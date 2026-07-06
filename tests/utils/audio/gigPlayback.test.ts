import { describe, it, expect } from 'vitest'
import { calculateGigTimeMs } from '../../../src/utils/audio/gigPlayback'

describe('calculateGigTimeMs', () => {
  it('calculates time correctly with valid inputs', () => {
    const result = calculateGigTimeMs({
      contextTimeSec: 5.5,
      startCtxTimeSec: 2.0,
      offsetMs: 500
    })
    // (5.5 - 2.0) * 1000 + 500 = 3500 * 1000 + 500 = 3500 + 500 = 4000
    expect(result).toBe(4000)
  })

  it('handles negative offsets', () => {
    const result = calculateGigTimeMs({
      contextTimeSec: 5.5,
      startCtxTimeSec: 2.0,
      offsetMs: -500
    })
    // (5.5 - 2.0) * 1000 - 500 = 3500 - 500 = 3000
    expect(result).toBe(3000)
  })

  it('defaults offsetMs to 0 if not provided', () => {
    const result = calculateGigTimeMs({
      contextTimeSec: 5.5,
      startCtxTimeSec: 2.0
    })
    // (5.5 - 2.0) * 1000 + 0 = 3500
    expect(result).toBe(3500)
  })

  it('defaults offsetMs to 0 if provided as non-finite', () => {
    const result = calculateGigTimeMs({
      contextTimeSec: 5.5,
      startCtxTimeSec: 2.0,
      offsetMs: Infinity
    })
    expect(result).toBe(3500)

    const resultNaN = calculateGigTimeMs({
      contextTimeSec: 5.5,
      startCtxTimeSec: 2.0,
      offsetMs: NaN
    })
    expect(resultNaN).toBe(3500)
  })

  describe('fallback cases returning safeOffset', () => {
    it('returns safeOffset when contextTimeSec is non-finite', () => {
      expect(
        calculateGigTimeMs({
          contextTimeSec: Infinity,
          startCtxTimeSec: 2.0,
          offsetMs: 100
        })
      ).toBe(100)

      expect(
        calculateGigTimeMs({
          contextTimeSec: NaN,
          startCtxTimeSec: 2.0,
          offsetMs: 100
        })
      ).toBe(100)
    })

    it('returns 0 when contextTimeSec is non-finite and offsetMs is missing', () => {
      expect(
        calculateGigTimeMs({
          contextTimeSec: NaN,
          startCtxTimeSec: 2.0
        })
      ).toBe(0)
    })

    it('returns safeOffset when startCtxTimeSec is null', () => {
      expect(
        calculateGigTimeMs({
          contextTimeSec: 5.5,
          startCtxTimeSec: null,
          offsetMs: 250
        })
      ).toBe(250)
    })

    it('returns safeOffset when startCtxTimeSec is non-finite', () => {
      expect(
        calculateGigTimeMs({
          contextTimeSec: 5.5,
          startCtxTimeSec: Infinity,
          offsetMs: 250
        })
      ).toBe(250)

      expect(
        calculateGigTimeMs({
          contextTimeSec: 5.5,
          startCtxTimeSec: NaN,
          offsetMs: 250
        })
      ).toBe(250)
    })
  })
})
