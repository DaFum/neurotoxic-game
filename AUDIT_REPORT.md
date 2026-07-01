# Neurotoxic Codebase Audit — Categorized Findings

**Scope:** `src/` (671 source files, 1726 exported symbols). Read-only audit; no files modified.
**Method:** Regenerated `symbols.json` for usage graph, then four parallel category sweeps, each verifying every claim with ripgrep. Two concrete findings spot-checked directly by the lead.
**Date:** 2026-07-01 · **Branch:** `claude/neurotoxic-audit-o1k4n5`

## Executive summary

The codebase is unusually disciplined. The canonical-helper conventions in AGENTS.md/CLAUDE.md (`finiteNumberOr`, `formatCurrency`, `clamp*` family, `BRAND_COLOR_HEX`, `getRegionKeyForLocation`, `getTotalDailyObligations`) are consistently honored across 60–100+ call sites each, and the reducer layer is structurally protected against dead code by a type-checked dispatch table + `assertNever`.

**Actionable findings: 6** (0 HIGH, 4 MED, 2 LOW). No orphans, no missing integration, no dead code.

| # | Category | Severity | Location | Action |
|---|----------|----------|----------|--------|
| 1 | Inconsistency (sanitization) | MED | `eventEffectHandlers.ts:154` | FIX |
| 2 | Re-implemented util | MED–HIGH | `gigReducer.ts:36,286` | MERGE |
| 3 | Re-implemented util | MED | `minigameReducer.ts:449` | MERGE |
| 4 | Near-duplicate | MED | `toastSanitizers.ts:54` / `stateSanitizers.ts:126` | MERGE |
| 5 | Re-implemented util | LOW–MED | quest producers (7 sites) | MERGE |
| 6 | Inconsistency (latent) | LOW | `numberUtils.ts:67` | FIX (hardening) |

---

## 1. DUPLICATES

### 1a. Exact duplicates
**None of consequence.** The one candidate — `safeStorageOperation` (`src/utils/storage.ts:32`) vs `runSafeStorageOperation` (`src/utils/errors/safeStorage.ts:17`) — is a deliberate thin shim that delegates to the canonical implementation, not a copy.

### 1b. Near-duplicates (drift risk)

**[MED] Two primitive-record sanitizers with divergent semantics**
- `sanitizePrimitiveOptions` — `src/context/reducers/toastSanitizers.ts:54`
- `copySafePrimitiveObject` — `src/context/reducers/sanitizers/stateSanitizers.ts:126`

Both strip forbidden/prototype keys and keep only `string|number|boolean|null`, but differ in loop style (`Object.entries` vs `for..in`+`Object.hasOwn`) and empty-return semantics (`{}` vs `undefined`). Two independent implementations of the same security-sensitive operation will drift.
**Action: MERGE** into one shared `sanitizePrimitiveRecord`; make the empty-return contract explicit per caller.

*(Investigated and cleared as intentional, not duplicates: `clampUnit` vs `clampUnitRandom` — different contracts; `clampUnitRandom` caps at `0.9999…` exclusive for RNG index math and must NOT be unified.)*

### 1c. Re-implemented utilities (canonical helper exists but is re-coded inline)

**[MED–HIGH] `clampReputation` re-implemented in `gigReducer.ts`** — canonical `clampReputation` at `src/utils/gameState/clamps.ts:115`.
`gigReducer.ts:36-37` defines local `MIN_REPUTATION = -100` / `MAX_REPUTATION = 100` and inlines the bound math at `gigReducer.ts:286-333` (`Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, …))`). The reputation range now has two independent definitions that can drift; `src/domain/questEffects.ts:26` already correctly uses the canonical helper.
**Action: MERGE** — replace inline math with `clampReputation`, drop the local constants. (Verified confirmed by direct read.)

**[MED] `clamp0to100` re-implemented in `minigameReducer.ts:449`** — canonical at `src/utils/gameState/clamps.ts:104`.
`Math.max(0, Math.min(finiteNumberOr(score, 0), 100))` is exactly `clamp0to100(finiteNumberOr(score, 0))`. The file already imports sibling helpers from `'../../utils/gameState'`.
**Action: MERGE** (`clamp0to100` additionally floors, which is desirable here).

**[LOW–MED] Inline `sanitizeStringArray` filter re-implemented in quest producers** — canonical at `src/context/reducers/sanitizers/stateSanitizers.ts:121`.
The exact guard `(entry): entry is string => typeof entry === 'string'` is hand-written at 7 sites: `socialQuestEvents.ts:16,59,77,98,118`, `venueQuestEvents.ts:60,81`, `minigameQuestEvents.ts:22`, `assetQuestEvents.ts:61`.
**Action: MERGE** — wrap the fixed tuples with `sanitizeStringArray([...])`.

---

## 2. ORPHANED / UNINTEGRATED CODE

**Result: NONE.** All 33 exports flagged by the symbol index as having no cross-file `usedBy` were verified with ripgrep and are **false positives** — each is consumed same-file (empty `usedBy` but truthy `referencedInFile`, exactly the caveat documented in AGENTS.md) or re-exported through a consumed barrel.

Notable cluster investigated: the five `rhythmGameLoopUtils.ts` exports (`handleOverlayPause/Resume`, `processToxicMode/CorruptionBurst/MissedNotes`) are **not** an unwired subsystem — all are called by `processRhythmGameTick` in the same file (lines 269–329), which `src/hooks/rhythmGame/useRhythmGameLoop.ts:11` drives in the live gig loop. They are exported only for unit testing.

Other verified-live chains: `BrutalistFilter`→ToxicFilterManager→GigView; `handleToggleNeuroDecimator`→`TOGGLE_NEURO_DECIMATOR`→HUD; crafting guards→`getCraftingRecipe`→`CRAFT_ITEM`; `TUTORIAL_STEPS`/`TOTAL_STEPS`→`useTutorial`→`TutorialManager`; `buildDrumKit`/`createLayeredSnare`→instrument/midi playback.

*(Cosmetic only: exported-for-test helpers could carry a `@internal`/test-only doc note to reduce future index false positives.)*

---

## 3. INCONSISTENCIES

### 3a. State clamps — CLEAN
~75 arithmetic-then-clamp sites audited across all reducers, `src/utils`, `src/domain`, hooks. Every persisted addend is wrapped with `finiteNumberOr(value, fallback)`. No field found clamped-with-wrap in one reducer and without in another.

### 3b. Sanitization

**[MED] `item` effect handler skips the finite-number guard its siblings use** — `src/utils/eventEngine/eventEffectHandlers.ts:154-159` (confirmed by direct read).
```ts
if (typeof eff.value === 'number') {                      // bare typeof — lets NaN / Infinity through
  const current = typeof delta.band.inventory[eff.item] === 'number'
    ? delta.band.inventory[eff.item] : 0
  delta.band.inventory[eff.item] = asNumber(current) + eff.value   // raw addend, not asNumber()
}
```
Every other handler in the same registry (`resource`, all `stat` branches, `stat_increment`, `cooldown`) routes the payload through `asNumber(eff.value)` (= `finiteNumberOr(value, 0)`). Only `item` uses a bare `typeof === 'number'` and adds a raw `+ eff.value`, so an event effect with `value: NaN`/`Infinity` corrupts the persisted inventory count. Violates the AGENTS.md payload-safety rule (use `Number.isFinite` / `finiteNumberOr`, never bare `typeof`).
**Action: FIX** — gate with `Number.isFinite(eff.value)` and add via `asNumber(eff.value)`.

*Verified CLEAN:* `stateSanitizers.ts`, `toastSanitizers.ts`, `settingsSanitizer.ts`, `saveValidator.ts` all pair `typeof` with `Number.isFinite`. The **fame/fameLevel pairing rule** is honored everywhere (`actionCreators.ts:127`, `playerReducer.ts:48`; all fame writes recompute `fameLevel` via `calculateFameLevel`).

### 3c. i18n locale parity — CLEAN
Recursive flattened key-set diff of `public/locales/en/*.json` vs `de/*.json`: same namespace files, **no missing keys** in either direction, **no hardcoded `€`** in any value (templates use bare `{{amount}}`).
Only hardcoded user-facing string found: `NEUROTOXIC` game title in `src/scenes/mainmenu/MainMenuHeader.tsx:31` — **[LOW] likely intentional brand element**; wrap in i18n or mark non-translatable if you want strictness.

### 3d. Hardcoded colors — CLEAN
`BRAND_COLOR_HEX` (`src/utils/brandColors.ts`) is the sole hex source. `stageRenderUtils.ts` derives `PIXI_TOKEN_FALLBACKS` from it; `OverworldMap.tsx` has no hex literals. No invented aliases (`--color-void`, `--color-blood`, `--color-toxic-red`). `0x…` literals are RNG seeds, not colors.

### 3e. `||` vs `??` — CLEAN
All `|| 0` numeric-state sites follow the sanctioned post-`Number()` exception (NaN must collapse) or use a fallback equal to the falsy value. No `field || nonZeroDefault` where a legitimate `0`/`''`/`false` would be clobbered.

### 3f. Toast currency language arg — CLEAN
All ~60 `formatCurrency(...)` sites pass a real language: non-component files use the `i18n` singleton (`i18n.language`); components use `useTranslation()` or a threaded `language` prop.

**[LOW] Latent footgun** — `formatCurrency` (`src/utils/numberUtils.ts:67`), `generateEffectText`, `formatSignedFinancialAmount` default `language = 'en'`. No current caller omits it, but a future omission bakes English currency silently with no type error.
**Action: FIX (hardening)** — make the language parameter required.

---

## 4. DEAD / UNREACHABLE CODE

**Result: NONE.** Verified across all six sub-classes:
- **Reducer cases for stale action types:** none. The root reducer (`gameReducer.ts:129`) is a type-checked dispatch table `ReducerMap = { [K in HandledActionTypes]: ReducerEntry<K> }`; a missing handler is a compile error. All 60 `ActionTypes` entries have a definition, a handler, and a dispatching creator; band actions close their switch with `assertNever` (`bandReducer.ts:748`).
- **Impossible conditionals:** no `if (false)`/`if (true)`. All `=== true/false` checks are legitimate narrowing of untrusted save-state booleans.
- **Permanently-off flags:** no feature-flag module; only `import.meta.env.DEV` gates around genuine dev tooling (`DebugLogViewer`, chart-debug readout).
- **Unreachable-after-return/throw:** none.
- **Impossible switch defaults:** all are intentional `assertNever` exhaustiveness guards.
- **No-op functions:** all legitimate (e.g. `handleAssetFailedAction` identity for `*_FAILED` actions is the documented "second defense" pattern; abstract base stubs; unsubscribe fallbacks).

*Cleared, not dead:* deprecated numeric overload of `checkViralEvent` (`socialEngine.ts:402`) is still exercised by tests; "legacy" arrival failsafe in `useHandleNodeArrivalCallback.ts:36` is a deliberately retained safety net. Retiring either is a separate deliberate API-cleanup decision, not a dead-code deletion.

---

## 5. MISSING INTEGRATION

**Result: NONE.** The action-type ↔ reducer ↔ action-creator ↔ UI surface is complete and, for non-band actions, statically enforced by the mapped `ReducerMap` type. Spot-checked the systems most prone to being built-but-unwired and all reach a live caller: rival-band system (`Overworld.tsx:50`, `useArrivalLogic.ts:146`), pending-modal setters (`setPendingRiskEvent`/`setPendingSupplyStopInventory`/`setPendingBandHQOpen`), crafting (`BandHQContentArea.tsx:118` → `CraftingSection`), and drum-kit audio (`buildDrumKit` → `midiPlayback.ts`). Data tables (`CRAFTING_RECIPES`, `QUEST_REGISTRY`, `hqItems/gear.ts`) are all read by live consumers.

---

## Recommended fix order for the autonomous pass

1. **`gigReducer.ts` reputation clamp → `clampReputation`** (drop local MIN/MAX) — highest drift risk. `[MERGE]`
2. **`eventEffectHandlers.ts:154` `item` handler → `Number.isFinite` + `asNumber(eff.value)`** — payload-safety correctness. `[FIX]`
3. **`minigameReducer.ts:449` → `clamp0to100`** `[MERGE]`
4. **Reconcile the two primitive-record sanitizers** into one shared helper. `[MERGE]`
5. **Collapse the 7 inline string-array filters** in quest producers into `sanitizeStringArray`. `[MERGE]`
6. **Make `formatCurrency` language param required** (latent-footgun hardening). `[FIX]`
