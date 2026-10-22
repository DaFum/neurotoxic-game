import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateMerchIncome,
  DEFAULT_MERCH_PRICES
} from '../../src/utils/economy'

const buildInventory = (overrides = {}) => ({
  shirts: 50,
  hoodies: 20,
  patches: 100,
  cds: 30,
  vinyl: 10,
  ...overrides
})

const buildGigStats = (overrides = {}) => ({
  misses: 0,
  peakHype: 50,
  ...overrides
})

// Positional signature: (ticketsSold, performanceScore, gigStats, modifiers, bandInventory, context)
const callMerch = ({
  ticketsSold = 200,
  performanceScore = 50,
  gigStats = buildGigStats(),
  modifiers = {},
  inventory = buildInventory(),
  context = {}
} = {}) =>
  calculateMerchIncome(
    ticketsSold,
    performanceScore,
    gigStats,
    modifiers,
    inventory,
    context
  )

test('patches sell more in a punk city than in an indie city', () => {
  const punkResult = callMerch({
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })
  const indieResult = callMerch({
    context: {
      cityTraits: {
        genreBias: 'indie',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })

  const punkPatches = punkResult.soldItems?.patches ?? 0
  const indiePatches = indieResult.soldItems?.patches ?? 0

  assert.ok(
    punkPatches > indiePatches,
    `expected more patches sold in punk city (${punkPatches}) than indie city (${indiePatches})`
  )
})

test('merch-hungry city produces more revenue than stingy city', () => {
  const hungry = callMerch({
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'merch-hungry',
        attentionSpan: 30
      }
    }
  })
  const stingy = callMerch({
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'stingy',
        attentionSpan: 30
      }
    }
  })
  assert.ok(
    hungry.revenue > stingy.revenue,
    `merch-hungry revenue (${hungry.revenue}) should exceed stingy revenue (${stingy.revenue})`
  )
})

test('high peak hype lifts vinyl revenue more than CD revenue', () => {
  const greatShow = callMerch({
    gigStats: { misses: 0, peakHype: 100 },
    context: {
      cityTraits: {
        genreBias: 'indie',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })
  const mediocre = callMerch({
    gigStats: { misses: 0, peakHype: 30 },
    context: {
      cityTraits: {
        genreBias: 'indie',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })

  const vinylDelta =
    (greatShow.soldItems?.vinyl ?? 0) - (mediocre.soldItems?.vinyl ?? 0)
  const cdDelta =
    (greatShow.soldItems?.cds ?? 0) - (mediocre.soldItems?.cds ?? 0)

  assert.ok(
    vinylDelta > cdDelta,
    `vinyl should be more performance-sensitive than CDs (vinylDelta=${vinylDelta}, cdDelta=${cdDelta})`
  )
})

test('high miss count hurts vinyl revenue more than patches revenue', () => {
  const clean = callMerch({
    gigStats: { misses: 0, peakHype: 70 },
    context: {
      cityTraits: {
        genreBias: 'indie',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })
  const sloppy = callMerch({
    gigStats: { misses: 50, peakHype: 70 },
    context: {
      cityTraits: {
        genreBias: 'indie',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })

  const cleanVinyl = clean.soldItems?.vinyl ?? 0
  const sloppyVinyl = sloppy.soldItems?.vinyl ?? 0
  const cleanPatches = clean.soldItems?.patches ?? 0
  const sloppyPatches = sloppy.soldItems?.patches ?? 0

  // Compare relative (percentage) drops: vinyl has missSensitivity=0.5, patches=0.1
  const vinylDropPct =
    cleanVinyl > 0 ? (cleanVinyl - sloppyVinyl) / cleanVinyl : 0
  const patchDropPct =
    cleanPatches > 0 ? (cleanPatches - sloppyPatches) / cleanPatches : 0

  assert.ok(
    vinylDropPct >= patchDropPct,
    `vinyl should be more miss-sensitive than patches (vinylDropPct=${vinylDropPct.toFixed(3)}, patchDropPct=${patchDropPct.toFixed(3)})`
  )
})

test('overpricing hoodies hurts sales faster than overpricing patches', () => {
  const baseCtx = {
    cityTraits: {
      genreBias: 'metal',
      barSpendingProfile: 'average',
      attentionSpan: 30
    }
  }
  const defaultPrices = callMerch({ context: baseCtx })
  const overpriced = callMerch({
    context: {
      ...baseCtx,
      merchPrices: { hoodies: 68, patches: 8 }
    }
  })

  const hoodieDropPct =
    1 -
    (overpriced.soldItems?.hoodies ?? 0) /
      (defaultPrices.soldItems?.hoodies ?? 1)
  const patchDropPct =
    1 -
    (overpriced.soldItems?.patches ?? 0) /
      (defaultPrices.soldItems?.patches ?? 1)

  assert.ok(
    hoodieDropPct > patchDropPct,
    `hoodies (elasticity 1.4) should drop more than patches (elasticity 0.8): hoodieDropPct=${hoodieDropPct.toFixed(3)}, patchDropPct=${patchDropPct.toFixed(3)}`
  )
})

test('result is deterministic across repeated identical calls', () => {
  const ctx = {
    cityTraits: {
      genreBias: 'punk',
      barSpendingProfile: 'average',
      attentionSpan: 30
    }
  }
  const a = callMerch({ context: ctx })
  const b = callMerch({ context: ctx })

  assert.equal(a.revenue, b.revenue, 'revenue must be deterministic')
  assert.deepEqual(
    a.soldItems,
    b.soldItems,
    'soldItems must be deterministic between identical calls'
  )
})

test('inventory cap prevents overselling even under huge demand', () => {
  const result = callMerch({
    ticketsSold: 10000,
    gigStats: { misses: 0, peakHype: 100 },
    inventory: { shirts: 0, hoodies: 0, patches: 1, cds: 0, vinyl: 0 },
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'merch-hungry',
        attentionSpan: 30
      }
    }
  })
  assert.equal(
    result.soldItems?.patches ?? 0,
    1,
    'cannot sell more than inventory'
  )
})

test('undefined cityTraits falls back to neutral multipliers without crashing', () => {
  const result = callMerch({ context: {} })
  assert.ok(result.revenue >= 0, 'revenue should be non-negative')
  assert.ok(
    result.soldItems !== null && typeof result.soldItems === 'object',
    'soldItems should be a non-null object'
  )
})

test('merch-hungry + great show can sell more units than potentialBuyers implies', () => {
  const inventory = {
    shirts: 999,
    hoodies: 999,
    patches: 999,
    cds: 999,
    vinyl: 999
  }
  const gigStats = { misses: 0, peakHype: 100 }
  const baseline = callMerch({
    ticketsSold: 200,
    gigStats,
    inventory,
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'average',
        attentionSpan: 30
      }
    }
  })
  const result = callMerch({
    ticketsSold: 200,
    gigStats,
    inventory,
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'merch-hungry',
        attentionSpan: 30
      }
    }
  })

  const sum = items => Object.values(items ?? {}).reduce((a, b) => a + b, 0)
  const baselineSold = sum(baseline.soldItems)
  const totalSold = sum(result.soldItems)

  assert.ok(
    totalSold > baselineSold,
    `merch-hungry demand lift should beat average baseline; baselineSold=${baselineSold}, totalSold=${totalSold}`
  )
})

test('out-of-stock items do not redistribute their demand share to in-stock items', () => {
  const ctx = {
    cityTraits: {
      genreBias: 'punk',
      barSpendingProfile: 'average',
      attentionSpan: 30
    }
  }
  // Full inventory baseline.
  const baseline = callMerch({ context: ctx })
  // Same setup, but zero out hoodies + vinyl. Demand that would have gone to
  // them must be lost, not absorbed by shirts/patches/cds.
  const partial = callMerch({
    inventory: buildInventory({ hoodies: 0, vinyl: 0 }),
    context: ctx
  })

  const baseShirts = baseline.soldItems?.shirts ?? 0
  const partShirts = partial.soldItems?.shirts ?? 0
  const basePatches = baseline.soldItems?.patches ?? 0
  const partPatches = partial.soldItems?.patches ?? 0

  // Allow rounding-floor noise (1 unit) but reject absorption of out-of-stock demand.
  assert.ok(
    partShirts <= baseShirts + 1,
    `shirts must not gain from out-of-stock hoodies/vinyl: baseline=${baseShirts}, partial=${partShirts}`
  )
  assert.ok(
    partPatches <= basePatches + 1,
    `patches must not gain from out-of-stock hoodies/vinyl: baseline=${basePatches}, partial=${partPatches}`
  )
})

// --- Price demand: raising prices must cost buyers, not just shift share ---

const FULL_STOCK = Object.fromEntries(
  Object.keys(DEFAULT_MERCH_PRICES).map(key => [key, 9999])
)
const PRICE_CTX = {
  cityTraits: {
    genreBias: 'punk',
    barSpendingProfile: 'average',
    attentionSpan: 30
  }
}
const scaledPrices = factor =>
  Object.fromEntries(
    Object.entries(DEFAULT_MERCH_PRICES).map(([key, price]) => [
      key,
      price * factor
    ])
  )
const unitsSold = result =>
  Object.values(result.soldItems ?? {}).reduce((a, b) => a + b, 0)
const callPriced = (merchPrices, inventory = FULL_STOCK) =>
  callMerch({
    ticketsSold: 2000,
    inventory,
    context: { ...PRICE_CTX, ...(merchPrices ? { merchPrices } : {}) }
  })

test('raising every price 100x or 1000x cannot keep unit sales or multiply revenue', () => {
  const baseline = callPriced()
  assert.ok(unitsSold(baseline) > 0, 'baseline must sell something')
  for (const factor of [100, 1000]) {
    const scaled = callPriced(scaledPrices(factor))
    assert.ok(
      unitsSold(scaled) < unitsSold(baseline),
      `${factor}x prices must lose buyers: baseline=${unitsSold(baseline)}, scaled=${unitsSold(scaled)}`
    )
    assert.ok(
      scaled.revenue <= baseline.revenue,
      `${factor}x prices must not multiply revenue: baseline=${baseline.revenue}, scaled=${scaled.revenue}`
    )
  }
})

test('revenue at 10x default prices is below revenue at default prices', () => {
  const baseline = callPriced()
  const tenX = callPriced(scaledPrices(10))
  assert.ok(
    tenX.revenue < baseline.revenue,
    `10x revenue (${tenX.revenue}) must be below default revenue (${baseline.revenue})`
  )
})

test('uniform price changes earn the most revenue at the default price', () => {
  const baseline = callPriced()
  for (const factor of [0.5, 0.8, 1.1, 1.25, 1.5, 2]) {
    const result = callPriced(scaledPrices(factor))
    assert.ok(
      result.revenue < baseline.revenue,
      `${factor}x revenue (${result.revenue}) must be below default revenue (${baseline.revenue})`
    )
  }
})

test('explicit default prices keep the default result identical', () => {
  assert.deepEqual(callPriced(scaledPrices(1)), callPriced())
})

test('an overpriced item loses its buyers without pushing them to other items', () => {
  const baseline = callPriced()
  const mixed = callPriced({ shirts: DEFAULT_MERCH_PRICES.shirts * 10 })
  assert.equal(mixed.soldItems.shirts ?? 0, 0, 'shirts priced 10x sell none')
  for (const [key, sold] of Object.entries(baseline.soldItems)) {
    if (key === 'shirts') continue
    assert.equal(
      mixed.soldItems[key] ?? 0,
      sold,
      `${key} must not absorb overpriced shirt demand`
    )
  }
})

test('a discount moves share between items but adds no buyers overall', () => {
  const baseline = callPriced()
  const itemCount = Object.keys(DEFAULT_MERCH_PRICES).length
  const discounted = callPriced({
    shirts: DEFAULT_MERCH_PRICES.shirts / 2,
    hoodies: DEFAULT_MERCH_PRICES.hoodies * 3
  })
  assert.ok(
    discounted.soldItems.shirts > baseline.soldItems.shirts,
    'discounted shirts gain share'
  )
  assert.equal(
    discounted.soldItems.hoodies ?? 0,
    0,
    'tripled hoodies sell none'
  )
  // Flooring each item can drop at most one unit per item.
  assert.ok(
    unitsSold(discounted) <= unitsSold(baseline) + itemCount,
    `discount must not create buyers: baseline=${unitsSold(baseline)}, discounted=${unitsSold(discounted)}`
  )
})

test('overpricing an out-of-stock item does not hand its demand to in-stock items', () => {
  const inventory = { ...FULL_STOCK, hoodies: 0, vinyl: 0 }
  const baseline = callPriced(undefined, inventory)
  const priced = callPriced(
    {
      hoodies: DEFAULT_MERCH_PRICES.hoodies * 1000,
      vinyl: DEFAULT_MERCH_PRICES.vinyl * 1000
    },
    inventory
  )
  assert.deepEqual(priced.soldItems, baseline.soldItems)
  assert.equal(priced.revenue, baseline.revenue)
})

test('non-finite or negative custom prices fall back to the default price', () => {
  const baseline = callPriced()
  for (const bad of [
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NaN,
    -5,
    '40',
    null
  ]) {
    const prices = Object.fromEntries(
      Object.keys(DEFAULT_MERCH_PRICES).map(key => [key, bad])
    )
    const result = callPriced(prices)
    assert.ok(Number.isFinite(result.revenue), `revenue finite for ${bad}`)
    assert.equal(result.revenue, baseline.revenue, `revenue for ${bad}`)
    assert.deepEqual(result.soldItems, baseline.soldItems, `sold for ${bad}`)
  }
})
