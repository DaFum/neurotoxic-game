import { describe, it, expect } from 'vitest'
import { BRAND_DEALS } from '../src/data/brandDeals'

describe('BRAND_DEALS data integrity', () => {
  const deals = Array.isArray(BRAND_DEALS) ? BRAND_DEALS : Object.values(BRAND_DEALS)

  it('contains non-empty set', () => {
    expect(deals.length).toBeGreaterThan(0)
  })

  it('ensures each deal has required schema fields', () => {
    for (const deal of deals) {
      expect(typeof deal.id).toBe('string')
      expect(typeof deal.name).toBe('string')

      // These are required based on the issue description
      expect(typeof deal.offer.upfront).toBe('number')
      expect(typeof deal.offer.duration).toBe('number')

      expect(deal.requirements).toBeDefined()
      expect(typeof deal.requirements).toBe('object')
    }
  })

  it('has unique IDs', () => {
    const ids = deals.map(d => d.id)
    expect(new Set(ids).size).toBe(deals.length)
  })
})
