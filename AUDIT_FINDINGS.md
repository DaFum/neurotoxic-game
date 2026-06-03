# Neurotoxic — Unresolved Code-Quality Audit Findings

Scope: `src/` production code plus locale JSON where the original audit covered i18n strings. This refresh modified only this report; source and test files were not modified.

Last refreshed: 2026-06-03.

**Method note on rigor:** Findings below were re-checked against current source with targeted `rg` searches and local snippets. Entries from the previous report that no longer reproduce were removed, including quest-event producer integration, clinic stale-stat clamps, finite-number helper clones, contraband rarity integration, symbol-index alias metadata, and no-op confirmation sections.

---

## 0. Summary / triage

| Category | Severity | Headline |
|----------|----------|----------|
| Duplicate | **MED** | Prototype-pollution key set (`__proto__/constructor/prototype`) is still maintained in multiple copies. |
| Duplicate | **MED** | `clampCondition` still re-implements `clamp0to100`. |
| Orphan | **MED** | `BrandColorName` and `CatalogEffect` remain unused type exports. |
| Orphan | **LOW** | 5 quest-id constants remain unused while equivalent strings are hardcoded. |
| Orphan | **LOW** | `clearCache`, `getSafeStorageItem`, and `setSafeStorageItem` still have no production call sites. |
| Inconsistency | **MED** | `minigameReducer` still has raw persisted-number arithmetic before clamps. |
| Inconsistency | **LOW** | `minigameReducer` and `postGigUtils` still use bare `typeof === 'number'` gates where `Number.isFinite` is required. |
| Inconsistency | **MED** | Locale strings still bake hardcoded `€` amounts instead of interpolated `{{amount}}`. |
| Missing integration | **MED** | `safeStorage` get/set helpers remain unused while live code calls `localStorage` directly. |

---

## 1. DUPLICATES

### MED

**1.1 Prototype-pollution key set defined 4+ times (NEAR duplicate)** — **MERGE**

Canonical: `src/utils/objectUtils.ts:3` `FORBIDDEN_KEYS` + `isForbiddenKey` (`:8`).

- `src/context/actionCreators.ts:177` — `HOSTILE_KEYS = new Set(['__proto__','constructor','prototype'])`.
- `src/context/reducers/assetSanitizers.ts:119` — `HOSTILE_KEYS = ['__proto__','constructor','prototype']`.
- `src/utils/saveValidator.ts:107` — `BANNED_KEYS = new Set([...])`.
- Inline literal/regex checks remain at `src/utils/eventEngine.ts:119,134` and `src/utils/errorHandler.ts:210`.

Security-critical lists should share one helper so future key changes cannot miss a copy.

**1.2 `clampCondition` re-implements `clamp0to100` (RE-IMPLEMENTED util)** — **MERGE**

- `src/context/reducers/assetSanitizers.ts:134-137` `clampCondition` still does the same `NaN -> 0`, clamp `0..100` behavior as `src/utils/gameStateUtils.ts:196` `clamp0to100`.
- `src/context/reducers/assetSanitizers.ts:277` still calls the local helper even though the file imports canonical game-state utilities.

---

## 2. ORPHANED / UNINTEGRATED EXPORTS

Entries below were re-checked in current source and have no production call site beyond their defining file unless stated otherwise.

### MED — Unused type exports — **DELETE**

- `BrandColorName` — `src/utils/brandColors.ts:24` is exported but never referenced.
- `CatalogEffect` — `src/types/components.d.ts:401` is exported but never referenced. `CatalogInputEffect` is still used by nearby component types, so only `CatalogEffect` is listed here.

### LOW — Unused named quest-id constants — **FIX (use them) or DELETE**

`src/data/questsConstants.ts:6-10`: `QUEST_PICK_OF_DESTINY`, `QUEST_VIRAL_DANCE`, `QUEST_SPONSOR_DEMAND`, `QUEST_HARMONY_PROJECT`, `QUEST_LOCAL_LEGEND`.

The constants are never imported; the string values (`'quest_pick_of_destiny'`, etc.) are hardcoded directly in `src/data/events/quests.ts` and `src/data/questRegistry.ts`. Sibling constants (`QUEST_PROVE_YOURSELF`, `QUEST_APOLOGY_TOUR`, `QUEST_EGO_MANAGEMENT`) are imported, so this is also an internal consistency issue.

### LOW — Helper exports with no production call site — **INTEGRATE or DELETE**

- `clearCache` — `src/utils/unlockManager.ts:21`; used by tests, never called in `src/`.
- `getSafeStorageItem` — `src/utils/storage.ts:58`; no production caller and no current test reference found.
- `setSafeStorageItem` — `src/utils/storage.ts:105`; tested in `tests/utils/storage.test.js`, never called in `src/`.

---

## 3. INCONSISTENCIES

### 3.1 State clamps — raw persisted numbers still reach arithmetic-then-clamp paths

CLAUDE.md requires arithmetic-then-clamp paths to wrap persisted addends with `finiteNumberOr(value, fallback)` at the arithmetic boundary.

- **MED** — `src/context/reducers/minigameReducer.ts:115-117`: `clampMemberStamina(hitMember.stamina - staminaPenalty, hitMember.staminaMax)` still uses raw persisted member fields. **FIX:** wrap both with `finiteNumberOr`.
- **LOW** — `src/context/reducers/minigameReducer.ts:324-325`: `clampBandHarmony(state.band.harmony - stress)` / `clampPlayerMoney(state.player.money + reward)` still use raw persisted state fields.
- **LOW** — Same-class current instances also remain at `src/context/reducers/minigameReducer.ts:99-102` (`player.money`, `van.fuel`, `van.condition`) and `:473-475` (`band.harmony`, `player.money`).

### 3.2 Payload sanitization

- **LOW** — `src/context/reducers/minigameReducer.ts:358-360`: `typeof voidResonance === 'number' ? voidResonance : 0` (and the same pattern for `purgesUsed`, `hijacksOverridden`) still lets `NaN`/`Infinity` through. **FIX:** use `Number.isFinite(...)` or `finiteNumberOr(...)`.
- **LOW** — `src/utils/postGigUtils.ts:274,277`: mood/stamina deltas still gate with bare `typeof === 'number'`, so non-finite deltas survive into the update path. **FIX:** gate with `Number.isFinite`.

### 3.3 i18n

- **MED** — Hardcoded `€` remains in 96 EN/DE locale occurrences (48 paired strings) across `public/locales/{en,de}/events.json` and `items.json`, e.g. `events.json:133`, `events.json:423`, and `items.json:105`. CLAUDE.md wants bare `{{amount}}` placeholders so formatted amounts localize. **FIX:** convert to interpolation or document these as intentionally static flavor text.
- **LOW** — `public/locales/{en,de}/events.json:662` `police_contraband.opt1.label` writes `-€200` while sibling labels use trailing `-200€`. Normalize with the same interpolation pass.

---

## 4. MISSING INTEGRATION

### MED — `safeStorage` get/set helpers not adopted

`getSafeStorageItem`/`setSafeStorageItem` (`src/utils/storage.ts:58,105`) are still built but unused. Live code continues to call `localStorage` directly in places including:

- `src/utils/unlockManager.ts:36,99`
- `src/context/GameState.tsx:91,105,145,151`
- `src/context/usePersistence.ts:159,171,213`
- `src/utils/audio/AudioManager.ts:162-164,385,426,456`
- `src/hooks/useLeaderboardSync.ts:184,210`

Either adopt the safe helpers where they are intended to be the standard path, or remove them if direct storage access is the accepted design.

---

### Appendix — verification commands

- Duplicates: `rg -n "FORBIDDEN_KEYS|HOSTILE_KEYS|BANNED_KEYS|__proto__|constructor|prototype" ...`; `rg -n "clampCondition|clamp0to100|clampVanCondition" ...`.
- Orphans: `rg -n "<symbol names>" src tests`, then classify production vs test-only call sites.
- Quest integration removal check: `rg -n "<quest producer names>" src` and `rg -n "<quest event types>" src/data src/domain src/quests` now find emitters and matching quest rules.
- Numeric guards: `rg -n "clampMemberStamina|clampBandHarmony|clampPlayerMoney|typeof .*number" src/context/reducers/minigameReducer.ts src/utils/postGigUtils.ts`.
- Locale currency: `rg -o "€" public/locales/en/events.json public/locales/de/events.json public/locales/en/items.json public/locales/de/items.json`.
- Storage integration: `rg -n "getSafeStorageItem|setSafeStorageItem|localStorage\\.(getItem|setItem|removeItem)|window\\.localStorage" src`.
