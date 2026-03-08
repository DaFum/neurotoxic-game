import { describe, it, expect } from 'vitest'
import { BRAND_DEALS } from '../src/data/brandDeals'

describe('BRAND_DEALS data integrity', () => {
  it('contains non-empty set and non-empty alignment buckets', () => {
    expect(BRAND_DEALS.length).toBeGreaterThan(0)
    const byAlignment = BRAND_DEALS.reduce((acc, deal) => {
      acc[deal.alignment] = (acc[deal.alignment] || 0) + 1
      return acc
    }, {})

    Object.values(byAlignment).forEach(count =>
      expect(count).toBeGreaterThan(0)
    )
  })

  it('ensures each deal has required schema fields', () => {
    for (const deal of BRAND_DEALS) {
      expect(deal.id).toEqual(expect.any(String))
      expect(deal.name).toEqual(expect.any(String))
      expect(deal.alignment).toEqual(expect.any(String))
      expect(deal.offer).toEqual(expect.any(Object))
      expect(deal.requirements).toEqual(expect.any(Object))
    }
  })

  it('covers optional branch fields (item/perGig/penalty/benefit)', () => {
    expect(BRAND_DEALS.some(d => d.offer?.item)).toBe(true)
    expect(BRAND_DEALS.some(d => d.offer?.perGig)).toBe(true)
    expect(BRAND_DEALS.some(d => d.penalty)).toBe(true)
    expect(BRAND_DEALS.some(d => d.benefit)).toBe(true)
  })

  it('has unique IDs and reachable entries', () => {
    const ids = BRAND_DEALS.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
