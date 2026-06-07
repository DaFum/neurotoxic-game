# Neurotoxic Codebase Audit — Categorized Findings Report

**Scope:** all of `src/` (excluding `node_modules`, `dist`; `tests/` checked only for orphan references).
**Mode:** read-only audit. No files were modified.
**Method:** symbol-graph mining (`symbols.json` `usedBy`/`dependencies`), ripgrep verification of every claim, and chain-tracing (action type → reducer case → action creator → dispatch-hook wrapper → component) for integration questions.

## Executive Summary

The codebase is in notably good shape against its own conventions. The audit found **no genuinely dead code, no unreachable branches, no orphaned/unwired features, and no i18n key drift**. The actionable findings are concentrated in two areas:

1. **HIGH — Re-implemented canonical helpers.** The `typeof x === 'number' && Number.isFinite(x)` idiom is hand-inlined at ~40+ payload/sanitizer boundaries instead of using the mandated shared `isFiniteNumber`/`finiteNumberOr`. This is the single highest-leverage cleanup and is explicitly flagged by `AGENTS.md`.
2. **HIGH — Documentation drift.** `AGENTS.md`/`CLAUDE.md` point agents to `src/utils/gameStateUtils.ts` for `finiteNumberOr`, but it actually lives in `src/utils/finiteNumber.ts`. This will keep misdirecting future fix passes.

Everything else is LOW/MED: a prototype-pollution check re-spelled inline in 3 places, one hardcoded `€` in a locale string, one `||`-vs-`??` edge case, and ~50 unnecessary `export` keywords on same-file-only helpers.

---

## 1. DUPLICATES

### 1.1 Inline `typeof x === 'number' && Number.isFinite(x)` — RE-IMPLEMENTED UTILITY  `[HIGH]`
Canonical helpers exist at `src/utils/finiteNumber.ts:12` (`finiteNumberOr`) and `:21` (`isFiniteNumber`), re-exported via `src/utils/gameState/index.ts:7`. The literal expression is hand-inlined at 40+ sites — exactly the anti-pattern `AGENTS.md` calls out ("Payload sanitizers must use `Number.isFinite(v)` … Prefer the shared `finiteNumberOr` helper"). Highest-value reducer/sanitizer hotspots:
- `src/context/reducers/systemReducer.ts:168,185,235,461,472,768,919,963,1146,1220` (12+ occurrences)
- `src/context/reducers/bandReducer.ts:76,411`
- `src/context/reducers/assetSanitizers.ts:442`
- `src/context/actionCreators.ts:115,123,159`
- `src/utils/saveValidator.ts:258`
- `src/utils/audio/songUtils.ts:33`, `src/utils/audio/gigPlayback.ts:118,209`, `src/utils/audio/midiPlayback.ts:189`
- plus `GigModifiersBlock.tsx`, `RoadieTrafficManager.ts`, `DetailedStatsTab.tsx`, `LeaderboardTab.tsx`, `rhythmUtils.ts`, `gameState/delta.ts`, `brandOfferFlavor.ts`

**Action:** MERGE into `isFiniteNumber(x)` / `finiteNumberOr(x, fallback)`. Sites combining extra conditions (`&& v >= 0`) become `isFiniteNumber(v) && v >= 0`.

### 1.2 Prototype-pollution triad re-implemented inline — RE-IMPLEMENTED UTILITY  `[MED]`
Canonical set `FORBIDDEN_KEYS` + `isForbiddenKey` live at `src/utils/objectUtils.ts:9-21`. Three sites re-spell the membership test as a hardcoded three-way `Object.hasOwn(obj,'__proto__') || …'constructor' || …'prototype'`:
- `src/utils/gameState/checks.ts:50-56` (`hasForbiddenKeys`)
- `src/utils/gameState/delta.ts:156-160` (`copyFilteredProperties`)
- `src/utils/saveValidator.ts:112-119` (`checkPrototypePollution`)

Risk: if a key is ever added to `FORBIDDEN_KEYS`, these three triads silently drift out of sync. Other files (`translationUtils.ts:52`, `catalogEffectUtils.ts`, `assetSanitizers.ts:145`) correctly use `isForbiddenKey`.
**Action:** EXTRACT a `hasForbiddenOwnKeys(obj)` helper in `objectUtils.ts` derived from `FORBIDDEN_KEYS`; have all three sites call it.

### 1.3 `stripHostileKeys` vs `sanitizeTraversableValue` — NEAR-DUPLICATE  `[LOW]`
- `src/context/reducers/assetSanitizers.ts:142-149` — local `stripHostileKeys` (shallow, type-preserving, uses `isForbiddenKey`).
- `src/utils/objectUtils.ts:92-138` — `sanitizeTraversableValue` (canonical, recursive).

Overlapping intent, divergent depth. Defensible specialization (shallow + type-preserving hot path).
**Action:** Leave as-is or add a cross-reference comment; not worth merging. Reported for completeness.

### Verified NOT duplicates (false alarms)
- `isOnCooldown` (`eventEngine/eventEngineCore.ts:92`) is a deliberate alias re-export of `gameState/checks.ts:110` — not a duplicate.
- Currency formatting is centralized in `numberUtils.ts` (`formatCurrency`/`formatNumber`); other formatters delegate.
- RNG is centralized in `crypto.ts` (`secureRandom`); the only `Math.random()` calls are documented fallbacks inside `crypto.ts`.
- `calculateDistance` (logistics) vs inline `Math.sqrt` in `mapGenerator.ts` operate on different domains — coincidental.

---

## 2. ORPHANED / UNINTEGRATED CODE

**Bottom line:** After ripgrep-verifying all **74** symbol-graph candidates, there are **ZERO true dead-code orphans**. Every candidate is integrated — wired into a same-file call site, an in-file dispatch table, a lazy/dynamic import, or an internal helper chain. The graph flagged them only because they lack a *cross-file importer*. **False positives: 74 / 74.** No DELETE actions warranted.

The one durable pattern worth surfacing is **over-export surface**: ~50 symbols carry an `export` keyword that no other module imports (same-file use only). Not dead code — orphaned *exports*. `[LOW]` cosmetic API-surface tightening; **verify no test imports each before removing `export`** (several reducer/util helpers appear exported specifically for unit tests, a legitimate reason to keep them).

Representative over-exported clusters (drop `export` or confirm test usage):
- `src/context/reducers/bandReducer.ts:45,179,213,425,618,670` — handlers invoked only by same-file switch (718–741); likely test-only exports.
- `src/hooks/useAudioControl.ts:24,53,80,163`; `src/hooks/useGigEffects.ts:20,46,92`; `src/hooks/minigames/useTourbusLogic.ts:45,47,49,58`; `src/hooks/minigames/useAmpLogic.ts:108`.
- `src/utils/assetConfig.ts:52,57,62,69`; `src/utils/contrabandUtils.ts:10,12,14,20,73,100`; `src/utils/purchaseLogicUtils.ts:236,255,293,410,495,529,667`; `src/utils/audio/{cleanupUtils,drumMappings,instruments,playbackUtils}.ts`; `src/utils/{brandOfferFlavor,chartDensity,loanProfiles,merchUtils,rhythmGameInputUtils,socialEngine,storage,travelUtils}.ts`.

**Intentional public-API / config surface — KEEP exported (do not touch):**
- `DealsPhase` (`postGig/DealsPhase.tsx:77`) — lazy-imported in `PostGig.tsx:16` (pure graph blind spot).
- `buildDiyTier` (`assetConfig.ts:124`), `QuestProgress` (`questProgress.ts:455`), `getInstalledModules` (`assetSelectors.ts:88`), `ALL_HQ_ITEMS` (`hqItems.ts:735`) — all named as sanctioned entry points in AGENTS.md/nested AGENTS.md.
- `Logger` class (`logger.ts:33`) — AGENTS.md mandates preserving public API on exported classes.
- `initGlobalErrorHandling` (`errorHandler.ts:470`) — self-invokes as a module side-effect (line 507).

---

## 3. INCONSISTENCIES

### State clamps — CLEAN
Every arithmetic-then-clamp site for `mood`/`stamina` wraps the persisted addend with `finiteNumberOr(...)` or guards with `isFiniteNumber` first (verified: `bandReducer.ts:133/142/567-571`, `minigameReducer.ts:134`, `clinicReducer.ts:162-166`, `assetTicks.ts:108-118`, `gameState/delta.ts:360-364/677-684`, `postGig/socialResolution.ts:243-252`, `travelUtils.ts:306-309`, `purchaseLogicUtils.ts:624-648`, `dailyTickLogic.ts:253-299`, `arrivalUtils.ts:183-187`, `systemReducer.ts:954-955`). The occasional raw `staminaMax` cap arg is the clamp ceiling, not the addend — not a violation.

### Sanitization — CLEAN
No `typeof v === 'number'` used as a numeric-state sanitizer without a paired `Number.isFinite`. Remaining bare `typeof x === 'number'` hits (`systemReducer.ts:276/290/319/457/518`, `gameState/delta.ts`) are structural value-copy routines preserving `string|number|boolean|null` verbatim — they never feed arithmetic-then-clamp. (See §1.1 for the *style* duplication of the paired idiom.)

### i18n EN/DE drift — KEYS IN SYNC
Deep flattened-key diff across all 10 namespaces (`assets, chatter, economy, events, items, minigame, traits, ui, unlocks, venues`) found **zero** keys present in one locale but missing in the other.

One hardcoded-`€` violation `[MED]`:
- `public/locales/en/items.json:105` — `"hq_room_label.description": "Immediate +500€ bonus."`
- `public/locales/de/items.json:105` — `"hq_room_label.description": "Sofort +500€ Bonus."`
Violates "do not hardcode `€` in locale JSON; format via `formatCurrency`." Static description, not a `{{amount}}` template, so it bypasses locale-aware formatting (EN user gets German-style trailing `500€`). Locales are at least mutually consistent.
**FIX:** convert to a `{{amount}}` template; inject `formatCurrency(500, i18n.language, 'always')` at render.

### Colors — CLEAN
`#[0-9a-fA-F]{3,6}` in `src/**/*.{ts,tsx}` hits only `src/utils/brandColors.ts` (the SoT) plus one issue-reference comment (`src/data/events/crisis.ts:614` `#1234`). No invented aliases (`--color-void`, `--color-blood`, `--color-toxic-red`). Inline SVG/Pixi fallbacks derive from `BRAND_COLOR_HEX` (`useOverworldUrls.ts:21`).

### `||` vs `??` — ESSENTIALLY CLEAN
- `[LOW]` `src/utils/economy/logisticsLogic.ts:149`: `const bandSize = bandState?.members?.length || 3`. An empty-array band (`.length === 0`) substitutes `3`, overstating cost. Degenerate in practice. **FIX (optional):** `?? 3` plus explicit empty-array handling.
- All other `||` hits are boolean conditionals, sanctioned post-`Number()` fallbacks (`Number(x) || 0`), or reads where the default equals the nullish value (`x || 0` with `0 || 0 === 0`) — not violations.

### Currency/locale — CLEAN
Every `formatCurrency(...)` passes a locale (`i18n.language` singleton in reducers; `useTranslation().i18n.language` in `PreGigHeader.tsx:45`). No undefined-locale calls → no English currency baked for German users.

### Action-creator sanitization — CLEAN
Action creators normalize raw numeric fields before dispatch (`Number(x) || 0` + canonical clamps in `actionCreators.ts:570-571,790-802,876-880`); reducers re-clamp independently.

---

## 4. DEAD / UNREACHABLE CODE

**None found.** Cross-checks:
- **Action types ↔ reducer cases ↔ creators:** all 64 `ActionTypes` (`src/context/actionTypes.ts`) appear ≥3× across `src/context/` (type + handler + creator). No reducer case for a non-existent type; no type lacking handler/creator. `bandReducer.ts` `default` uses `assertNever` (statically unreachable by exhaustive union — correct/intentional).
- **`ASSET_FORECLOSED`** dispatched by `assetActionCreators.ts:575`, handled in `gameReducer.ts:194`.
- **Feature flags / `false &&` / `DISABLED`:** none permanently off. All conditional guards are legit `import.meta.env.DEV` dev-tool gates (`App.tsx:129`, `SettingsPanel.tsx:66`, `SetlistBlock.tsx:196`) or real runtime checks (`Gig.tsx:80`).
- **NeuroDecimator toggle** (`HUD.tsx:308`) renders only when `band.inventory.neuroDecimator` is truthy; the item is purchasable (`hqItems.ts:13`) — reachable.

---

## 5. MISSING INTEGRATION

**None found.** Every symbol-graph orphan candidate was traced end-to-end and confirmed fully wired. The graph's blind spot was the dispatch-hook indirection layer in `src/context/useGameDispatchActions.ts`, which re-exports each action creator as a `useCallback` wrapper consumed by plain name. Verified chains:

- **`handleUseContraband`** → `USE_CONTRABAND` case → `createUseContrabandAction` (`actionCreators.ts:848`) → `useContraband` wrapper (`useGameDispatchActions.ts:536`) → `useContrabandStash.ts:58` → `ContrabandStash` in `OverworldModals.tsx:65`.
- **`handleToggleNeuroDecimator`** → `toggleNeuroDecimator` (`actionCreators.ts:178`) → wrapper (`useGameDispatchActions.ts:315`) → `HUD.tsx:312` onClick.
- **`handleCraftItem`** → `CRAFT_ITEM` → `createCraftItemAction` (`actionCreators.ts:755`) → `craftItem` wrapper → `BandHQContentArea.tsx:118` → `DetailedStatsTab.tsx:714` onClick.
- **Contraband system** (`contrabandUtils.ts`): `pickRarity`/`pickRandomContrabandByRarity` feed `pickRandomContraband` → `minigameReducer.ts:213`; `BUST_CHANCE_BY_RARITY` → `computeStashBustRisk` → `data/events/transport.ts:2`.
- **`useDarkWebLeak`/`usePirateRadio`/`useMerchPress`/`useBloodBank`/`useContrabandStash`** → `useOverworldModals.ts` → `Overworld.tsx:63` → `OverworldModals.tsx` (configs `DARK_WEB_LEAK_CONFIG`/`PIRATE_RADIO_CONFIG` flow through).
- **`calculateViralityScore`** → `checkViralEvent` (`socialEngine.ts:427`) → `postGig/socialResolution.ts:178`.
- **Crafting recipes** → `getCraftingRecipe`/`CRAFTING_RECIPES` → `DetailedStatsTab.tsx:689`.
- **`VENUE_CHATTER_DB`** → `VENUE_CHATTER_LOOKUP` → `chatter/index.ts:78` → `getRandomChatter` → `useChatterLogic.ts:83` → `ChatterOverlay.tsx:268`.
- **Tutorial** (`TUTORIAL_STEPS`) → `TutorialManager.tsx:57` → `App.tsx:128`.
- **`useGigEffects`** (`calculateChaosStyle`/`playBandMemberAnimation`/`applyChaosJitter`) → internal → `Gig.tsx:63`.

---

## 6. DOCUMENTATION DRIFT (bonus — affects every future fix pass)  `[HIGH]`

`AGENTS.md` and `CLAUDE.md` repeatedly state `finiteNumberOr` lives in **`src/utils/gameStateUtils.ts`** ("wrap the persisted addend with `finiteNumberOr(value, fallback)` from `src/utils/gameStateUtils.ts`"). In reality:
- `finiteNumberOr`/`isFiniteNumber` are defined in **`src/utils/finiteNumber.ts:12,21`** and re-exported via `src/utils/gameState/index.ts:7`.
- `src/utils/gameStateUtils.ts` exists but contains **no reference** to them (verified: grep returns nothing).
- All real call sites import from `finiteNumber.ts` (e.g. `eventEngine/eventEngineCore.ts:41`, `eventEngine/helpers.ts:8`).

This misdirects agents searching for the canonical helper.
**FIX:** update the AGENTS.md/CLAUDE.md references to `src/utils/finiteNumber.ts`, or add a re-export from `gameStateUtils.ts` if that path is meant to be canonical.

---

## Priority-Ordered Fix Queue

| # | Sev | Finding | Action |
|---|-----|---------|--------|
| 1 | HIGH | §1.1 Inline `typeof+Number.isFinite` at 40+ sanitizer sites | MERGE → `isFiniteNumber`/`finiteNumberOr` |
| 2 | HIGH | §6 Docs point to wrong file for `finiteNumberOr` | FIX docs (or add re-export) |
| 3 | MED | §1.2 Prototype-pollution triad inlined in 3 files | EXTRACT `hasForbiddenOwnKeys` from `FORBIDDEN_KEYS` |
| 4 | MED | §3 Hardcoded `+500€` in `items.json` (EN+DE :105) | FIX → `{{amount}}` + `formatCurrency` |
| 5 | LOW | §3 `members?.length || 3` empty-array edge | `?? 3` |
| 6 | LOW | §1.3 `stripHostileKeys` near-dup | cross-ref comment (optional) |
| 7 | LOW | §2 ~50 unnecessary `export` keywords (same-file only) | NARROW export after confirming no test import |

*No DELETE actions are warranted: there is no genuinely dead, unreachable, or unwired code in `src/`.*
