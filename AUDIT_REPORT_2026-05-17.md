# Neurotoxic — Codebase Audit Report

**Branch:** `claude/audit-neurotoxic-codebase-omBf3`
**Date:** 2026-05-17
**Scope:** `src/` (audio, components, context/reducers, data, hooks, scenes, schemas, types, ui, utils); spot-check of `tests/` and `public/locales/`.
**Method:** Four parallel `Explore` agents using ripgrep verification. No files modified.

Severity legend: **HIGH** = correctness bug / convention violation with real impact · **MED** = code-health debt · **LOW** = nit but worth fixing.

Action legend: **FIX** · **DELETE** · **MERGE** · **INTEGRATE** · **DOCUMENT**.

---

## 1. DUPLICATES

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| D1 | HIGH | `src/utils/economyEngine.ts:391–405` vs `src/utils/mapGenerator.ts:62` (`getVenueCoord`) | Distance / coordinate-fallback logic re-implemented in economyEngine when a utility already exists in mapGenerator. | MERGE — call `getVenueCoord` from economyEngine. |
| D2 | MED | `src/utils/postGigUtils.ts:60–61` & `src/utils/gameStateUtils.ts:175–178` | Inline `toNumber(v, 0)` finite-check repeated. | MERGE — add `toNumberOrDefault()` in `numberUtils.ts`. |
| D3 | MED | `src/utils/postGigUtils.ts:293–298` & `:534–536` | Money-delta before/after pattern duplicated in same file. | MERGE — extract `calculateMoneyDelta()`. |
| D4 | MED | `src/ui/PirateRadioModal.tsx`, `src/ui/MerchPressModal.tsx` vs `src/ui/shared/Modal.tsx` | Two modals hand-roll their own layout instead of using shared `Modal` (used by `BloodBankModal`, `DarkWebLeakModal`). | MERGE — switch to shared `Modal`. |
| D5 | MED | `src/context/actionCreators.ts:519–547` (`_toSafeInt`) | Inline helper duplicates `clampNonNegative` semantics with an extra `Math.floor`. | MERGE — add `clampToNonNegativeInt()` util and reuse. |
| D6 | MED | Action creators (pirate broadcast, dark web leak, blood bank, merch press) vs equivalent reducer handlers | Same numeric fields parsed/clamped twice. Per AGENTS.md the dual layer is intentional, but each site uses ad-hoc checks. | DOCUMENT + consolidate per-field helper. |
| D7 | LOW | Modal selector blocks across `BloodBankModal`, `PirateRadioModal`, `DarkWebLeakModal`, `MerchPressModal`, `SupplyStopModal`, `QuestsModal` | Each independently calls `useGameSelector` for the same `{player, band, social}` slice. | OPTIONAL — extract `useModalGameState()`. |
| D8 | LOW | `src/components/postGig/financialColors.ts` | Utility-style file under `components/`. | MOVE to `src/utils/`. |

## 2. ORPHANED / UNINTEGRATED CODE

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| O1 | LOW | `src/utils/eventEngine.ts:173–174` (`HARMONY_DEATH_SPIRAL_THRESHOLD`, `HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR`) | Exported but zero external usages. | DELETE the `export` keyword. |
| O2 | LOW | `src/utils/gameStateUtils.ts:23` (`isStashEntry`) | One external consumer (`useBandHQLogic`); monitor. | NONE. |
| O3 | MED | `src/context/actionCreators.ts:234–250` (`createSetLastGigStatsAction.toastId`) | Injected `toastId` field is never read. | DELETE unused field. |

No orphan components, hooks, scenes, types, or test files found.

## 3. INCONSISTENCIES (vs AGENTS.md)

### 3a. `||` vs `??` for numeric state (HIGH — real bugs when value is `0`)

| # | Sev | File:Line | Expression | Action |
|---|-----|-----------|------------|--------|
| I1 | HIGH | `src/utils/postGigUtils.ts:238` | `social[result.platform] \|\| 0` | FIX → `??` |
| I2 | HIGH | `src/utils/postGigUtils.ts:307–308` | `(social[result.platform] \|\| 0) + totalFollowers` | FIX → `??` |
| I3 | HIGH | `src/utils/postGigUtils.ts:316` | `(social.loyalty \|\| 0) + (result.loyaltyChange \|\| 0)` | FIX → `??` on both |
| I4 | HIGH | `src/utils/economyEngine.ts:210, 292` | `context.controversyLevel \|\| 0` | FIX → `??` |
| I5 | HIGH | `src/ui/SupplyStopModal.tsx:42` | `(player.money \|\| 0)` | FIX → `??` |
| I6 | HIGH | `src/data/events/consequences.ts:250` | `(state.band?.harmony \|\| 0)` | FIX → `??` |
| I7 | HIGH | `src/data/events/quests.ts:119` | `(state.band?.harmony \|\| 0)` | FIX → `??` |
| I8 | HIGH | `src/utils/economyEngine.ts:502` | `(playerState?.money \|\| 0)` | FIX → `??` |
| I9 | LOW | `src/utils/economyEngine.ts:174` | `gigData.capacity \|\| 0` | FIX → `??` |

### 3b. Reducer / action-creator clamp discipline

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| I10 | MED | `src/context/reducers/socialReducer.ts:250, 253, 254` (`handleMerchPress`) | Raw `Math.max(0, …)` where canonical `clampNonNegative` is standard. | FIX |
| I11 | MED | `src/context/reducers/tradeReducer.ts:65` (`handleTradeVoidItem`) | `Math.max(0, Number(fameCost) \|\| 0)` — use `clampNonNegative` and `??`. | FIX |
| I12 | MED | `src/context/reducers/minigameReducer.ts:74–87` (`handleCompleteTravelMinigame`) | Incoming `damageTaken` / `itemsCollected` not validated before `calculateTravelMinigameResult()`. | FIX — `Number.isFinite` + `Array.isArray` guards. |
| I13 | LOW | `src/context/reducers/socialReducer.ts:165–166` (`handleUpdateSocial`) | Clamps `zealotry` but not `controversyLevel`. | FIX |
| I14 | LOW | `src/context/reducers/socialReducer.ts:202–205` (`handleAddVenueBlacklist`) | Hardcoded `loyalty >= 30` threshold. | FIX — extract `VENUE_DEFENSE_LOYALTY_THRESHOLD`. |
| I15 | LOW | `src/context/actionCreators.ts:155–163` (`toggleNeuroDecimator`) | `!!isActive` coercion is unreachable. | DELETE. |

### 3c. Currency / i18n

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| I16 | HIGH | `public/locales/{en,de}/ui.json` (3 entries each), `events.json` (~50 each), `economy.json` (3 each), `items.json` (1 each) | Hardcoded `€` glyphs in templates. CLAUDE.md mandates `formatCurrency(...)` baked at dispatch with `{{amount}}` placeholders only. | FIX — strip `€`, route through `formatCurrency`. |

EN/DE key parity is otherwise clean (all dynamic prefixes verified).

### 3d. Color / token discipline

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| I17 | MED | `src/hooks/rhythmGame/useRhythmGameState.ts:180, 188, 196` | Hardcoded hex fallbacks alongside `getPixiColorFromToken()` — should use `stageRenderUtils.ts` map. | FIX — token-only. |

## 4. DEAD / UNREACHABLE CODE

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| DC1 | MED | `src/utils/economyEngine.ts:168–170, 265, 611, 669` | Defensive `gigData = gigData \|\| {}` / `modifiers = modifiers \|\| {}` / `context = context \|\| {}` — parameters already have `= {}` defaults, so reassignments are unreachable. | DELETE. |
| DC2 | LOW | `src/utils/postGigUtils.ts:354–377` | `if (!deal) return {…}` guard inside a loop where deal presence is guaranteed by iteration source. | REFACTOR — lift lookup outside loop. |
| DC3 | LOW | `src/utils/eventEngine.ts:516–525` (`processEvent`) | `typeof event.condition !== 'function'` is caught by broad try/catch rather than guarded explicitly. | FIX — explicit pre-check outside try. |

No dead reducer cases or removed-action-type handlers found. Default branches use `assertNever`.

## 5. MISSING INTEGRATION

| # | Sev | File:Line | Finding | Action |
|---|-----|-----------|---------|--------|
| M1 | HIGH | `src/hooks/overworld/useSpawnRivalBand.ts`, `src/hooks/overworld/useRivalEscalation.ts` | Rival logic lives only in Overworld; not reachable from PostGig/events. | INTEGRATE — re-export from `hooks/overworld/index.ts` (consider lifting to root `hooks/`). |
| M2 | MED | `src/hooks/useNetworkStatus.ts` consumed in `src/ui/BandHQ.tsx:41` | Network status drives Leaderboard tab visibility but isn't lifted into `GameState`; mid-session changes desync other consumers. | FIX — wire into context-level listener (`state.isOnline`). |
| M3 | MED | `src/components/stage/{Base,Amp,Roadie,Tourbus}StageController.ts` | Four controllers with implicit minigame coupling; no factory/registry. | DOCUMENT or add `StageControllerFactory`. |

---

## Summary

| Category | HIGH | MED | LOW | Total |
|---|---|---|---|---|
| Duplicates | 1 | 4 | 3 | 8 |
| Orphans | 0 | 1 | 2 | 3 |
| Inconsistencies | 9 | 4 | 4 | 17 |
| Dead Code | 0 | 1 | 2 | 3 |
| Missing Integration | 1 | 2 | 0 | 3 |
| **Total** | **11** | **12** | **11** | **34** |

### Top priorities for the autonomous fix pass

1. **`||` → `??` sweep** (I1–I9): 9 sites where `0` is silently replaced — highest correctness payoff.
2. **Strip hardcoded `€` from locale JSON** (I16) — violates baked-currency contract.
3. **Delete dead defensive reassignments** in `economyEngine.ts` (DC1).
4. **Replace inline `Math.max(0, …)` with `clampNonNegative`** in `socialReducer`, `tradeReducer`, and `_toSafeInt` (I10, I11, D5).
5. **Validate `damageTaken` / `itemsCollected`** in `handleCompleteTravelMinigame` (I12).
6. **Merge re-implemented distance/coord helpers** (D1) and shared modal layout (D4).
7. **Decide on rival-hook integration surface** (M1).

All changes are localized; no architectural rework required.
