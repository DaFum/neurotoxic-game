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
