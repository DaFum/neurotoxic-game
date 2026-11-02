import test from 'node:test'
import assert from 'node:assert'
import {
  getSellableAssets,
  getPostSaleScenarios
} from '../../src/utils/travelSoftlockUtils.ts'
import { getAssetSaleQuote } from '../../src/utils/assets/assetSelectors/assetSaleQuote.ts'
import { getTotalDailyObligations } from '../../src/utils/assets/assetSelectors.ts'
import { calculateTravelExpenses } from '../../src/utils/economy/index.ts'
import { checkSoftlock } from '../../src/utils/mapUtils.ts'

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

test('getSellableAssets skips underwater and uncomputable (null-gross) quotes', () => {
  const assets = [
    makeAsset('a_blocked'),
    { ...makeAsset('a_bad'), kind: 'nope' }
  ]
  const liabilities = {
    l1: { id: 'l1', assetId: 'a_blocked', principalRemaining: 1e12 }
  }
  assert.deepStrictEqual(getSellableAssets(assets, liabilities, 30), [])
})

test('a zero-net sale that sheds a loan and upkeep makes a route affordable', () => {
  const day = 30
  const asset = { ...makeAsset('a_zero'), baseUpkeep: 40 }
  const { gross } = getAssetSaleQuote(asset, {}, day)
  assert.ok(gross > 0, 'fixture needs a computable gross value')
  // The loan principal equals the sale value, so the real quote nets to 0.
  const liabilities = {
    l1: {
      id: 'l1',
      assetId: 'a_zero',
      principalRemaining: gross,
      dailyPayment: 50
    }
  }
  const quote = getAssetSaleQuote(asset, liabilities, day)
  assert.equal(quote.blocked, false)
  assert.equal(quote.net, 0)

  const sellable = getSellableAssets([asset], liabilities, day)
  assert.deepStrictEqual(sellable, [{ id: 'a_zero', net: 0 }])

  const band = { harmony: 50, members: [] }
  const social = {}
  const gameMap = {
    nodes: { A: { id: 'A', x: 10, y: 10 }, B: { id: 'B', x: 20, y: 10 } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const van = { fuel: 100, condition: 100, upgrades: [], breakdownChance: 0 }
  const { totalCost } = calculateTravelExpenses(
    gameMap.nodes.B,
    gameMap.nodes.A,
    { money: 0, fameLevel: 0, van },
    band
  )
  const basePlayer = { day, fameLevel: 0 }
  const obligationsBefore = getTotalDailyObligations({
    player: basePlayer,
    band,
    social,
    assets: [asset],
    liabilities
  })
  const obligationsAfter = getTotalDailyObligations({
    player: basePlayer,
    band,
    social,
    assets: [],
    liabilities: {}
  })
  assert.ok(obligationsAfter < obligationsBefore, 'the sale must shed costs')

  // Exactly enough for the trip once the loan and upkeep are gone.
  const money = totalCost + obligationsAfter
  assert.ok(money < 1000, 'stay below the cash-reserve logistics fee')
  const player = { ...basePlayer, currentNodeId: 'A', money, van }
  const scenarios = getPostSaleScenarios(
    sellable,
    [asset],
    liabilities,
    player,
    band,
    social
  )
  const context = { dailyObligations: obligationsBefore }

  assert.equal(checkSoftlock(gameMap, player, band, context), true)
  assert.equal(
    checkSoftlock(gameMap, player, band, {
      ...context,
      postSaleScenarios: scenarios
    }),
    false
  )
})

// Issue #3503: the sale sheds the upkeep and loan that made each day cost
// money; the band then earns the trip by resting on its YouTube revenue.
test('selling an asset that turns the daily net positive, then resting, makes a route affordable', () => {
  const day = 30
  const asset = { ...makeAsset('a_upkeep'), baseUpkeep: 150 }
  const { gross } = getAssetSaleQuote(asset, {}, day)
  // The loan equals the sale value, so the sale itself raises nothing.
  const liabilities = {
    l1: {
      id: 'l1',
      assetId: 'a_upkeep',
      principalRemaining: gross,
      dailyPayment: 50
    }
  }
  const sellable = getSellableAssets([asset], liabilities, day)
  assert.deepStrictEqual(sellable, [{ id: 'a_upkeep', net: 0 }])

  // Drained band: harmony 10 and empty stamina rule out every donation.
  const band = {
    harmony: 10,
    members: [
      { stamina: 0, staminaMax: 100 },
      { stamina: 0, staminaMax: 100 },
      { stamina: 0, staminaMax: 100 }
    ]
  }
  // YouTube ad revenue outweighs the living costs once the upkeep is gone.
  const social = { youtube: 200_000 }
  const gameMap = {
    nodes: { A: { id: 'A', x: 10, y: 10 }, B: { id: 'B', x: 20, y: 10 } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const van = { fuel: 100, condition: 100, upgrades: [], breakdownChance: 0 }
  const { totalCost } = calculateTravelExpenses(
    gameMap.nodes.B,
    gameMap.nodes.A,
    { money: 0, fameLevel: 0, van },
    band
  )
  const basePlayer = { day, fameLevel: 0 }
  const obligationsBefore = getTotalDailyObligations({
    player: basePlayer,
    band,
    social,
    assets: [asset],
    liabilities
  })
  const obligationsAfter = getTotalDailyObligations({
    player: basePlayer,
    band,
    social,
    assets: [],
    liabilities: {}
  })
  assert.ok(obligationsBefore > 0, 'resting before the sale costs money')
  assert.ok(obligationsAfter < 0, 'resting after the sale earns money')

  // One euro short of the trip: neither the sale nor a rest covers it alone.
  const player = {
    ...basePlayer,
    currentNodeId: 'A',
    money: totalCost - 1,
    van
  }
  const scenarios = getPostSaleScenarios(
    sellable,
    [asset],
    liabilities,
    player,
    band,
    social
  )
  const context = { dailyObligations: obligationsBefore }
  const restRecovery = { social }

  assert.equal(
    checkSoftlock(gameMap, player, band, { ...context, restRecovery }),
    true
  )
  assert.equal(
    checkSoftlock(gameMap, player, band, {
      ...context,
      postSaleScenarios: scenarios
    }),
    true
  )
  assert.equal(
    checkSoftlock(gameMap, player, band, {
      ...context,
      postSaleScenarios: scenarios,
      restRecovery
    }),
    false
  )
})

test('getPostSaleScenarios evaluates combinations correctly and accurately calculates retained assets and proceeds', () => {
  const sellableAssets = [
    { id: 'a1', net: 100 },
    { id: 'a2', net: 200 }
  ]
  const assets = [makeAsset('a1'), makeAsset('a2'), makeAsset('a3')]
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
