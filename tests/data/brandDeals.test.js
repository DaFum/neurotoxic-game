import { describe, it } from 'vitest'
import assert from 'node:assert'
import { BRAND_DEALS } from '../../src/data/brandDeals.js'

describe('BRAND_DEALS data module', () => {
  it('should be an array of brand deals', () => {
    assert(Array.isArray(BRAND_DEALS), 'BRAND_DEALS should be an array')
    assert(BRAND_DEALS.length > 0, 'BRAND_DEALS should not be empty')
  })

  it('each brand deal should have a unique id', () => {
    const ids = new Set()
    for (const deal of BRAND_DEALS) {
      assert(deal.id, `Deal missing id: ${JSON.stringify(deal)}`)
      assert(!ids.has(deal.id), `Duplicate deal id found: ${deal.id}`)
      ids.add(deal.id)
    }
  })

  it('each brand deal should have required properties', () => {
    for (const deal of BRAND_DEALS) {
      assert(deal.name, `Deal ${deal.id} is missing a name`)
      assert(deal.description, `Deal ${deal.id} is missing a description`)
      assert(deal.type, `Deal ${deal.id} is missing a type`)
      assert(deal.alignment, `Deal ${deal.id} is missing an alignment`)

      assert(deal.requirements, `Deal ${deal.id} is missing requirements`)
      assert(
        typeof deal.requirements.followers === 'number',
        `Deal ${deal.id} followers requirement should be a number`
      )
      if (deal.requirements.trend !== undefined) {
        assert(
          Array.isArray(deal.requirements.trend),
          `Deal ${deal.id} trend requirement should be an array`
        )
      }

      if (deal.requirements.trait !== undefined) {
        assert(
          typeof deal.requirements.trait === 'string',
          `Deal ${deal.id} trait requirement should be a string when present`
        )
      }

      assert(deal.offer, `Deal ${deal.id} is missing an offer`)
      assert(
        typeof deal.offer.upfront === 'number',
        `Deal ${deal.id} upfront offer should be a number`
      )
      assert(
        typeof deal.offer.duration === 'number',
        `Deal ${deal.id} duration offer should be a number`
      )
    }
  })

  it('each brand deal should have at least one of penalty or benefit with well-defined stats', () => {
    for (const deal of BRAND_DEALS) {
      assert(
        deal.penalty || deal.benefit,
        `Deal ${deal.id} must have at least one of penalty or benefit`
      )

      if (deal.penalty) {
        assert(
          typeof deal.penalty === 'object',
          `Deal ${deal.id} penalty should be an object`
        )
        if (deal.penalty.loyalty !== undefined) {
          assert(
            typeof deal.penalty.loyalty === 'number',
            `Deal ${deal.id} penalty.loyalty should be a number`
          )
        }
        if (deal.penalty.controversy !== undefined) {
          assert(
            typeof deal.penalty.controversy === 'number',
            `Deal ${deal.id} penalty.controversy should be a number`
          )
        }
      }
      if (deal.benefit) {
        assert(
          typeof deal.benefit === 'object',
          `Deal ${deal.id} benefit should be an object`
        )
        if (deal.benefit.loyalty !== undefined) {
          assert(
            typeof deal.benefit.loyalty === 'number',
            `Deal ${deal.id} benefit.loyalty should be a number`
          )
        }
        if (deal.benefit.controversy !== undefined) {
          assert(
            typeof deal.benefit.controversy === 'number',
            `Deal ${deal.id} benefit.controversy should be a number`
          )
        }
      }
    }
  })
})
