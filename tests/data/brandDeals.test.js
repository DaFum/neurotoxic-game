import { describe, it, expect } from 'vitest'
import { BRAND_DEALS } from '../../src/data/brandDeals.js'

describe('Brand Deals Data', () => {
  it('should be an array of deal objects', () => {
    expect(Array.isArray(BRAND_DEALS)).toBe(true)
    expect(BRAND_DEALS.length).toBeGreaterThan(0)
  })

  it('each deal should have required properties', () => {
    BRAND_DEALS.forEach(deal => {
      expect(typeof deal.id).toBe('string')
      expect(deal.id.length).toBeGreaterThan(0)
      expect(typeof deal.name).toBe('string')
      expect(deal.name.length).toBeGreaterThan(0)
      expect(typeof deal.type).toBe('string')
      expect(deal.type.length).toBeGreaterThan(0)

      const hasDuration =
        typeof deal.duration === 'number' || deal.offer.duration > 0
      expect(hasDuration).toBe(true)

      expect(typeof deal.requirements).toBe('object')
      expect(deal.requirements).not.toBeNull()

      expect(typeof deal.offer).toBe('object')
      expect(deal.offer).not.toBeNull()
    })
  })
})
