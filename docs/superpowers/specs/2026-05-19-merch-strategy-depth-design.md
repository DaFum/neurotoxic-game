# Merch Strategy — Depth of Decision (Feature 2 Extension)

**Date:** 2026-05-19
**Status:** Approved design, ready for implementation plan
**Scope:** Extend the existing merch strategy system so the pre-gig pricing and stock decision faces a real trade-off driven by per-item demand profiles, city audience signals, and gig performance — without adding new UI surfaces beyond what already exists.

---

## 1. Problem

`calculateMerchRevenue` in [src/utils/economyEngine.ts:316](../../../src/utils/economyEngine.ts:316) currently:

- Treats every merch item identically: `typeDemandWeight = 1.0` is a hardcoded constant ([economyEngine.ts:354](../../../src/utils/economyEngine.ts:354)) with a comment "Could randomize or vary by type".
- Allocates buyers greedily in `Object.keys` order, making outcomes depend on key iteration order rather than item appeal.
- Ignores city traits entirely. `CITY_TRAIT_GENRES` and `CITY_TRAIT_SPENDING_PROFILES` are derived per city ([src/utils/mapGenerator.ts:93,103](../../../src/utils/mapGenerator.ts:93)) and stored in `state.cityStates`, but the economy engine never reads them. The `merch-hungry` spending profile exists in the type but is dead code at the economy layer.
- Applies a single piecewise price-modifier curve regardless of item type, so vinyl and patches respond to overpricing the same way.

Result: the player's pre-gig merch choice is decorative. Best play is "set everything 10% under default and never think about it again."

---

## 2. Goal

Make the pre-gig merch decision pivot on three meaningful axes:

1. **Per-item demand profile** — different items have different base appeal, price elasticity, and performance sensitivity.
2. **Audience-driven demand** — city `genreBias` and `barSpendingProfile` shift per-item demand multiplicatively.
3. **Performance-driven demand** — gig `peakHype` and `misses` lift or suppress per-item demand by item-specific sensitivity.

The decision becomes: *"This is a punk-hardcore city with a merch-hungry crowd, and I'm confident in a high-hype show — overstock patches and price hoodies aggressively. The vinyl run that worked in the indie city last week is dead weight here."*

---

## 3. Non-Goals

- ❌ Forecast UI in `MerchStrategyBlock`. Player learns from postgig breakdowns and venue intel; the existing UI stays unchanged in shape.
- ❌ Inventory risk / spoilage / carrying cost.
- ❌ New merch items beyond the existing five (`shirts`, `hoodies`, `patches`, `vinyl`, `cds`).
- ❌ Fan-segment integration. Feature 1 is not implemented; this design intentionally avoids depending on it. City `genreBias` and `barSpendingProfile` are the audience proxy.
- ❌ Changes to `useMerchPress` (the separate merch-press loyalty mechanic).

---

## 4. Architecture

### 4.1 New data module: `src/data/merch.ts`

Single source of truth for per-item profiles. Replaces the inline `DEFAULT_MERCH_PRICES` constant.

```ts
// src/data/merch.ts
import type { CityTraitState } from '../types/game'

type CityGenre = CityTraitState['genreBias']  // 'punk' | 'metal' | 'goth' | 'indie' | 'synth' | 'noise' | 'hardcore' | 'unknown'

export interface MerchItemProfile {
  /** Slug used as the inventory key and i18n suffix. */
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
    baseAppeal: 0.40,
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
    baseAppeal: 0.10,
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
    genreAffinity: {},  // universal but dying — applied via baseAppeal
    performanceSensitivity: 0.2,
    missSensitivity: 0.2
  }
} as const satisfies Record<string, MerchItemProfile>

/** Backwards-compatible derived map. Existing imports of DEFAULT_MERCH_PRICES keep working. */
export const DEFAULT_MERCH_PRICES: Record<string, number> = Object.fromEntries(
  Object.values(MERCH_PROFILES).map(p => [p.key, p.defaultPrice])
)
```

**Why a new file:** Per AGENTS.md, balance data lives in `src/data/`; engine logic in `src/utils/`. `economyEngine.ts` is already large — keeping the profile table separate makes balance tuning a data change.

**Type discipline:** `as const satisfies Record<string, MerchItemProfile>` per AGENTS.md ("Prefer `as const satisfies Record<Union, T>`"). `CityGenre` type is sourced from `CityTraitState` so a future genre addition fails the type check in one place.

### 4.2 New spending-profile table

In the same `src/data/merch.ts`:

```ts
type SpendingProfile = CityTraitState['barSpendingProfile']

export const SPENDING_PROFILE_MERCH_MULTIPLIER = {
  'stingy': 0.7,
  'average': 1.0,
  'generous': 1.2,
  'drunkards': 0.9,         // money goes to the bar, not the merch table
  'merch-hungry': 1.5
} as const satisfies Record<SpendingProfile, number>
```

### 4.3 Demand pipeline in `calculateMerchRevenue`

Replace the existing per-item greedy loop. New algorithm:

```
INPUT: potentialBuyers, customPrices, bandInventory, gigStats, cityTraits

// Step 1: compute raw share per item
for each profile in MERCH_PROFILES:
  if bandInventory[profile.key] <= 0: skip (raw share = 0)

  genreMult = profile.genreAffinity[cityTraits.genreBias] ?? 1.0
  spendingMult = SPENDING_PROFILE_MERCH_MULTIPLIER[cityTraits.barSpendingProfile] ?? 1.0
  perfLift = 1
            + clamp(-0.5, 0.5, (gigStats.peakHype / 100) - 0.5) * profile.performanceSensitivity
            - clamp(0, 1, gigStats.misses / 100) * profile.missSensitivity
  perfMult = max(0.1, perfLift)

  price = customPrices[profile.key] ?? profile.defaultPrice
  priceMult = priceModifier(price, profile.defaultPrice, profile.priceElasticity)
  // priceModifier: existing piecewise curve, but elasticity scales the over-default slope

  rawShare[profile.key] = profile.baseAppeal * genreMult * spendingMult * perfMult * priceMult

// Step 2: normalize to a probability distribution
totalRawShare = Σ rawShare
if totalRawShare == 0: return { revenue: 0, breakdownItems: [], soldItems: {} }
normalizedShare[k] = rawShare[k] / totalRawShare

// Step 3: total demand lift — great shows in good cities exceed potentialBuyers
//  cap is intentionally > 1; this is the design decision from the brainstorm
// spendingMult is the city's barSpendingProfile multiplier from SPENDING_PROFILE_MERCH_MULTIPLIER
demandLift = spendingMult * (0.5 + (gigStats.peakHype / 100) * 0.8 - (gigStats.misses / 100) * 0.4)
demandLift = clamp(0.3, 1.8, demandLift)

effectiveBuyers = floor(potentialBuyers * demandLift)

// Step 4: allocate by normalized share, capped by inventory
for each profile (deterministic order — sorted by key for stability):
  desired = floor(effectiveBuyers * normalizedShare[profile.key])
  sold = min(desired, bandInventory[profile.key])
  if sold > 0:
    soldItems[profile.key] = sold
    revenue += sold * price[profile.key]
    breakdownItems.push({ labelKey: 'economy:gigIncome.merchSales.<key>.label', value: sold*price, detailKey, detailParams: { buyers: sold } })

return { revenue, breakdownItems, soldItems }
```

**Key properties:**

- **Order-independent.** Step 2 normalizes before allocation. Step 4 iterates in sorted-key order purely for deterministic logging.
- **No greedy bleed-over.** Removing the `totalBuyersRemaining -= soldAmount` accumulator means a popular item doesn't starve others arbitrarily; share is set by appeal.
- **Inventory-bounded.** `sold = min(desired, inventory)` — never sells beyond stock. Lost demand from being out of stock is *not* redistributed to other items (this is the design choice; redistribution would punish underpricing by reducing the lost-sale signal).
- **`effectiveBuyers > potentialBuyers` allowed.** `demandLift` caps at 1.8, so a great show in a merch-hungry city can move up to 80% more units than ticket-buy-rate alone implies.

### 4.4 Wiring: pass `cityTraits` through `context`

Extend `EconomyContext` in [economyEngine.ts:51](../../../src/utils/economyEngine.ts:51):

```ts
type EconomyContext = {
  // ...existing fields...
  cityTraits?: CityTraitState
}
```

Source from [src/hooks/usePostGigLogic.ts:100](../../../src/hooks/usePostGigLogic.ts:100), where `band.merchPrices` is already threaded. Add:

```ts
const cityKey = getCityKeyFromVenueId(currentGig?.id ?? '')
const cityTraits = cityKey
  ? (state.cityStates?.[cityKey] ?? deriveCityTraits(cityKey))
  : undefined
// pass as context.cityTraits into calculateGigFinancials
```

`getCityKeyFromVenueId` returns `''` for malformed IDs (per AGENTS.md gotcha); the empty-string guard above keeps `cityTraits` undefined in that case, and the engine falls back to neutral multipliers (genreMult=1, spendingMult=1).

### 4.5 Fallback when `cityTraits` is undefined

Required because saved games may have venues with no city key, and tests/fixtures may omit the field:

- `genreMult = 1.0`
- `spendingMult = 1.0`
- `demandLift` formula still runs (performance still affects total)

No crash, no special-case branch beyond the `?? 1.0` defaults.

---

## 5. Data flow

```
PreGig screen
  └─ MerchStrategyBlock (unchanged shape)
       └─ reads DEFAULT_MERCH_PRICES (now derived from MERCH_PROFILES)
       └─ writes band.merchPrices via SET_MERCH_PRICE action (existing)

Gig completes
  └─ usePostGigLogic
       ├─ deriveCityTraits(getCityKeyFromVenueId(currentGig.id))
       ├─ context.cityTraits = ...
       ├─ context.merchPrices = band.merchPrices  (existing)
       └─ calculateGigFinancials(...)
            └─ deriveFinancials(...)
                 └─ calculateMerchRevenue(bandInventory, gigStats, context)
                      └─ reads MERCH_PROFILES + SPENDING_PROFILE_MERCH_MULTIPLIER
                      └─ writes breakdownItems[] into EconomyBreakdown  (existing pattern)

PostGig screen
  └─ reads EconomyBreakdown; per-item `merchSales.<key>` lines already render
```

No new actions. No new state fields. No changes to `sanitizeBand` — `band.merchPrices` persistence is already correct.

---

## 6. Type contracts

- `MerchItemProfile` and `MERCH_PROFILES` live in `src/data/merch.ts`.
- `CityGenre` and `SpendingProfile` are derived from `CityTraitState` in `src/types/game.d.ts` — no duplication. If `CityTraitState` adds a value, `MERCH_PROFILES` keeps compiling (missing genre keys → 1.0 default); `SPENDING_PROFILE_MERCH_MULTIPLIER` fails to compile via `satisfies Record<SpendingProfile, number>` (intentional: forces a balance decision).
- `EconomyContext.cityTraits?: CityTraitState` — optional, narrows existing context type. No `any`.

---

## 7. Error handling

Following AGENTS.md ("Don't add error handling for scenarios that can't happen"):

- City key not derivable → undefined `cityTraits` → neutral multipliers. Not an error.
- `gigStats.peakHype` or `gigStats.misses` undefined → existing `?? 0` defaults already in the function.
- Negative or non-finite prices in `customPrices` → already sanitized by `sanitizeBand`; no defensive coding needed in the engine.
- Empty inventory across all items → `totalRawShare === 0` → return zero-revenue result. Explicit early return is the only added guard.

---

## 8. Testing

New file: `tests/node/economyEngine.merchProfiles.test.js` (node:test runner — matches neighboring `economyEngine.test.js`).

### Unit tests

1. **Genre match boost** — patches in a `punk` city sell more than in an `indie` city, holding all else constant.
2. **Spending profile** — `merch-hungry` city produces strictly more revenue than `stingy` city for the same gig.
3. **Performance lift on premium items** — `peakHype = 100, misses = 0` lifts vinyl sales by more than CD sales (vinyl has higher `performanceSensitivity`).
4. **Miss penalty asymmetry** — `misses = 50, peakHype = 30` reduces vinyl revenue more than patches.
5. **Price elasticity per item** — pricing hoodies 50% over default kills sales faster than pricing patches 50% over default.
6. **Order independence** — running `calculateMerchRevenue` with `MERCH_PROFILES` keys shuffled produces identical revenue and `soldItems` totals. (Vitest cannot prove this; assert via two seeded inputs.)
7. **Inventory cap** — high demand on a 1-unit stock yields `sold === 1`, not more.
8. **Undefined city traits** — engine returns sensible result with neutral multipliers.
9. **Demand lift > 1** — merch-hungry + peakHype 100 + 0 misses → `Σ soldItems > potentialBuyers` is achievable.

### Integration test

10. **PostGig invariant holds** — `golden-path-test-author`-style: full gig cycle, `net === income − expenses`, all merch lines appear in breakdown.

### Existing tests to update

- [tests/node/economyEngine.test.js](../../../tests/node/economyEngine.test.js) — adjust assertions that assumed `typeDemandWeight = 1.0`. Replace exact-revenue assertions with ratio assertions (e.g., "patches revenue > vinyl revenue at default prices in punk city").
- [tests/ui/PreGig.test.jsx](../../../tests/ui/PreGig.test.jsx) and [tests/ui/MerchPressModal.test.jsx](../../../tests/ui/MerchPressModal.test.jsx) — verify `DEFAULT_MERCH_PRICES` still exports the same numbers (compat check).

---

## 9. i18n

No new user-facing strings. The breakdown labels (`economy:gigIncome.merchSales.<key>.label`) already exist in both `public/locales/en/economy.json` and `public/locales/de/economy.json`.

If the implementation surfaces *why* an item sold well (out of scope per non-goals), strings would be added then. Not now.

---

## 10. Migration & backwards compatibility

- **Save files:** No new persisted fields. Existing `band.merchPrices` keeps working. `band.bandInventory` keys unchanged.
- **Existing tests:** `DEFAULT_MERCH_PRICES` export is preserved (derived from profiles) with identical numbers, so callers in `MerchStrategyBlock` and `systemReducer.sanitizeBand` need no changes.
- **Balance impact:** This *will* shift revenue distributions in existing playthroughs. That's the point. Document in release notes.

---

## 11. Files touched

| File | Change |
|---|---|
| `src/data/merch.ts` | **New.** `MERCH_PROFILES`, `SPENDING_PROFILE_MERCH_MULTIPLIER`, derived `DEFAULT_MERCH_PRICES` export. |
| `src/utils/economyEngine.ts` | `DEFAULT_MERCH_PRICES` re-exports from `src/data/merch.ts`. `EconomyContext.cityTraits` added. `calculateMerchRevenue` rewritten per §4.3. |
| `src/hooks/usePostGigLogic.ts` | Derive `cityTraits` from `currentGig.id` + `state.cityStates`, pass into `context`. |
| `tests/node/economyEngine.merchProfiles.test.js` | **New.** All §8 unit tests. |
| `tests/node/economyEngine.test.js` | Update assertions invalidated by §4.3 rewrite. |
| `src/utils/AGENTS.md` | Add one-line note pointing to `src/data/merch.ts` as the source of truth for per-item profiles. |

No changes to: `MerchStrategyBlock.tsx`, `sanitizeBand`, action creators, action types, reducer state shape.

---

## 12. Open risks

1. **Balance:** Patches in a punk city with a great show may dominate revenue. Mitigation: `baseAppeal` × `genreMult` × `spendingMult` × `perfMult` × `priceMult` is multiplicative — extreme outcomes are possible but bounded by `demandLift ≤ 1.8` and inventory. Playtest after implementation.
2. **`gigStats.peakHype` semantics:** Confirm the 0..100 range. If the existing code path uses 0..1, the formula needs scaling. Implementation step 1: read existing usages in `economyEngine.ts:308-313`.
3. **`getCityKeyFromVenueId` empty-string:** The fallback path is tested (§8.8). The existing `warnedMalformedVenueIds` log will fire once per malformed ID; that's acceptable noise.
