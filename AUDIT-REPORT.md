# Neurotoxic — Code-Quality Audit (Fresh Pass)

**Date:** 2026-06-03

**Scope:** all production code under `src/` (skips `node_modules`, `dist`; `tests/` checked only for orphan references).

**Method:** five parallel investigation agents (duplicates, orphans, inconsistencies, dead code, missing integration), each verifying every claim with ripgrep + direct file reads. HIGH-severity inconsistency findings were independently spot-checked against source by the lead.

**Mode:** read-only audit. **No files were modified.**

> Note on the prior report: the repo's existing `AUDIT_FINDINGS.md` (also present in the `determined-noyce-da1fa5` worktree) marks an earlier audit "all resolved." Those fixes were verified to hold (e.g. `FORBIDDEN_KEYS`/`isForbiddenKey` centralized in `objectUtils.ts`, `clampCondition`→`clamp0to100` merged, i18n EN/DE in sync, no hardcoded colors). The findings below are **new or remaining** issues; resolved items are not re-reported.

---

## 1. DUPLICATES

### D1 — Quest reward/penalty helper cluster (NEAR-duplicate) · **HIGH** · MERGE

`src/domain/questRewards.ts` and `src/domain/questPenalties.ts` carry byte-identical (or param-renamed) copies of eight helpers — the engines differ only in `+amount` sign:

| Helper | questRewards.ts | questPenalties.ts |

|--------|-----------------|-------------------|

| `clampReputation` | :83 | :101 |

| `getVenueReputationKey` | :86 | :104 |

| `getRegionReputationKey` | :99 | :117 |

| `applyReputationDelta` | :110 | :128 |

| `applyVenueReputationDelta` | :126 | :144 |

| `getBrandReputationKey` | :142 | :160 |

| `applyBrandTrustDelta` | :151 | :169 |

| `queueEvent` | :192 | :212 |

**Action:** extract into a shared `src/domain/questEffects.ts` (or `questHelpers.ts`) and import from both. Move `clampReputation` (−100..100) into `src/utils/gameStateUtils.ts` alongside the other canonical clamps.

### D2 — `getQuestToastName` (EXACT duplicate) · **MED** · DELETE copy

Canonical exported helper at `src/domain/questHelpers.ts:30` (body `quest.label ?? quest.id`) is re-defined privately at `src/domain/questRewards.ts:81`. `questLifecycle.ts` already imports the canonical one.

**Action:** delete the `questRewards.ts` copy; import from `questHelpers.ts`.

### D3 — Asset validation constants (NEAR-duplicate, drift hazard) · **MED** · MERGE

`VALID_KINDS`/`VALID_FLAVORS`/`VALID_TIERS`/`VALID_MODES` defined twice: `src/context/assetActionCreators.ts:100-108` vs `src/context/reducers/assetSanitizers.ts:23-27`. The flavor/tier/mode sets are identical, but `VALID_KINDS` **diverges** — `assetSanitizers` derives it from `Object.keys(CHASSIS_CONFIG)` (the documented single source of truth) while `assetActionCreators` hardcodes four chassis literals → drift if a chassis kind is added.

**Action:** export these sets from one module (derive `VALID_KINDS` from `CHASSIS_CONFIG`) and import in both layers.

### D4 — `VALID_CATEGORIES` event-category set (NEAR-duplicate, latent bug) · **MED** · MERGE

`src/data/events/index.ts:31` uses `new Set(EVENT_CATEGORIES)` = `transport, band, gig, financial, special`; `src/utils/eventValidator.ts:6` hardcodes `['band','financial','special']` — **missing `transport` and `gig`**, so valid events in those categories can fail validation.

**Action:** have `eventValidator.ts` import `EVENT_CATEGORIES` from `data/events/index.ts`.

### D5 — `BASE_MERCH_CAPACITY` + capacity formula (EXACT duplicate) · **MED** · MERGE

`const BASE_MERCH_CAPACITY = 100` plus `BASE + Math.max(0, finiteNumberOr(...merchCapacityBonus, 0))` appears in `src/components/pregig/MerchStrategyBlock.tsx:110` (used :125) and `src/hooks/usePreGigLogic.ts:50` (used :196).

**Action:** move constant + a `getMerchCapacity(bonus)` helper into a shared util (e.g. `src/utils/merchUtils.ts`).

### D6 — `neurotoxic_global_settings` read/parse (NEAR-duplicate magic-string) · **MED** · MERGE

Storage key literal + `safeJsonParse(getItem(key) || '{}')` duplicated across `src/context/initialState.ts:183-191` (`getSavedSettings`) and `src/context/useGameDispatchActions.ts:665-672` (read + merge + write) — bypasses the typed `storage.ts` helpers, risks key drift.

**Action:** add a `GLOBAL_SETTINGS_KEY` constant and `readGlobalSettings()`/`writeGlobalSettings()` in `storage.ts` (or a settings util); use in both.

### D7 — `runSafeStorageOperation` triple facade (redundant wrappers) · **LOW** · MERGE/DELETE

Canonical `src/utils/errorHandler.ts:506`. `src/utils/storage.ts` adds three pass-throughs: `safeStorageOperation:14`, `safeStorage:121`, `safeStorageNoFallback:129` — the latter two add no behavior beyond arg-forwarding.

**Action:** collapse to one public name; remove the redundant facades.

### D8 — `HEX_COLOR_PATTERN` regex (NEAR-duplicate, divergent) · **LOW** · MERGE

`src/components/stage/stageRenderUtils.ts:17` `/^#([0-9a-f]{3}|[0-9a-f]{6})$/i` vs `src/components/overworld/hooks/useOverworldUrls.ts:27` which also accepts 8-digit alpha. AGENTS.md mandates one source of truth for both pixi and inline-SVG fallback paths.

**Action:** define one shared `HEX_COLOR_PATTERN` in `src/utils/brandColors.ts`; decide a single 6- vs 8-digit policy.

### D9 — `isRecord` reimplements `isLooseRecord` (RE-IMPLEMENTED util) · **LOW** · MERGE

Canonical `src/utils/objectUtils.ts:23`; identical local body at `src/utils/questProgress.ts:140`.

**Action:** import `isLooseRecord`; delete local copy. (`src/utils/mapUtils.ts:12 isMapConnection` reuses the same body as a narrower domain guard — borderline, lower priority.)

### D10 — `finiteNumberOrZero` reimplements `finiteNumberOr(x,0)` (RE-IMPLEMENTED util) · **LOW** · DELETE

`src/quests/producers/socialQuestEvents.ts:3` is the exact body of `finiteNumberOr` (`src/utils/finiteNumber.ts:8`) with a baked `0`.

**Action:** delete; call `finiteNumberOr(value, 0)`.

### D11 — Inline forbidden-key check bypasses `isForbiddenKey` (RE-IMPLEMENTED util) · **LOW** · MERGE

`src/ui/bandhq/hooks/usePurchaseLogic.ts:97` open-codes `key === '__proto__' || key === 'constructor' || key === 'prototype'` in `asToastOptions`, duplicating the canonical `isForbiddenKey`/`FORBIDDEN_KEYS` (`src/utils/objectUtils.ts:8`).

**Action:** use `isForbiddenKey(key)` (or `sanitizeTraversableValue`).

**Cleared (investigated, not duplicates):** `isOnCooldown` (`eventEngine.ts:628`) is a re-export alias of `gameStateUtils.ts:1306`; the two `sanitizeContextValue` (`tradeReducer.ts:26` HTML-escape vs `errorHandler.ts:200` key-redaction) have genuinely different responsibilities; the multiple Fisher-Yates shuffles intentionally use different RNG sources per AGENTS.md scope rules.

---

## 2. ORPHANED / UNINTEGRATED

> Method: enumerated ~216 export candidates whose `symbols.json` `usedBy` graph lacked a non-test importer, then re-verified each against the **live** `src/` tree with a whole-word scan (catching JSX tags, registry string-keys, barrel re-exports). 212 turned out live — internal helpers reached through a consumed top-level export, or `*Props`/`*Return` types consumed at their own signature. `symbols.json` was stale (`symbols:check` failed) and over-reports; do not trust its graph for this. Only the items below are genuine.

### O1 — `isModuleUnlocked` is the documented owner of module unlock semantics but has no production caller · **HIGH** · INTEGRATE

`src/utils/assetSelectors.ts:306`. Live scan found **zero production call sites**; only ~15 assertions across three node tests reference it. Yet `src/utils/assetSections/AGENTS.md:24` and `tests/node/AGENTS.md` declare it the authoritative owner of module OR-unlock semantics ("Do not reimplement unlock evaluation inside workshop modules"). So either module availability is ungated in the running game, or gating is duplicated elsewhere (which would itself violate the documented contract).

**Action:** INTEGRATE into the module install/availability path (asset module selector or install action creator). Confirm where gating currently happens before considering deletion — the explicit doc contract argues for wiring, not removal.

### O2 — `CatalogEffect` type alias (dead) · **LOW** · DELETE

`src/types/components.d.ts:401` (`export type CatalogEffect = Effect`), re-exported via `src/types/index.ts`. `rg "\bCatalogEffect\b"` → only declaration + barrel re-export, no importer. The used symbols are `isCatalogEffect`/`normalizeCatalogEffect` (different names) in `catalogEffectUtils.ts`.

**Action:** delete the alias and its `types/index.ts` re-export.

### O3 — `BrandColorName` type (dead) · **LOW** · DELETE

`src/utils/brandColors.ts:24` (`export type BrandColorName = keyof typeof BRAND_COLOR_HEX`). `rg` → declaration only, no prod/test reference.

**Action:** delete.

**Cleared (not orphans):** `clearCache` (`unlockManager.ts:21`) is a legitimate test-support export (used by node + security tests to reset module cache). All `*Props`/`*Return`/`*Input`/`*Params`/`*State` types (~60) are consumed at their own signatures. ~80 internal runtime helpers (e.g. `calculateGuarantee`, `EFFECT_HANDLERS`, `VENUE_CHATTER_DB`) are over-exported but functionally wired via a consumed top-level export — tightening that export surface is a separate, larger refactor, out of scope here.

---

## 3. INCONSISTENCIES

> The systemic issue: `finiteNumberOr` discipline was retrofitted onto the mood/stamina paths AGENTS.md explicitly names, but the same arithmetic-then-clamp treatment for **money, fame, harmony, van fuel/condition, luck** was left on raw addends — even though the rule is field-agnostic and `playerReducer.handleUpdatePlayer` already demonstrates the correct pattern. i18n (EN/DE in sync) and colors (no hex literals outside `brandColors.ts`) are clean.

### I1 — `applyContrabandEffect` harmony branch addend not wrapped · **HIGH** · FIX

`src/context/reducers/bandReducer.ts:557-558`. Same function's stamina/mood branch (`:541-550`) correctly uses `finiteNumberOr(item.value,0)` and `finiteNumberOr(m[key],0)`, but the harmony branch does `clampBandHarmony((newBand.harmony ?? 1) + (item.value as number))` — `??` does not catch `NaN`, and `item.value` is cast `as number`. A non-finite value or NaN harmony silently collapses harmony to 1. _(Confirmed against source.)_

**Action:** `clampBandHarmony(finiteNumberOr(newBand.harmony, 1) + finiteNumberOr(item.value, 0))`. Violates AGENTS.md arithmetic-then-clamp + "no bare `as number`".

### I2 — `applyEventDelta` money/fame/harmony/van/luck addends unwrapped · **HIGH** · FIX

`src/utils/gameStateUtils.ts` — money `:829`, fame `:836-837`, van.fuel `:883`, van.condition `:886-889`, harmony `:904-908`, luck `:1140-1141`. The mood/stamina path (`:990-999`) is correctly wrapped, but the others feed the raw persisted value (e.g. `clampPlayerMoney(nextPlayer.money + delta.player.money)`). On a stale save where the field is `undefined`/`NaN`, the clamp collapses to 0/1 and the event reward/penalty is silently dropped. Inconsistent with the correct sibling `handleUpdatePlayer` (`src/context/reducers/playerReducer.ts:32-40`). _(Confirmed against source.)_

**Action:** wrap each persisted addend, e.g. `clampPlayerMoney(finiteNumberOr(nextPlayer.money, 0) + delta.player.money)`, and likewise for fame, harmony, van.fuel, van.condition, luck.

### I3 — `calculateAppliedDelta` bare `typeof === 'number'` admits NaN · **MED** · FIX

`src/utils/gameStateUtils.ts` — money `:531-537`, fame `:542-549`, van.fuel `:564-571`, van.condition `:572-581`, harmony `:613-616`, social `:592-609`. Guards like `typeof state.player?.money === 'number'` pass `NaN` (`typeof NaN === 'number'`), so `Math.max(0, NaN)` → `NaN` propagates into the previewed `applied.*` delta (used by `eventEngine.ts:933`), letting preview and applied diverge.

**Action:** replace the current-state reads with `finiteNumberOr(x, 0)`. Violates AGENTS.md Gotchas "use `Number.isFinite`, not bare `typeof === 'number'`".

### I4 — `EFFECT_REVERTERS.harmony` revert addend unguarded · **MED** · FIX

`src/context/reducers/systemReducer.ts:1711-1713`: `clampBandHarmony((band.harmony ?? 1) - (value as number))` — `??` misses `NaN`, `value` cast `as number`. On a NaN harmony or non-finite stored effect value, expiry resets harmony to 1 instead of reverting.

**Action:** `clampBandHarmony(finiteNumberOr(band.harmony, 1) - finiteNumberOr(value, 0))`.

**Cleared (verification notes):** EN/DE locales fully in sync across all 10 namespaces; the only hardcoded `€` (`items.json hq_room_label`) is the documented intentional exception (no money value to interpolate); no hex literals outside `brandColors.ts`; all `rgb()/rgba()` wrap CSS-var tokens; `Number(x) || 0` patterns are post-`Number()` (allowed); `reputationBy*[x] || 0` are map-miss defaults where 0 and absent are equivalent.

---

## 4. DEAD / UNREACHABLE CODE

> The codebase is exceptionally clean here. ESLint with `no-unreachable`, `no-constant-condition`, `no-constant-binary-expression`, and `no-unused-vars` promoted to errors over `src/` produced **0 errors** (3 unrelated warnings: an exhaustive-deps hint in `usePostGigHandlers.ts:348`, array-index-key in `CreditsView.tsx:49` and `QuestsModal.tsx:368`). The reducer/action-type mapping is a type-checked `ReducerMap` keyed by the action union (`gameReducer.ts:124-198`), making "handler for nonexistent type" and "type with no handler" compile-time impossible. No commented-out code blocks, no permanently-false flags (only env-driven `VITE_ENABLE_*`).

### DEAD1 — `SELL_CHASSIS_FAILED` action type never produced · **LOW** · FIX

- `src/context/actionTypes.ts:65` — constant

- `src/types/game.d.ts` — union member `{ assetId: string; reason: 'LIABILITY_EXCEEDS_VALUE' }`

- `src/context/gameReducer.ts:189` — `[ActionTypes.SELL_CHASSIS_FAILED]: handleAssetFailedAction`

No action creator ever constructs it. `sellChassis` (`src/context/assetActionCreators.ts`) is unconditional — always returns `SELL_CHASSIS`, with no rejection branch, unlike its siblings (`purchaseChassis`, `installModule`, `refinanceLiability`) which do return their `*_FAILED` variants. The typed `reason: 'LIABILITY_EXCEEDS_VALUE'` signals a planned-but-unwired rejection path. Only references are the type, the map entry, an exhaustiveness assertion in `tests/ui/actionTypes.test.jsx`, and a doc note.

**Action:** FIX (add the `LIABILITY_EXCEEDS_VALUE` rejection branch to `sellChassis` — likely the original intent).

---

## 5. MISSING INTEGRATION

> Every action type → creator → dispatch bridge (`useGameDispatchActions.ts`) → UI/hook consumer chain was traced, plus every scene/modal/hook and the data/domain/quest/util systems. With two exceptions the game is exhaustively wired. (Verified correctly integrated: rival band system, all quest producers, milestones, quest domain engines, all overworld modals, clinic, practice mode, all asset actions, all data tables, every `src/hooks/` hook.)

### M1 — `CONSUME_ITEM` chain fully built, never triggered · **MED** · INTEGRATE

Reducer `handleConsumeItem` (`src/context/reducers/bandReducer.ts:207`) — generic inventory consumer that decrements a numeric item (or flips a boolean item false) and emits an `item.used` quest event. Fully supported: action type `CONSUME_ITEM` (`actionTypes.ts:25`), creator `createConsumeItemAction` (`actionCreators.ts:458`), `gameReducer` map entry, and `consumeItem` bridge (`useGameDispatchActions.ts:372`). But **no component/hook ever calls `consumeItem`** — it appears only in the bridge plumbing (`useGameDispatchActions.ts:128,372,759,824`). In-game item use flows through `USE_CONTRABAND` and `TRADE_VOID_ITEM` instead, so the generic non-contraband consume path and its `item.used` quest emission can never fire.

**Action:** INTEGRATE for a non-contraband consumable use (e.g. consuming crafted BandHQ inventory items — which would also feed `item.used` quest progress).

### M2 — `ADD_VENUE_BLACKLIST` action path redundant/dead · **LOW** · DELETE

Creator `createAddVenueBlacklistAction` (`actionCreators.ts:690`), type `ADD_VENUE_BLACKLIST` (`actionTypes.ts:41`), map entry (`gameReducer.ts:167`), bridge `addVenueBlacklist` (`useGameDispatchActions.ts:513`). No component/hook calls `addVenueBlacklist` (bridge-plumbing-only references). The blacklisting behavior **is** live, but `handleAddVenueBlacklist` (`socialReducer.ts:343`) is invoked **directly** by `gigReducer.ts:204` during the bad-gig flow — not via a dispatched action. So only the dispatchable action path is orphaned. (Companion `UNBLACKLIST_VENUE` is genuinely dispatched from `BandHQContentArea.tsx`.)

**Action:** DELETE the bridge wrapper, creator, action type, and map entry; keep `handleAddVenueBlacklist` as the directly-called helper. Confirm no save/migration/test depends on the action string first.

---

# Neurotoxic Code Quality Audit Findings

## Audit Notes

- Scope: primary audit under `src/`; tests checked only to verify orphan/dead references.
- `symbols.json` was not trusted for orphan analysis because `pnpm run symbols:check` reports it is out of date.
- Orphan and missing-integration claims below were verified with `rg`.
- Locale EN/DE key parity checked clean; no locale parity finding.

## DUPLICATES

| Severity | Location                                                                                                                                                                                                | Finding                                                                                                                                                                                 | Recommended Action |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| MED      | `src/domain/questRewards.ts:86`, `src/domain/questPenalties.ts:104`                                                                                                                                     | Exact duplicate `getVenueReputationKey` logic exists in reward and penalty paths.                                                                                                       | MERGE              |
| MED      | `src/domain/questRewards.ts:99`, `src/domain/questPenalties.ts:117`                                                                                                                                     | Exact duplicate `getRegionReputationKey` logic exists in reward and penalty paths.                                                                                                      | MERGE              |
| MED      | `src/domain/questRewards.ts:110`, `src/domain/questPenalties.ts:128`                                                                                                                                    | Exact duplicate `applyReputationDelta` logic exists in reward and penalty paths.                                                                                                        | MERGE              |
| MED      | `src/domain/questRewards.ts:126`, `src/domain/questPenalties.ts:144`                                                                                                                                    | Exact duplicate `applyVenueReputationDelta` logic exists in reward and penalty paths.                                                                                                   | MERGE              |
| MED      | `src/domain/questRewards.ts:142`, `src/domain/questPenalties.ts:160`                                                                                                                                    | Near-duplicate `getBrandReputationKey` logic differs only by parameter naming/type context.                                                                                             | MERGE              |
| MED      | `src/domain/questRewards.ts:151`, `src/domain/questPenalties.ts:169`                                                                                                                                    | Near-duplicate `applyBrandTrustDelta` logic exists in both quest outcome modules.                                                                                                       | MERGE              |
| LOW      | `src/domain/questRewards.ts:192`, `src/domain/questPenalties.ts:212`                                                                                                                                    | Exact duplicate `queueEvent` helper exists in reward and penalty paths.                                                                                                                 | MERGE              |
| MED      | `src/ui/shared/GeneratedImagePanel.tsx:29`, `src/ui/bandhq/ShopItem.tsx:90`, `src/ui/ContrabandStash.tsx:128`, `src/components/postGig/DealCard.tsx:118`, `src/components/postGig/ZealotryGauge.tsx:18` | Pollinations/generated-image rendering is reimplemented with raw `<img>` consumers instead of consistently using `GeneratedImagePanel`; some callers lack equivalent fallback handling. | MERGE              |
| LOW      | `src/scenes/kabelsalat/components/PlugGraphics.tsx:8`, `src/scenes/kabelsalat/components/SocketGraphics.tsx:8`                                                                                          | Parallel connector dispatch switches over the same connector IDs with mirrored responsibility. Low-risk now, but connector additions can drift.                                         | MERGE              |

## ORPHANED / UNINTEGRATED CODE

| Severity | Location                                                                                                                                                                                                   | Finding                                                                                                                                                                                                                                         | Recommended Action |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| LOW      | `src/quests/producers/gigQuestEvents.ts:33`, `src/quests/producers/gigQuestEvents.ts:37`                                                                                                                   | `createSmallVenueGoodGigQuestEvent` is exported but production imports use the alias `createSmallVenueGoodQuestEvent`. `rg` shows the original name is only imported by tests. Likely compatibility/test-surface rather than a gameplay orphan. | MERGE              |
| LOW      | `src/utils/unlockManager.ts:21`                                                                                                                                                                            | `clearCache` is exported but has no `src/` callers; `rg` shows test-only usage. It appears intended as a test seam for cached unlock state, not gameplay API.                                                                                   | FIX                |
| MED      | `src/domain/questRewards.ts:350`, `src/domain/questRewards.ts:353`, `src/domain/questRewards.ts:360`, `src/domain/questRewards.ts:367`, `src/domain/questRewards.ts:425`, `src/domain/questRewards.ts:451` | Advanced typed quest rewards for asset repair, reputation, brand trust, trait unlock, and event queueing are implemented and tested, but `src/data/questRegistry.ts` does not wire production quests through these typed reward arrays.         | INTEGRATE          |
| MED      | `src/domain/questPenalties.ts:253`, `src/domain/questPenalties.ts:256`, `src/domain/questPenalties.ts:263`, `src/domain/questPenalties.ts:270`, `src/domain/questPenalties.ts:276`                         | Advanced typed quest penalties for asset damage, reputation, brand trust, and event queueing are implemented and tested, but production quest data appears to use legacy penalty fields instead.                                                | INTEGRATE          |

## INCONSISTENCIES

| Severity | Location                                                                                                                                                    | Finding                                                                                                                                                                                                                                                                             | Recommended Action |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| MED      | `src/context/actionCreators.ts:321`, `src/context/reducers/gigReducer.ts:123`, `src/context/reducers/gigReducer.ts:157`                                     | `createSetLastGigStatsAction` spreads raw stats, and `handleSetLastGigStats` accepts any value where `typeof score === 'number'`. `NaN` and `Infinity` can pass into gig stats, quest events, and trait unlock context, violating the repo rule to use finite numeric sanitization. | FIX                |
| HIGH     | `src/context/reducers/systemReducer.ts:739`, `src/context/reducers/systemReducer.ts:747`                                                                    | Save-load player numeric fields use bare `typeof === 'number'`. `fame` is later clamped, but `day: Math.max(1, NaN)` can persist `NaN` into loaded game state.                                                                                                                      | FIX                |
| MED      | `src/ui/bandhq/ShopItem.tsx:90`, `src/ui/ContrabandStash.tsx:128`, `src/components/postGig/DealCard.tsx:118`, `src/components/postGig/ZealotryGauge.tsx:18` | Generated image handling is inconsistent with `src/ui/shared/AGENTS.md`, which says `GeneratedImagePanel` should encapsulate Pollinations URL resolution, offline fallback, and image error handling for UI consumers.                                                              | FIX                |

## DEAD / UNREACHABLE CODE

| Severity | Location                                                                                                                               | Finding                                                                                                                                                                                                                              | Recommended Action |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| LOW      | `src/context/actionTypes.ts:65`, `src/context/gameReducer.ts:189`, `src/types/game.d.ts:239`, `src/context/assetActionCreators.ts:319` | `SELL_CHASSIS_FAILED` is declared and routed to the failed-action no-op handler, but `sellChassis` always returns `SELL_CHASSIS`; `rg` found no production producer for the failed action. Tests only assert the action type exists. | FIX or DELETE      |

## MISSING INTEGRATION

| Severity | Location                                                                                                                                                                                                                                                                       | Finding                                                                                                                                                                                                                                  | Recommended Action |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HIGH     | `src/context/assetActionCreators.ts:147`, `src/context/assetActionCreators.ts:227`, `src/context/assetActionCreators.ts:350`, `src/context/reducers/assetReducer.ts:578`, `src/context/gameReducer.ts:186`, `src/context/gameReducer.ts:192`, `src/context/gameReducer.ts:194` | Asset failure actions are produced for chassis purchase, module install, and liability refinance, but reducers intentionally no-op them and no UI/middleware bridge consumes their reasons. This makes stale-state/race failures silent. | INTEGRATE          |
| HIGH     | `src/components/assets/ChassisAcquisitionModal.tsx:38`, `src/components/assets/ChassisAcquisitionModal.tsx:67`, `src/components/assets/ChassisAcquisitionModal.tsx:74`                                                                                                         | The modal comment says a hub-level toast bridge surfaces `PURCHASE_CHASSIS_FAILED`, but the click path dispatches purchase and closes immediately. `rg` found no implemented bridge for the failed action reason.                        | INTEGRATE          |
| MED      | `src/components/assets/ModulePickerModal.tsx:279`, `src/components/assets/ModulePickerModal.tsx:284`                                                                                                                                                                           | `installModule` can return `INSTALL_MODULE_FAILED`, but the modal closes after dispatch and no failure result is surfaced. Disabled states cover normal UI cases, but reducer/action-creator validation failures remain invisible.       | INTEGRATE          |
| MED      | `src/components/assets/LiabilitiesPanel.tsx:28`, `src/context/assetActionCreators.ts:350`                                                                                                                                                                                      | `refinanceLiability` can return `REFINANCE_LIABILITY_FAILED`, but no caller or middleware displays the failure reason.                                                                                                                   | INTEGRATE          |
