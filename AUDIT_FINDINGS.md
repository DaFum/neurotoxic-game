# Neurotoxic — Code-Quality Audit Findings (Resolved)

Scope: `src/` production code plus locale JSON where the original audit covered i18n strings.

Last refreshed: 2026-06-03. **Status: all findings below have been resolved.**

Verification after fixes: `typecheck:core`, `typecheck` (reducer gate), `test:node`, `test:vitest:node`, `test:vitest:ui`, `test:locale:full`, the `tests/security` suite, and `symbols:check` all pass. (One pre-existing, unrelated failure remains in `tests/node/questSystem.test.js` → "every QuestEventType is accepted as canonical progress event"; it reads `src/types/quest.d.ts` and fails independently of these changes — confirmed by stashing all `src/` edits.)

---

## 1. DUPLICATES — RESOLVED

**1.1 Prototype-pollution key set defined 4+ times** — **MERGED**

All copies now route through the canonical `FORBIDDEN_KEYS` / `isForbiddenKey` in `src/utils/objectUtils.ts`:

- `src/context/actionCreators.ts` — local `HOSTILE_KEYS` removed; all 5 call sites use `isForbiddenKey`.
- `src/context/reducers/assetSanitizers.ts` — local `HOSTILE_KEYS` removed; `stripHostileKeys` uses `isForbiddenKey`.
- `src/utils/saveValidator.ts` — local `BANNED_KEYS` removed; both iterating checks use `isForbiddenKey` (the explicit own-property `Object.hasOwn` checks for non-enumerable keys are kept — they are a distinct, intentional mechanism).
- `src/utils/eventEngine.ts` — inline regex (`:119`, kept case-insensitive via `key.toLowerCase()`) and literal check (`:134`) use `isForbiddenKey`.
- `src/utils/errorHandler.ts` — redundant `shouldSkipKey` removed entirely; `sanitizeTraversableValue` already strips `FORBIDDEN_KEYS` internally.

**1.2 `clampCondition` re-implemented `clamp0to100`** — **MERGED**

`src/context/reducers/assetSanitizers.ts` no longer defines a local `clampCondition`; asset condition now uses canonical `clamp0to100` (consistent with `clampVanCondition`, which also delegates to `clamp0to100`).

---

## 2. ORPHANED / UNINTEGRATED EXPORTS — RESOLVED

- **Quest-id constants** (`src/data/questsConstants.ts`) — `QUEST_PICK_OF_DESTINY`, `QUEST_VIRAL_DANCE`, `QUEST_SPONSOR_DEMAND`, `QUEST_HARMONY_PROJECT`, `QUEST_LOCAL_LEGEND` are now imported and used in `src/data/events/quests.ts` (the random-quest producer) in place of hardcoded strings, matching the imported sibling story-quest constants.
- **`BrandColorName`** (`src/utils/brandColors.ts`), **`CatalogEffect`** (`src/types/components.d.ts`), **`clearCache`** (`src/utils/unlockManager.ts`) — intentionally retained as public surface / test helper per the chosen "wire quest consts only" scope; not deleted.
- **`getSafeStorageItem` / `setSafeStorageItem`** — now adopted in production (see §4).

---

## 3. INCONSISTENCIES — RESOLVED

### 3.1 State clamps — raw persisted numbers wrapped with `finiteNumberOr`

`src/context/reducers/minigameReducer.ts` now wraps every persisted addend at the arithmetic boundary (`finiteNumberOr` import added):

- `:99-103` — `player.money`, `van.fuel`, `van.condition`.
- `:115-118` — `hitMember.stamina` (fallback 0), `hitMember.staminaMax` (fallback 100).
- `applyPostMinigameResult` — `band.harmony`, `player.money`.
- roadie handler — `band.harmony`, `player.money`.

### 3.2 Payload sanitization — `Number.isFinite` / `finiteNumberOr`

- `src/context/reducers/minigameReducer.ts` amp-calibration: `voidResonance` / `purgesUsed` / `hijacksOverridden` now use `finiteNumberOr(..., 0)` (non-finite collapses to 0).
- `src/utils/postGigUtils.ts`: mood/stamina gates use `Number.isFinite`; the addends are additionally wrapped with `finiteNumberOr` so non-finite deltas cannot survive (also preserves TS narrowing of the aliased condition).

### 3.3 i18n — currency `{{amount}}` interpolation

Event option labels in `public/locales/{en,de}/events.json` (47 paired labels) now use a bare `{{amount}}` placeholder instead of a hardcoded `€` token (this also normalizes the `police_contraband` `-€200` → `{{amount}}` inconsistency).

The amount is sourced **deterministically from each option's effect** via the new `getOptionPreviewMoney` (`src/utils/eventEngine.ts`), formatted with `formatCurrency(value, lang, 'always')`, and injected per-option in `src/ui/EventModal.tsx`. Because label numbers were authored flavor text that did **not** always match the mechanical effect (e.g. `atm_fee_trap` label said `-10€` but the effect is `-25`; `damaged_merch_print` uses a dynamic `percentage_resource`), displayed amounts now reflect the actual mechanical/state-derived value. Options with no money effect fall back to a formatted `0`.

`public/locales/{en,de}/items.json` `hq_room_label.description` ("+500€ bonus") is left as static flavor text: its item effect is `unlock_hq` (no money effect to source), so there is no mechanical value to interpolate.

---

## 4. MISSING INTEGRATION — RESOLVED (with documented exceptions)

`getSafeStorageItem` / `setSafeStorageItem` (`src/utils/storage.ts`) are now the standard path for **JSON-typed value** storage and have production call sites:

- `src/hooks/useLeaderboardSync.ts` — last-synced-day get/set.
- `src/utils/audio/AudioManager.ts` — music/SFX volume and mute prefs (stored format unchanged: numbers/booleans are JSON-compatible with the previous `String()` writes; the e2e fixture `'0.42'` still reads correctly).
- `src/context/GameState.tsx` — injected-state load (screenshot testing path).

**Intentionally not converted** (the JSON get/set helpers are the wrong abstraction there, not "direct unsafe access"):

- `removeItem` calls (`GameState.tsx`, `usePersistence.ts`) — the helpers have no remove equivalent.
- `usePersistence.ts` save/load — needs the success boolean and i18n parse-error toasts that the helpers deliberately swallow; kept on the existing `safeStorage` wrapper.
- `unlockManager.ts` `getUnlocks` — relies on raw-string cache comparison the JSON helper can't provide.
- `GameState.tsx` inject-marker — raw `'true'` string semantics.

These all already go through the codebase's lower-level `safeStorage` / `safeStorageNoFallback` error-handling wrappers.
