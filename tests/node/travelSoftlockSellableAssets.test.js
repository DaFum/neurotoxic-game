import test from 'node:test'
import assert from 'node:assert'
import { getSellableAssets } from '../../src/utils/travelSoftlockUtils.ts'
import { getAssetSaleQuote } from '../../src/utils/assetSelectors/assetSaleQuote.ts'

const makeAsset = id => ({
  id,
  kind: 'bandhaus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 3,
  condition: 100,
  baseDailyRevenue: 0,
  baseUpkeep: 0,
  baseRiskEventChance: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  slots: []
})

const expectedFromQuote = (assets, liabilities, day) =>
  assets
    .map(asset => ({
      id: asset.id,
      quote: getAssetSaleQuote(asset, liabilities, day)
    }))
    .filter(({ quote }) => !quote.blocked && quote.net > 0)
    .map(({ id, quote }) => ({ id, net: quote.net }))

test('getSellableAssets agrees with the canonical sale quote', () => {
  const assets = [makeAsset('a_free'), makeAsset('a_debt'), makeAsset('a_huge')]
  const liabilities = {
    l1: { id: 'l1', assetId: 'a_debt', principalRemaining: 1000 },
    // Two finite principals whose sum overflows to Infinity.
    l2: { id: 'l2', assetId: 'a_huge', principalRemaining: Number.MAX_VALUE },
    l3: { id: 'l3', assetId: 'a_huge', principalRemaining: Number.MAX_VALUE }
  }

  const expected = expectedFromQuote(assets, liabilities, 30)
  assert.ok(expected.length > 0, 'fixture must produce sellable assets')
  assert.deepStrictEqual(getSellableAssets(assets, liabilities, 30), expected)
  assert.ok(!expected.some(({ id }) => id === 'a_huge'))
})

test('getAssetSaleQuote blocks a sale whose debt total overflows', () => {
  const liabilities = {
    l1: { id: 'l1', assetId: 'a_huge', principalRemaining: Number.MAX_VALUE },
    l2: { id: 'l2', assetId: 'a_huge', principalRemaining: Number.MAX_VALUE }
  }
  const quote = getAssetSaleQuote(makeAsset('a_huge'), liabilities, 30)
  assert.equal(quote.blocked, true)
  assert.ok(Number.isFinite(quote.debt))
  assert.ok(Number.isFinite(quote.net) && quote.net < 0)
})

test('getSellableAssets skips assets the quote blocks or values at zero', () => {
  const assets = [
    makeAsset('a_blocked'),
    { ...makeAsset('a_bad'), kind: 'nope' }
  ]
  const liabilities = {
    l1: { id: 'l1', assetId: 'a_blocked', principalRemaining: 1e12 }
  }
  assert.deepStrictEqual(getSellableAssets(assets, liabilities, 30), [])
})
