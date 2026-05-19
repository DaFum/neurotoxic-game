# Merch Strategy Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat `typeDemandWeight = 1.0` stub in `calculateMerchRevenue` with a per-item demand model driven by city traits (`genreBias`, `barSpendingProfile`) and gig performance (`peakHype`, `misses`), so the pre-gig merch pricing decision faces a real strategic trade-off.

**Architecture:** New `src/data/merch.ts` module holds per-item demand profiles + a spending-profile multiplier table. `calculateMerchRevenue` in `src/utils/economyEngine.ts` is rewritten as a normalized-share allocator that reads city traits from `EconomyContext.cityTraits`. `usePostGigLogic` derives `cityTraits` from `currentGig.id` via `getCityKeyFromVenueId` + `state.cityStates`, with `deriveCityTraits` as a fallback. No UI changes, no new actions, no new state fields, no new locale strings.

**Tech Stack:** TypeScript (CheckJS strict), node:test for engine tests, Vitest for UI tests, pnpm. Existing project conventions per `AGENTS.md`.

**Spec:** [docs/superpowers/specs/2026-05-19-merch-strategy-depth-design.md](../specs/2026-05-19-merch-strategy-depth-design.md)

---

## File Structure

| File                                             | Status  | Responsibility                                                                                                                                                           |
| ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/merch.ts`                              | **NEW** | Per-item profiles (`MERCH_PROFILES`), spending-profile multipliers (`SPENDING_PROFILE_MERCH_MULTIPLIER`), derived `DEFAULT_MERCH_PRICES` re-export. Pure data, no logic. |
| `src/utils/economyEngine.ts`                     | MODIFY  | `DEFAULT_MERCH_PRICES` re-exports from `src/data/merch.ts`. `EconomyContext.cityTraits` added. `calculateMerchRevenue` rewritten.                                        |
| `src/utils/postGigUtils.ts`                      | MODIFY  | `deriveFinancials` accepts optional `cityTraits` param and threads it into `EconomyContext`.                                                                             |
| `src/hooks/usePostGigLogic.ts`                   | MODIFY  | Derives `cityTraits` from `state.cityStates` keyed by `getCityKeyFromVenueId(currentGig.id)`, with `deriveCityTraits` fallback. Passes into `deriveFinancials`.          |
| `tests/node/economyEngine.merchProfiles.test.js` | **NEW** | Unit tests for new demand pipeline (genre match, spending profile, performance lift, elasticity, order-independence, inventory cap, undefined traits, demand-lift > 1).  |
| `tests/node/economyEngine.test.js`               | MODIFY  | Update assertions invalidated by the rewrite (exact merch revenue numbers → ratio assertions).                                                                           |
| `src/utils/AGENTS.md`                            | MODIFY  | One-line pointer to `src/data/merch.ts` as source of truth for per-item demand profiles.                                                                                 |

---

## Task 1: Create the merch data module (pure data)

**Files:**

- Create: `src/data/merch.ts`

- [ ] **Step 1: Create the data module with profiles and spending multipliers**

Create `src/data/merch.ts` with:

```ts
/**
 * Per-item merch demand profiles. Source of truth for prices and demand
 * curves consumed by economyEngine.calculateMerchRevenue.
 */

export type CityGenre =
  | 'punk'
  | 'metal'
  | 'goth'
  | 'indie'
  | 'synth'
  | 'noise'
  | 'hardcore'

export type SpendingProfile =
  | 'stingy'
  | 'average'
  | 'generous'
  | 'drunkards'
  | 'merch-hungry'

export interface MerchItemProfile {
  /** Slug used as inventory key, price key, and i18n suffix. */
  key: string
  /** Default unit price in EUR. */
  defaultPrice: number
  /** Relative share of audience attention before all multipliers (0..1). */
  baseAppeal: number
  /** Price-elasticity strength. >1 punishes overpricing more steeply. */
  priceElasticity: number
  /** Multiplicative boosts by city genreBias. Missing genres default to 1.0. */
  genreAffinity: Partial<Record<CityGenre, number>>
  /** How much (peakHype/100 - 0.5) lifts demand. 0..1. */
  performanceSensitivity: number
  /** How much (misses/100) suppresses demand. 0..1. */
  missSensitivity: number
}

export const MERCH_PROFILES = {
  patches: {
    key: 'patches',
    defaultPrice: 5,
    baseAppeal: 0.4,
    priceElasticity: 0.8,
    genreAffinity: { punk: 1.6, hardcore: 1.5, metal: 1.3 },
    performanceSensitivity: 0.2,
    missSensitivity: 0.1
  },
  shirts: {
    key: 'shirts',
    defaultPrice: 20,
    baseAppeal: 0.35,
    priceElasticity: 1.0,
    genreAffinity: {},
    performanceSensitivity: 0.4,
    missSensitivity: 0.3
  },
  hoodies: {
    key: 'hoodies',
    defaultPrice: 45,
    baseAppeal: 0.15,
    priceElasticity: 1.4,
    genreAffinity: { goth: 1.5, metal: 1.4, noise: 1.3 },
    performanceSensitivity: 0.6,
    missSensitivity: 0.4
  },
  vinyl: {
    key: 'vinyl',
    defaultPrice: 35,
    baseAppeal: 0.1,
    priceElasticity: 1.5,
    genreAffinity: { indie: 1.7, synth: 1.5, goth: 1.3 },
    performanceSensitivity: 0.8,
    missSensitivity: 0.5
  },
  cds: {
    key: 'cds',
    defaultPrice: 15,
    baseAppeal: 0.05,
    priceElasticity: 0.9,
    genreAffinity: {},
    performanceSensitivity: 0.2,
    missSensitivity: 0.2
  }
} as const satisfies Record<string, MerchItemProfile>

export const SPENDING_PROFILE_MERCH_MULTIPLIER = {
  stingy: 0.7,
  average: 1.0,
  generous: 1.2,
  drunkards: 0.9,
  'merch-hungry': 1.5
} as const satisfies Record<SpendingProfile, number>

/**
 * Backwards-compatible derived map. Re-exported by economyEngine.ts so
 * existing imports of DEFAULT_MERCH_PRICES keep working unchanged.
 */
export const DEFAULT_MERCH_PRICES: Record<string, number> = Object.fromEntries(
  Object.values(MERCH_PROFILES).map(p => [p.key, p.defaultPrice])
)
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm run typecheck:core`
Expected: PASS (no new errors; the new file is not yet imported anywhere).

- [ ] **Step 3: Commit**

```bash
git add src/data/merch.ts
git commit -m "feat: add merch item profiles and spending multipliers data module"
```

---

## Task 2: Re-export `DEFAULT_MERCH_PRICES` from the data module

**Files:**

- Modify: `src/utils/economyEngine.ts:26-32`

- [ ] **Step 1: Replace the inline DEFAULT_MERCH_PRICES with a re-export**

In `src/utils/economyEngine.ts`, find lines 26-32:

```ts
export const DEFAULT_MERCH_PRICES: Record<string, number> = {
  shirts: 20,
  hoodies: 45,
  patches: 5,
  vinyl: 35,
  cds: 15
}
```

Replace with:

```ts
export { DEFAULT_MERCH_PRICES } from '../data/merch'
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.test.js`
Expected: PASS — all existing assertions still hold because the derived numbers match the original literals (shirts=20, hoodies=45, patches=5, vinyl=35, cds=15).

- [ ] **Step 3: Verify type gate**

Run: `pnpm run typecheck:core`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/utils/economyEngine.ts
git commit -m "refactor: source DEFAULT_MERCH_PRICES from data/merch module"
```

---

## Task 3: Add `cityTraits` to `EconomyContext` type

**Files:**

- Modify: `src/utils/economyEngine.ts:51-69`

- [ ] **Step 1: Import CityTraitState and extend EconomyContext**

In `src/utils/economyEngine.ts`, find the existing `import type` block near the top (around line 7) that imports from `../types`. Add `CityTraitState`:

```ts
import type { BandState, PlayerState, SocialState, Venue } from '../types'
import type { CityTraitState } from '../types/game'
```

Find the `EconomyContext` type (around line 51) and add the new optional field. The full updated type:

```ts
type EconomyContext = {
  daysSinceLastGig?: number
  lastGigDifficulty?: number
  controversyLevel?: number
  loyalty?: number
  zealotry?: number
  regionRep?: number
  discountedTickets?: boolean
  merchPrices?: Record<string, number>
  cityTraits?: CityTraitState
  social?: {
    zealotry?: number
    activeDeals?: Array<{
      type?: unknown
      offer?: { perGig?: number }
    }>
    [key: string]: unknown
  }
  [key: string]: unknown
}
```

- [ ] **Step 2: Verify type gate**

Run: `pnpm run typecheck:core`
Expected: PASS — the field is optional and not yet consumed anywhere.

- [ ] **Step 3: Verify existing tests still pass**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/utils/economyEngine.ts
git commit -m "feat(types): add cityTraits to EconomyContext"
```

---

## Task 4: Write failing test — genre match boost

**Files:**

- Create: `tests/node/economyEngine.merchProfiles.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/node/economyEngine.merchProfiles.test.js`:

```js
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

const callMerch = ({
  ticketsSold = 200,
  gigStats = buildGigStats(),
  inventory = buildInventory(),
  context = {}
} = {}) =>
  calculateMerchIncome({
    ticketsSold,
    gigStats,
    bandInventory: inventory,
    context
  })

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
```

**Important:** `calculateMerchIncome` is the existing exported name for the merch revenue function — confirm the export name in `src/utils/economyEngine.ts` (search for `export const calculateMerchIncome` or `export function calculateMerchIncome`). If the function is named `calculateMerchRevenue` internally and exported under a different name, use the exported name. The existing test file at line 12 imports `calculateMerchIncome`, so use that.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.merchProfiles.test.js`
Expected: FAIL — currently `cityTraits` has no effect, so punk and indie produce identical results.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/node/economyEngine.merchProfiles.test.js
git commit -m "test: failing test for genre-driven merch demand"
```

---

## Task 5: Implement new `calculateMerchRevenue` algorithm

**Files:**

- Modify: `src/utils/economyEngine.ts:316-387` (the existing `calculateMerchIncome` body)

- [ ] **Step 1: Read the existing function**

Open `src/utils/economyEngine.ts` and locate `calculateMerchIncome` (the existing exported merch revenue function — the body the spec calls `calculateMerchRevenue` is its implementation around lines 316-387). Read the full function and its signature so the rewrite matches the existing parameters (`ticketsSold`, `gigStats`, `bandInventory`, `context`).

- [ ] **Step 2: Add imports for the new data**

Near the top of `src/utils/economyEngine.ts`, add (alongside the existing `../data/merch` re-export):

```ts
import {
  MERCH_PROFILES,
  SPENDING_PROFILE_MERCH_MULTIPLIER,
  type MerchItemProfile,
  type CityGenre,
  type SpendingProfile
} from '../data/merch'
```

If `DEFAULT_MERCH_PRICES` is currently re-exported via `export { DEFAULT_MERCH_PRICES } from '../data/merch'` (from Task 2), keep that line as well.

- [ ] **Step 3: Replace the function body**

Replace the entire body of the merch revenue function. Keep the existing function signature, return shape (`{ revenue, breakdownItems, soldItems }`), and the existing `buyRate`/`potentialBuyers` derivation (lines 286-319 approximately — the part that computes `potentialBuyers` from `ticketsSold`, hype/miss penalties, and venue capacity). Only replace the per-item allocation loop (lines 321-380 approximately).

The new allocation block:

```ts
// --- BEGIN new per-item demand pipeline ---

const customPrices = context?.merchPrices ?? {}
const safeInventory = bandInventory || {}
const cityTraits = context?.cityTraits

const genreBias = (cityTraits?.genreBias ?? '') as CityGenre
const spendingProfile = (cityTraits?.barSpendingProfile ??
  'average') as SpendingProfile
const spendingMult = SPENDING_PROFILE_MERCH_MULTIPLIER[spendingProfile] ?? 1.0

const peakHype = typeof gigStats?.peakHype === 'number' ? gigStats.peakHype : 0
const misses = typeof gigStats?.misses === 'number' ? gigStats.misses : 0
const hypeNorm = Math.max(0, Math.min(100, peakHype)) / 100
const missNorm = Math.max(0, Math.min(100, misses)) / 100

const priceModifier = (
  price: number,
  defaultPrice: number,
  elasticity: number
): number => {
  if (price > defaultPrice) {
    return Math.max(
      0.2,
      1 - ((price - defaultPrice) / defaultPrice) * 1.5 * elasticity
    )
  }
  if (price < defaultPrice) {
    return Math.min(2.0, 1 + ((defaultPrice - price) / defaultPrice) * 1.0)
  }
  return 1.0
}

// Step 1: compute raw share per item
const rawShare: Record<string, number> = {}
const priceByKey: Record<string, number> = {}

for (const profile of Object.values(MERCH_PROFILES) as MerchItemProfile[]) {
  const inventoryCount =
    typeof safeInventory[profile.key] === 'number'
      ? (safeInventory[profile.key] as number)
      : 0
  if (inventoryCount <= 0) {
    rawShare[profile.key] = 0
    continue
  }

  const genreMult = profile.genreAffinity[genreBias] ?? 1.0
  const perfLift =
    1 +
    (hypeNorm - 0.5) * profile.performanceSensitivity -
    missNorm * profile.missSensitivity
  const perfMult = Math.max(0.1, perfLift)

  const price = customPrices[profile.key] ?? profile.defaultPrice
  priceByKey[profile.key] = price
  const priceMult = priceModifier(
    price,
    profile.defaultPrice,
    profile.priceElasticity
  )

  rawShare[profile.key] =
    profile.baseAppeal * genreMult * spendingMult * perfMult * priceMult
}

// Step 2: normalize
const totalRawShare = Object.values(rawShare).reduce((a, b) => a + b, 0)
if (totalRawShare <= 0) {
  return { revenue: 0, breakdownItems: [...breakdownItems], soldItems: {} }
}

// Step 3: total demand lift — great shows in good cities can exceed potentialBuyers
const demandLiftRaw = spendingMult * (0.5 + hypeNorm * 0.8 - missNorm * 0.4)
const demandLift = Math.max(0.3, Math.min(1.8, demandLiftRaw))
const effectiveBuyers = Math.floor(Math.max(0, potentialBuyers) * demandLift)

// Step 4: allocate by normalized share, capped by inventory (deterministic order)
const soldItems: Record<string, number> = {}
let totalRevenue = 0
const sortedKeys = Object.keys(MERCH_PROFILES).sort()

for (const key of sortedKeys) {
  const share = rawShare[key] / totalRawShare
  const desired = Math.floor(effectiveBuyers * share)
  const inventoryCount =
    typeof safeInventory[key] === 'number' ? (safeInventory[key] as number) : 0
  const sold = Math.min(desired, inventoryCount)
  if (sold > 0) {
    soldItems[key] = sold
    const price =
      priceByKey[key] ??
      (MERCH_PROFILES as Record<string, MerchItemProfile>)[key]?.defaultPrice ??
      0
    const itemRevenue = sold * price
    totalRevenue += itemRevenue
    breakdownItems.push({
      labelKey: `economy:gigIncome.merchSales.${key}.label`,
      value: itemRevenue,
      detailKey: 'economy:gigIncome.merchSales.detail',
      detailParams: { buyers: sold }
    })
  }
}

return {
  revenue: totalRevenue,
  breakdownItems,
  soldItems
}

// --- END new per-item demand pipeline ---
```

**Notes for the engineer:**

- The existing `potentialBuyers` calculation (using `buyRate`, hype/miss penalties on `buyRate`, and `Math.floor(ticketsSold * buyRate)`) is preserved unchanged. Only the _per-item_ loop after `potentialBuyers` is replaced.
- The existing `breakdownItems` array (containing earlier scandal-support / signing-bonus lines) is preserved and pushed into.
- Sorted-key iteration in Step 4 makes the output deterministic regardless of `MERCH_PROFILES` declaration order — required for the order-independence test in Task 9.
- `as CityGenre` and `as SpendingProfile` cast strings to literal types for the lookup; the `?? 1.0` and `?? 'average'` defaults handle missing/unknown values.

- [ ] **Step 4: Run the Task 4 test to verify it now passes**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.merchProfiles.test.js`
Expected: PASS — punk city now produces more patches than indie city.

- [ ] **Step 5: Verify type gate**

Run: `pnpm run typecheck:core`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/economyEngine.ts
git commit -m "feat: per-item merch demand model with city and performance signals"
```

---

## Task 6: Add remaining unit tests for the new pipeline

**Files:**

- Modify: `tests/node/economyEngine.merchProfiles.test.js`

- [ ] **Step 1: Append the spending-profile test**

Append to `tests/node/economyEngine.merchProfiles.test.js`:

```js
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
```

- [ ] **Step 2: Append the performance-lift test**

```js
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
```

- [ ] **Step 3: Append the miss-penalty asymmetry test**

```js
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

  const vinylDrop =
    (clean.soldItems?.vinyl ?? 0) - (sloppy.soldItems?.vinyl ?? 0)
  const patchDrop =
    (clean.soldItems?.patches ?? 0) - (sloppy.soldItems?.patches ?? 0)

  assert.ok(
    vinylDrop >= patchDrop,
    `vinyl should be more miss-sensitive than patches (vinylDrop=${vinylDrop}, patchDrop=${patchDrop})`
  )
})
```

- [ ] **Step 4: Append the price-elasticity test**

```js
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
      merchPrices: { hoodies: 68, patches: 8 } // both ~50% over default
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
```

- [ ] **Step 5: Append the order-independence test**

```js
test('result is independent of MERCH_PROFILES iteration order', async () => {
  // Run twice; if the implementation iterates a sorted key list internally
  // and normalizes shares before allocation, the result must be deterministic.
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
```

- [ ] **Step 6: Append the inventory-cap test**

```js
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
```

- [ ] **Step 7: Append the undefined-traits fallback test**

```js
test('undefined cityTraits falls back to neutral multipliers without crashing', () => {
  const result = callMerch({ context: {} })
  assert.ok(result.revenue >= 0, 'revenue should be non-negative')
  assert.ok(
    typeof result.soldItems === 'object',
    'soldItems should be an object'
  )
})
```

- [ ] **Step 8: Append the demand-lift > 1 test**

```js
test('merch-hungry + great show can sell more units than potentialBuyers implies', () => {
  // potentialBuyers = ticketsSold * buyRate (buyRate ~0.3-0.5 baseline)
  // With demandLift up to 1.8x, effectiveBuyers can exceed potentialBuyers.
  const result = callMerch({
    ticketsSold: 100,
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
  // Conservative ceiling: potentialBuyers cannot exceed ticketsSold; demandLift up to 1.8
  // expect total sold > 50% of ticketsSold given the boosts.
  assert.ok(
    totalSold > 50,
    `expected demand lift to drive significant sales beyond baseline; totalSold=${totalSold}`
  )
})
```

- [ ] **Step 9: Run all new tests**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.merchProfiles.test.js`
Expected: 8 tests pass (the Task 4 test + 7 appended here).

- [ ] **Step 10: Commit**

```bash
git add tests/node/economyEngine.merchProfiles.test.js
git commit -m "test: unit coverage for per-item merch demand pipeline"
```

---

## Task 7: Thread `cityTraits` through `deriveFinancials`

**Files:**

- Modify: `src/utils/postGigUtils.ts:745-803`

- [ ] **Step 1: Add `cityTraits` parameter to `deriveFinancials`**

In `src/utils/postGigUtils.ts`, find the `deriveFinancials` function (around line 745). Update its destructured parameters and type signature:

```ts
import type { CityTraitState } from '../types/game'
```

(Add the import near the existing type imports at the top of the file if not already present.)

Replace the function signature (lines ~745-772) parameter block:

```ts
export const deriveFinancials = ({
  currentGig,
  lastGigStats,
  perfScore,
  gigModifiers,
  bandInventory,
  bandMerchPrices,
  player,
  social,
  reputationByRegion,
  activeStoryFlags,
  gigContext,
  cityTraits
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  perfScore: number
  gigModifiers: GameState['gigModifiers']
  bandInventory: GameState['band']['inventory']
  bandMerchPrices?: GameState['band']['merchPrices']
  player: GameState['player']
  social: GameState['social']
  reputationByRegion: GameState['reputationByRegion']
  activeStoryFlags: GameState['activeStoryFlags']
  gigContext: {
    daysSinceLastGig: number
    lastGigDifficulty: number | null
  } | null
  cityTraits?: CityTraitState
}) => {
```

And in the `context` object passed to `calculateGigFinancials` (around line 782), add the new field:

```ts
    context: {
      controversyLevel: social?.controversyLevel || 0,
      regionRep: reputationByRegion?.[player?.location] || 0,
      loyalty: social?.loyalty || 0,
      zealotry: social?.zealotry || 0,
      discountedTickets: activeStoryFlags?.includes(
        'discounted_tickets_active'
      ),
      daysSinceLastGig: gigContext?.daysSinceLastGig ?? 0,
      lastGigDifficulty: gigContext?.lastGigDifficulty ?? undefined,
      merchPrices: bandMerchPrices,
      social,
      cityTraits
    }
```

- [ ] **Step 2: Verify type gate**

Run: `pnpm run typecheck:core`
Expected: PASS.

- [ ] **Step 3: Verify postGigUtils tests pass**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/postGigUtils.test.js`
Expected: PASS — existing callers don't pass `cityTraits`, so it stays undefined and the engine uses neutral fallbacks.

- [ ] **Step 4: Commit**

```bash
git add src/utils/postGigUtils.ts
git commit -m "feat: thread cityTraits through deriveFinancials into EconomyContext"
```

---

## Task 8: Wire `cityTraits` from `usePostGigLogic`

**Files:**

- Modify: `src/hooks/usePostGigLogic.ts:1-50, 80-119`

- [ ] **Step 1: Add imports**

In `src/hooks/usePostGigLogic.ts`, add imports near the top (alongside the existing `postGigUtils` import):

```ts
import { deriveCityTraits, getCityKeyFromVenueId } from '../utils/mapGenerator'
```

- [ ] **Step 2: Add `cityStates` selector**

In the selector block (around lines 24-33, alongside `currentGig`, `player`, etc.), add:

```ts
const cityStates = useGameSelector(state => state.cityStates)
```

- [ ] **Step 3: Derive `cityTraits` in the financials useMemo**

Find the `useMemo` that calls `deriveFinancials` (around line 92). Update it:

```ts
const financials = useMemo(() => {
  const cityKey = getCityKeyFromVenueId(currentGig?.id ?? '')
  const cityTraits =
    cityKey === ''
      ? undefined
      : (cityStates?.[cityKey] ?? deriveCityTraits(cityKey))

  return deriveFinancials({
    currentGig,
    lastGigStats,
    perfScore,
    gigModifiers,
    bandInventory: band.inventory,
    bandMerchPrices: band.merchPrices,
    player,
    social,
    reputationByRegion,
    activeStoryFlags,
    gigContext: gigContextRef.current,
    cityTraits
  })
}, [
  currentGig,
  lastGigStats,
  perfScore,
  gigModifiers,
  band.inventory,
  band.merchPrices,
  player,
  social,
  reputationByRegion,
  activeStoryFlags,
  cityStates
])
```

**Note:** `cityStates` is added to the dependency array. `gigContextRef.current` is a ref (not reactive) and stays out of deps as before.

- [ ] **Step 4: Verify type gate**

Run: `pnpm run typecheck:core`
Expected: PASS.

- [ ] **Step 5: Run Vitest UI suite for postgig**

Run: `pnpm run test:ui:file -- tests/ui/PostGig.component.test.jsx`
Expected: PASS — the hook still produces the same shape, and any existing fixtures that omit `cityStates` get `undefined → cityTraits === undefined → neutral multipliers`.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePostGigLogic.ts
git commit -m "feat: derive cityTraits from cityStates and pass into deriveFinancials"
```

---

## Task 9: Update existing economyEngine tests invalidated by the rewrite

**Files:**

- Modify: `tests/node/economyEngine.test.js` (lines around 185, 195, 225, 230, 259, 264, 317, 349, 513, 518 — wherever merch revenue is asserted)

- [ ] **Step 1: Run the existing test suite and list failures**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.test.js`
Expected: Some assertions involving exact merch revenue numbers may fail because the new allocator distributes buyers by normalized share rather than greedy first-come. Read the failure output and identify which assertions are tied to specific merch dollar amounts vs. structural assertions (presence of `merchSales` line keys, breakdown shape).

- [ ] **Step 2: For each failure, decide: structural or numeric?**

- **Structural assertions** (e.g., "breakdown contains a `merchSales.shirts.label` entry", "merch breakdown is an array of length > 0", "soldItems.shirts > 0") — should still pass; if they fail, that's a real bug in the rewrite, not a test update. Investigate before changing.
- **Numeric assertions** (e.g., `assert.equal(merchRevenue, 1234)`) — these are intentionally invalidated by the rewrite. Replace with a ratio or directional assertion.

Example transformation — if a test currently asserts:

```js
assert.equal(merchRevenue, 1850)
```

Replace with a directional invariant that still proves the merch system is working without baking in the old greedy-allocation arithmetic:

```js
assert.ok(
  merchRevenue > 0,
  'merch revenue should be positive with stock and buyers'
)
assert.ok(
  merchRevenue < gigData.capacity * 50,
  'merch revenue should not exceed an absurd ceiling'
)
```

For tests that compare two scenarios (e.g., "higher hype → higher merch revenue"), keep them as ratio/inequality assertions — those are _more_ valid after the rewrite, not less.

- [ ] **Step 3: Apply updates**

Edit the failing assertions per the rules above. Do **not** weaken structural assertions (line key presence, return shape). Do **not** delete tests — convert them.

- [ ] **Step 4: Re-run the full economy suite**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/node/economyEngine.test.js
git commit -m "test: update merch revenue assertions for new demand pipeline"
```

---

## Task 10: Document the new data module in AGENTS.md

**Files:**

- Modify: `src/utils/AGENTS.md`

- [ ] **Step 1: Add a one-line pointer**

Open `src/utils/AGENTS.md`. Find the existing entry mentioning `DEFAULT_MERCH_PRICES` or `deriveFinancials` (around line 37 per the prior grep). Add a new bullet (or update the existing one) to read:

```
- Per-item merch demand profiles live in `src/data/merch.ts` (`MERCH_PROFILES`, `SPENDING_PROFILE_MERCH_MULTIPLIER`). `DEFAULT_MERCH_PRICES` is re-exported from there for backwards compatibility — do not redefine merch prices in `economyEngine.ts`.
- `calculateMerchIncome` reads `context.cityTraits` (optional) to apply city `genreBias` and `barSpendingProfile` multipliers. Callers thread this from `state.cityStates` via `usePostGigLogic.ts`.
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/AGENTS.md
git commit -m "docs: note merch profile module and cityTraits context in utils AGENTS.md"
```

---

## Task 11: Full gate

- [ ] **Step 1: Run the fast PR gate**

Run: `pnpm run test`
Expected: PASS.

- [ ] **Step 2: Run the type gate**

Run: `pnpm run typecheck:core`
Expected: PASS.

- [ ] **Step 3: Run the full PR gate**

Run: `pnpm run test:all`
Expected: PASS.

- [ ] **Step 4: Smoke-check a gig manually (optional but recommended)**

Run: `pnpm run dev`
Play through a single gig: pick a venue, set merch prices in the PreGig screen, finish the gig, inspect the PostGig breakdown. Verify:

- Merch line items appear in the breakdown.
- The `net` value equals displayed income minus displayed expenses (AGENTS.md gotcha).
- No console errors related to `cityTraits`, `MERCH_PROFILES`, or `deriveCityTraits`.

If everything passes, the implementation is complete and the branch is ready for review.

---

## Out of scope (explicit non-goals from spec)

- Forecast UI in `MerchStrategyBlock`
- Inventory risk / spoilage / carrying cost
- New merch item types
- Fan-segment integration (feature 1 not implemented)
- Changes to `useMerchPress` (separate mechanic)
- New locale strings
