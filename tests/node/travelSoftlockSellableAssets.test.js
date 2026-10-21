import test from 'node:test'
import assert from 'node:assert'
import { getSellableAssets, getPostSaleScenarios } from '../../src/utils/travelSoftlockUtils.ts'
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

test('getPostSaleScenarios evaluates combinations correctly and accurately calculates retained assets and proceeds', () => {
  const sellableAssets = [
    { id: 'a1', net: 100 },
    { id: 'a2', net: 200 }
  ]
  const assets = [
    makeAsset('a1'),
    makeAsset('a2'),
    makeAsset('a3')
  ]
  const liabilities = {
    l1: { id: 'l1', assetId: 'a1', dailyPayment: 10 },
    l2: { id: 'l2', assetId: 'a3', dailyPayment: 15 }
  }
  const player = { money: 500 }
  const band = { reputation: 10 }
  const social = {}

  const scenarios = getPostSaleScenarios(
    sellableAssets,
    assets,
    liabilities,
    player,
    band,
    social
  )

  // 2 sellable assets -> 2^2 - 1 = 3 combinations: [a1], [a2], [a1, a2]
  assert.strictEqual(scenarios.length, 3)

  // Note: sellableAssets is sorted descending by net yield, so index 0 is a2 (net 200) and index 1 is a1 (net 100)
  // Combination 1 (binary 01: selling a2)
  assert.strictEqual(scenarios[0].assetProceeds, 200)

  // Combination 2 (binary 10: selling a1)
  assert.strictEqual(scenarios[1].assetProceeds, 100)

  // Combination 3 (binary 11: selling a1 and a2)
  assert.strictEqual(scenarios[2].assetProceeds, 300)
})
