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

test('sale proceeds below a protected cash shortfall cannot fund a trip', () => {
  const map = {
    nodes: { A: { id: 'A', x: 10, y: 10 }, B: { id: 'B', x: 20, y: 10 } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const player = {
    currentNodeId: 'A',
    money: 100,
    fameLevel: 0,
    van: { fuel: 100, condition: 100, upgrades: [], breakdownChance: 0 }
  }
  assert.equal(
    checkSoftlock(map, player, null, {
      protectedCash: 1000,
      postSaleScenarios: [
        { assetProceeds: 100, dailyObligations: 0, assetModifiers: {} }
      ]
    }),
    true
  )
})

test('sale recovery prices the reserve fee using actual post-sale cash', () => {
  const map = {
    nodes: { A: { id: 'A', x: 10, y: 10 }, B: { id: 'B', x: 20, y: 10 } },
    connections: [{ from: 'A', to: 'B' }]
  }
  const player = {
    currentNodeId: 'A',
    money: 100,
    fameLevel: 0,
    van: { fuel: 100, condition: 100, upgrades: [], breakdownChance: 0 }
  }
  const afterSale = { ...player, money: 2100 }
  const { totalCost } = calculateTravelExpenses(
    map.nodes.B,
    map.nodes.A,
    afterSale
  )
  assert.ok(totalCost < 100)
  assert.equal(
    checkSoftlock(map, player, null, {
      protectedCash: 2000,
      postSaleScenarios: [
        {
          assetProceeds: 2000,
          dailyObligations: 100 - totalCost,
          assetModifiers: {}
        }
      ]
    }),
    false
  )
})

test('a legal zero-proceeds sale remains a recovery candidate without upkeep', () => {
  // A fully depreciated chassis has no proceeds and no daily obligations.
  const zeroGross = { ...makeAsset('zero_no_upkeep'), condition: 0 }
  const quote = getAssetSaleQuote(zeroGross, {}, 100_000)
  assert.equal(quote.blocked, false)
  assert.equal(quote.net, 0)
  assert.deepEqual(getSellableAssets([zeroGross], {}, 100_000), [])
  assert.deepEqual(
    getSellableAssets([zeroGross], {}, 100_000, { includeAllZeroNet: true }),
    [{ id: zeroGross.id, net: 0 }]
  )
})

test('ordinary sale search remains capped while the expanded search includes every candidate', () => {
  const assets = Array.from({ length: 12 }, (_, i) =>
    makeAsset(`candidate_${i}`)
  )
  const candidates = assets.map((asset, i) => ({ id: asset.id, net: 12 - i }))
  const args = [
    candidates,
    assets,
    {},
    { money: 100, day: 1 },
    { members: [] },
    {}
  ]
  const standard = getPostSaleScenarios(...args)
  const expanded = getPostSaleScenarios(...args, {
    includeAdditionalCandidates: true
  })
  assert.equal(standard.length, 1023)
  assert.equal(expanded.length, 2 ** 12 - 1)
  for (const extra of assets.slice(10)) {
    assert.ok(
      expanded.some(
        scenario =>
          scenario.assets.length === assets.length - 1 &&
          !scenario.assets.some(asset => asset.id === extra.id)
      )
    )
  }
})

test('grouped sale proceeds follow the cash rounding of each sale', () => {
  const assets = Array.from({ length: 12 }, (_, i) => makeAsset(`asset_${i}`))
  const candidates = assets.map((asset, i) => ({
    id: asset.id,
    net: i < 10 ? 10.6 : 0.6
  }))
  const scenarios = getPostSaleScenarios(
    candidates,
    assets,
    {},
    { money: 100.7, day: 1 },
    { members: [] },
    {},
    { includeAdditionalCandidates: true }
  )
  const grouped = scenarios.find(
    scenario =>
      scenario.assets.length === 10 &&
      scenario.assets.every(
        asset => !['asset_10', 'asset_11'].includes(asset.id)
      )
  )
  assert.ok(grouped)
  // floor(floor(100.7 + 0.6) + 0.6) = 101.
  assert.equal(grouped.assetProceeds, 101 - 100.7)
  const primary = scenarios.find(
    scenario =>
      scenario.assets.length === 10 &&
      scenario.assets.every(asset => !['asset_0', 'asset_1'].includes(asset.id))
  )
  assert.ok(primary)
  // floor(floor(100.7 + 10.6) + 10.6) = 121.
  assert.equal(primary.assetProceeds, 121 - 100.7)
})

test('single-extra scenarios floor cash after the extra and each primary sale', () => {
  const assets = Array.from({ length: 15 }, (_, i) => makeAsset(`asset_${i}`))
  const scenarios = getPostSaleScenarios(
    assets.map((asset, i) => ({ id: asset.id, net: i < 10 ? 10.6 : 0.6 })),
    assets,
    {},
    { money: 100.7, day: 1 },
    { members: [] },
    {},
    { includeAdditionalCandidates: true }
  )
  const extra = scenarios.find(
    scenario =>
      scenario.assets.length === 14 &&
      !scenario.assets.some(asset => asset.id === 'asset_10')
  )
  const pair = scenarios.find(
    scenario =>
      scenario.assets.length === 13 &&
      scenario.assets.every(
        asset => !['asset_10', 'asset_0'].includes(asset.id)
      )
  )
  assert.ok(extra)
  assert.ok(pair)
  assert.equal(extra.assetProceeds, 101 - 100.7)
  assert.equal(pair.assetProceeds, 111 - 100.7)
})

test('expanded search is exhaustive through four extra candidates and bounded above that', () => {
  for (const count of [14, 15]) {
    const assets = Array.from({ length: count }, (_, i) => makeAsset(`a${i}`))
    const candidates = assets.map((asset, i) => ({
      id: asset.id,
      net: count - i
    }))
    const scenarios = getPostSaleScenarios(
      candidates,
      assets,
      {},
      { money: 100, day: 1 },
      { members: [] },
      {},
      { includeAdditionalCandidates: true }
    )
    assert.equal(scenarios.exhaustive, count === 14)
    assert.equal(
      scenarios.length,
      count === 14 ? 2 ** 14 - 1 : 1023 + 5 * 11 + 1024
    )
    if (count === 14) {
      const combinations = new Set(
        scenarios.map(scenario => {
          const retainedIds = new Set(scenario.assets.map(asset => asset.id))
          return assets
            .filter(asset => !retainedIds.has(asset.id))
            .map(asset => asset.id)
            .sort()
            .join(',')
        })
      )
      assert.equal(combinations.size, 2 ** 14 - 1)
      const wanted = new Set(['a0', 'a1', 'a10', 'a11', 'a12'])
      assert.ok(
        scenarios.some(scenario =>
          assets.every(
            asset =>
              scenario.assets.some(retained => retained.id === asset.id) !==
              wanted.has(asset.id)
          )
        )
      )
    }
  }
})
