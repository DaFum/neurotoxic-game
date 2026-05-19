import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateMerchIncome } from '../../src/utils/economyEngine'

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
  const result = callMerch({
    ticketsSold: 200,
    gigStats: { misses: 0, peakHype: 100 },
    inventory: {
      shirts: 999,
      hoodies: 999,
      patches: 999,
      cds: 999,
      vinyl: 999
    },
    context: {
      cityTraits: {
        genreBias: 'punk',
        barSpendingProfile: 'merch-hungry',
        attentionSpan: 30
      }
    }
  })

  const totalSold = Object.values(result.soldItems ?? {}).reduce(
    (a, b) => a + b,
    0
  )
  assert.ok(
    totalSold > 50,
    `expected demand lift to drive significant sales beyond baseline; totalSold=${totalSold}`
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
