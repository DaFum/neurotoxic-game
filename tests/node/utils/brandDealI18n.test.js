import { describe, it, mock, before, after } from 'node:test'
import assert from 'node:assert/strict'

import { BRAND_DEALS_BY_ID } from '../../../src/data/brandDeals'
import { getTranslatedBrandDealDisplay } from '../../../src/utils/brandDealI18n'

describe('getTranslatedBrandDealDisplay', () => {
  before(() => {
    // Add fake items to the real Map for testing
    BRAND_DEALS_BY_ID.set('test-deal-1', {
      id: 'test-deal-1',
      name: 'Catalog Name',
      description: 'Catalog Desc'
    })
    BRAND_DEALS_BY_ID.set('test-deal-no-desc', {
      id: 'test-deal-no-desc',
      name: 'Catalog Name No Desc'
    })
  })

  after(() => {
    // Clean up
    BRAND_DEALS_BY_ID.delete('test-deal-1')
    BRAND_DEALS_BY_ID.delete('test-deal-no-desc')
  })

  it('returns null for non-object or null inputs', () => {
    const t = mock.fn(() => '')
    assert.equal(getTranslatedBrandDealDisplay(null, t), null)
    assert.equal(getTranslatedBrandDealDisplay(undefined, t), null)
    assert.equal(getTranslatedBrandDealDisplay(123, t), null)
    assert.equal(getTranslatedBrandDealDisplay('deal', t), null)
  })

  it('returns null if no fallback name can be derived', () => {
    const t = mock.fn(() => '')
    // No id, no name
    assert.equal(getTranslatedBrandDealDisplay({}, t), null)
    assert.equal(
      getTranslatedBrandDealDisplay({ description: 'only desc' }, t),
      null
    )
  })

  it('handles an inline deal (no id or id not in catalog)', () => {
    const t = mock.fn()
    const deal = { name: 'Inline Name', description: 'Inline Desc' }

    const result = getTranslatedBrandDealDisplay(deal, t, 5)

    assert.deepEqual(result, {
      key: 'active-deal-5',
      name: 'Inline Name',
      description: 'Inline Desc'
    })

    assert.equal(t.mock.callCount(), 0, 'Should not translate inline deals')
  })

  it('handles an inline deal with id but not in catalog', () => {
    const t = mock.fn()
    const deal = {
      id: 'unknown-id',
      name: 'Inline Name',
      description: 'Inline Desc'
    }

    const result = getTranslatedBrandDealDisplay(deal, t, 2)

    assert.deepEqual(result, {
      key: 'unknown-id-2',
      name: 'Inline Name',
      description: 'Inline Desc'
    })

    assert.equal(
      t.mock.callCount(),
      0,
      'Should not translate if not in catalog'
    )
  })

  it('uses deal id as fallback name if name is missing but not in catalog', () => {
    const t = mock.fn()
    const deal = { id: 'unknown-id' } // No name, no description

    const result = getTranslatedBrandDealDisplay(deal, t, 1)

    assert.deepEqual(result, {
      key: 'unknown-id-1',
      name: 'unknown-id',
      description: undefined
    })
  })

  it('handles a catalog deal with translation', () => {
    const t = mock.fn((key, options) => {
      if (key === 'economy:brandDeals.test-deal-1.name')
        return 'Translated Name'
      if (key === 'economy:brandDeals.test-deal-1.description')
        return 'Translated Desc'
      return options?.defaultValue ?? ''
    })

    const deal = { id: 'test-deal-1' }

    const result = getTranslatedBrandDealDisplay(deal, t, 0)

    assert.deepEqual(result, {
      key: 'test-deal-1-0',
      name: 'Translated Name',
      description: 'Translated Desc'
    })

    assert.equal(t.mock.callCount(), 2)
  })

  it('handles a catalog deal with missing translations falling back to default values', () => {
    const t = mock.fn((key, options) => {
      return options?.defaultValue
    })

    const deal = { id: 'test-deal-1' }

    const result = getTranslatedBrandDealDisplay(deal, t, 1)

    assert.deepEqual(result, {
      key: 'test-deal-1-1',
      name: 'Catalog Name',
      description: 'Catalog Desc'
    })
  })

  it('translates catalog deal but uses inline overrides as default values if provided', () => {
    const t = mock.fn((key, options) => options?.defaultValue)

    const deal = {
      id: 'test-deal-1',
      name: 'Override Name',
      description: 'Override Desc'
    }

    const result = getTranslatedBrandDealDisplay(deal, t, 1)

    assert.deepEqual(result, {
      key: 'test-deal-1-1',
      name: 'Catalog Name',
      description: 'Catalog Desc'
    })
  })

  it('handles a catalog deal without a description', () => {
    const t = mock.fn((key, options) => options?.defaultValue)

    const deal = { id: 'test-deal-no-desc' }

    const result = getTranslatedBrandDealDisplay(deal, t, 2)

    assert.deepEqual(result, {
      key: 'test-deal-no-desc-2',
      name: 'Catalog Name No Desc',
      description: undefined
    })

    // Should only attempt to translate the name since there is no description fallback
    assert.equal(t.mock.callCount(), 1)
  })
})
