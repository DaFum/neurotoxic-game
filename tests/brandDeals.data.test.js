import { describe, it } from 'node:test'
import assert from 'node:assert'
import { BRAND_DEALS } from '../src/data/brandDeals.js'

describe('Brand Deals Data', () => {
  it('should be an array of deal objects', () => {
    assert.ok(Array.isArray(BRAND_DEALS))
    assert.ok(BRAND_DEALS.length > 0)
  })

  it('each deal should have required properties', () => {
    BRAND_DEALS.forEach(deal => {
      assert.ok(
        typeof deal.id === 'string' && deal.id.length > 0,
        `Deal missing id`
      )
      assert.ok(
        typeof deal.name === 'string' && deal.name.length > 0,
        `Deal ${deal.id} missing name`
      )
      assert.ok(
        typeof deal.type === 'string' && deal.type.length > 0,
        `Deal ${deal.id} missing type`
      )

      const hasDuration =
        typeof deal.offer?.duration === 'number' && deal.offer.duration > 0
      assert.ok(hasDuration, `Deal ${deal.id} missing duration in offer`)

      assert.ok(
        typeof deal.requirements === 'object' && deal.requirements !== null,
        `Deal ${deal.id} missing requirements`
      )
      assert.ok(
        typeof deal.offer === 'object' && deal.offer !== null,
        `Deal ${deal.id} missing offer`
      )
    })
  })
})
