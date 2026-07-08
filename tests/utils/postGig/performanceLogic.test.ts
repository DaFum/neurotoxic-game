import { describe, it, expect } from 'vitest'
import { calculateExcessMissMoneyPenalty } from '../../../src/utils/postGig/performanceLogic'

describe('calculateExcessMissMoneyPenalty', () => {
  it('returns zero penalty when misses default to 0', () => {
    const result = calculateExcessMissMoneyPenalty({
      missTolerance: 5,
      missMoneyPenalty: 10
    })
    expect(result).toEqual({ excessMisses: 0, penalty: 0 })
  })

  it('returns zero penalty when misses are below tolerance', () => {
    const result = calculateExcessMissMoneyPenalty({
      misses: 2,
      missTolerance: 5,
      missMoneyPenalty: 10
    })
    expect(result).toEqual({ excessMisses: 0, penalty: 0 })
  })

  it('returns zero penalty when misses exactly equal tolerance', () => {
    const result = calculateExcessMissMoneyPenalty({
      misses: 5,
      missTolerance: 5,
      missMoneyPenalty: 10
    })
    expect(result).toEqual({ excessMisses: 0, penalty: 0 })
  })

  it('calculates correct penalty when misses exceed tolerance', () => {
    const result = calculateExcessMissMoneyPenalty({
      misses: 8,
      missTolerance: 5,
      missMoneyPenalty: 10
    })
    expect(result).toEqual({ excessMisses: 3, penalty: 30 })
  })

  it('handles zero missMoneyPenalty correctly', () => {
    const result = calculateExcessMissMoneyPenalty({
      misses: 10,
      missTolerance: 5,
      missMoneyPenalty: 0
    })
    expect(result).toEqual({ excessMisses: 5, penalty: 0 })
  })

  it('handles undefined missMoneyPenalty by applying 0 penalty', () => {
    const result = calculateExcessMissMoneyPenalty({
      misses: 10,
      missTolerance: 5
    })
    expect(result).toEqual({ excessMisses: 5, penalty: 0 })
  })

  it('throws an error if misses is negative', () => {
    expect(() =>
      calculateExcessMissMoneyPenalty({ misses: -1, missTolerance: 5 })
    ).toThrow('misses must be a finite integer >= 0')
  })

  it('throws an error if misses is not an integer', () => {
    expect(() =>
      calculateExcessMissMoneyPenalty({ misses: 2.5, missTolerance: 5 })
    ).toThrow('misses must be a finite integer >= 0')
  })

  it('throws an error if missTolerance is negative', () => {
    expect(() =>
      calculateExcessMissMoneyPenalty({ misses: 5, missTolerance: -1 })
    ).toThrow('missTolerance must be a finite integer >= 0')
  })

  it('throws an error if missTolerance is not an integer', () => {
    expect(() =>
      calculateExcessMissMoneyPenalty({ misses: 5, missTolerance: 2.5 })
    ).toThrow('missTolerance must be a finite integer >= 0')
  })

  it('throws an error if missMoneyPenalty is negative', () => {
    expect(() =>
      calculateExcessMissMoneyPenalty({
        misses: 5,
        missTolerance: 2,
        missMoneyPenalty: -10
      })
    ).toThrow('missMoneyPenalty must be a finite number >= 0')
  })

  it('throws an error if missMoneyPenalty is not finite', () => {
    expect(() =>
      calculateExcessMissMoneyPenalty({
        misses: 5,
        missTolerance: 2,
        missMoneyPenalty: Infinity
      })
    ).toThrow('missMoneyPenalty must be a finite number >= 0')
  })
})
