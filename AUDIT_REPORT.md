# Neurotoxic Codebase Audit - Verified Findings

**Scope:** verification of the findings previously listed in this report against `src/`, `public/locales/`, `tests/`, and the current project instructions.

**Verification status:** most actionable findings were confirmed. Two important corrections are now reflected:

- `symbols.json` is currently stale. `pnpm run symbols:check` fails with `symbols.json is out of date`, so source searches and direct file reads are the authority for this report.
- `selectLiabilitiesMap` is a real orphan, but it is keyed by `assetId`. It must not be blindly adopted in selectors that sum all liabilities because multiple liabilities can share one asset and would collapse to one map entry.

**Commands run:**

- `pnpm run typecheck` - passed
- `pnpm run typecheck:core` - passed
- `pnpm run symbols:check` - failed because `symbols.json` is stale
- `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/assetReducer.test.js` - passed
- `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/assetSelectors.test.js` - passed
- `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/minigameReducer.test.js` - passed
- `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyMinigames.test.js` - passed
- EN/DE locale key and placeholder parity check across all 10 namespaces - passed

## Priority Summary

1. **Fix asset reducer money writes.** This is the only verified medium-risk state invariant bug. A direct reducer call can drive `player.money` negative.
2. **Delete or redesign `selectLiabilitiesMap`.** It is unused, and its current `assetId` key shape is unsafe for aggregate liability calculations.
3. **Clean dead locale keys and stale commented code.** These are low-risk hygiene fixes with clear evidence.
4. **Consider small utility consolidation only where it improves clarity.** The duplicate and re-roll findings are real, but most are low priority and should stay surgical.

## Confirmed Findings

### 1. Asset Reducer Money Clamp Gap

**Severity:** MED
**Status:** confirmed
**Files:** `src/context/reducers/assetReducer.ts`

The asset reducer writes raw `player.money` in these paths:

- `handlePurchaseChassis`: line 124
- `handleInstallModule`: line 199
- `handleRemoveModule`: line 309
- `handleUpgradeChassisTier`: line 389
- `handleSellChassis`: line 447
- `handleRepairChassis`: line 485
- `handleRefinanceLiability`: line 562

This violates the reducer-side invariant that reducers remain the final authority for clamping computed state. Other money-mutating reducers use `clampPlayerMoney`.

The original report said "six paths" while listing seven lines. The verified count is seven raw writes.

Concrete repro:

- A direct cash `handlePurchaseChassis` call with `player.money = 0` and a 4000-cost chassis produced `player.money = -4000`.

**Recommended action:** wrap persisted money writes with `clampPlayerMoney`, using `finiteNumberOr` where stale or malformed state can cross the arithmetic boundary.

### 2. Orphaned `selectLiabilitiesMap`

**Severity:** MED
**Status:** confirmed, with corrected action
**File:** `src/utils/assetSelectors.ts`

`selectLiabilitiesMap` and its cache state are exported but unused:

- `lastLiabilitiesForMap`: line 583
- `liabilitiesMapCache`: line 584
- `selectLiabilitiesMap`: line 644

Search found no `src/` or test caller. `symbols.json` also lists no `usedBy`, but that index is stale, so grep/source evidence is the reliable proof.

Important correction: this selector returns `Map<assetId, Liability>`. It loses data when an asset has multiple liabilities. Existing reducer tests explicitly cover multiple liabilities for one asset during sale payoff, so replacing aggregate `Object.values(state.liabilities)` loops with this map would be incorrect.

Concrete check:

- Two liabilities with `assetId: 'a1'` became a map of size 1.
- `getTotalDebt` correctly summed both liabilities.

**Recommended action:** delete `selectLiabilitiesMap` and its cache unless there is a real per-asset lookup use case. If a lookup is needed, redesign it as `Map<assetId, Liability[]>`.

### 3. Dead Locale Keys

**Severity:** LOW
**Status:** confirmed
**Files:** `public/locales/en/*.json`, `public/locales/de/*.json`

The following keys have no live `t()` lookup or known dynamic-prefix use:

- `ui:checklist.*` - 7 keys
- `ui:setlistSelector.*` - 7 keys
- `ui:decryptor.*` - 4 keys
- `ui:confirm_delete`
- `ui:confirm_delete_text`
- `ui:hqNavigation`
- `ui:set_label_to_segment`
- `ui:sign_contract`
- `assets:common.dailySuffix`

Notes:

- The delete-save UI is live, but it uses `ui:delete_save` through `DataManagement` and `DeadmanButton`, not `confirm_delete*`.
- Band HQ tab navigation uses `ui:hq.sectionsLabel`, not `ui:hqNavigation`.

**Recommended action:** delete these keys from both EN and DE locale files unless a removed UI is intentionally coming back.

### 4. HQ Unlock Target Locale Keys

**Severity:** LOW
**Status:** partially confirmed
**Files:** `public/locales/{en,de}/items.json`, `src/data/hqItems.ts`

The display labels for these target IDs are unused:

- `hq_coffee.*`
- `hq_sofa.*`
- `hq_label.*`
- `hq_old_couch.*`
- `hq_poster_wall.*`
- `hq_cheap_beer_fridge.*`
- `hq_diy_soundproofing.*`

Caveat: the bare IDs are not dead. They are live `unlock_hq` effect targets in `src/data/hqItems.ts`. The rendered catalog items use the `hq_room_*` keys instead.

**Recommended action:** decide product intent. If unlock-target display is intended, wire a surface that renders these labels. If not, delete only the unused locale labels, not the IDs.

### 5. German Feature List Leftovers

**Severity:** LOW
**Status:** confirmed
**File:** `public/locales/de/ui.json`

These German strings are still English while neighboring entries are translated:

- `featureList.sec13.items.2`: `Deadlines`
- `featureList.sec13.items.3`: `Rewards`
- `featureList.sec13.items.4`: `Failure Penalties`
- `featureList.sec15.items.2`: `Loyalty`
- `featureList.sec15.items.3`: `Zealotry`
- `featureList.sec15.items.4`: `Controversy`

The `featureList.*` keys are live through `MainMenuFeatures`, which reads the feature-list object and then translates each referenced key.

**Recommended action:** translate these six DE strings.

### 6. Stale Commented Code

**Severity:** LOW
**Status:** confirmed
**File:** `src/ui/bandhq/SetlistTab.tsx:110`

`// { setlist, setSetlist, addToast }) => {` is a stale signature fragment immediately below the live props destructure.

**Recommended action:** delete the comment.

## Low-Priority Utility Findings

These are real but should only be changed if the edit stays small and local.

### Reputation Delta Helpers

**Status:** confirmed
**File:** `src/domain/questEffects.ts`

`applyReputationDelta` and `applyVenueReputationDelta` have identical structure and differ only by state slice:

- `reputationByRegion`
- `reputationByVenue`

**Recommended action:** optional extraction only if it reduces code without obscuring the domain distinction.

### Reputation Key Validation Tail

**Status:** confirmed
**File:** `src/domain/questEffects.ts`

`getVenueReputationKey`, `getRegionReputationKey`, and `getBrandReputationKey` repeat:

```ts
typeof key === 'string' && key.length > 0 && !isForbiddenKey(key)
```

**Recommended action:** optional `validReputationKey` helper.

### `handleError` Name Collision

**Status:** confirmed
**Files:** `src/utils/errorHandler.ts`, `src/utils/eventEngine/helpers.ts`

Both modules export `handleError`, but the implementations are not duplicate logic:

- `errorHandler.ts` is the general logger/toast/telemetry path.
- `eventEngine/helpers.ts` logs event condition failures.

**Recommended action:** optionally rename the event-engine helper to `logEventError` for grep clarity.

### Plain Object Guard in `postOptions`

**Status:** confirmed with caveat
**Files:** `src/data/postOptions.ts`, `src/utils/objectUtils.ts`

`postOptions.ts` has an inline influencer lookup guard that resembles `isPlainRecord`, but it intentionally accepts null-prototype objects. `isPlainRecord` currently accepts only `Object.prototype`.

**Recommended action:** do not replace it with `isPlainRecord` unless null-prototype acceptance is preserved.

### Inline `finiteNumberOr` Re-roll

**Status:** confirmed
**File:** `src/utils/merchUtils.ts:49`

`getTotalMerchStock` manually checks `typeof value === 'number' && Number.isFinite(value)` despite importing `finiteNumberOr`.

**Recommended action:** replace with `finiteNumberOr(value, 0)` in a small cleanup.

### Fisher-Yates Shuffle Duplication

**Status:** confirmed
**Files:** `src/utils/eventEngine/eventSelection.ts`, `src/scenes/kabelsalat/hooks/useKabelsalatShuffle.ts`

Both use Fisher-Yates. Behavior differs on sparse/undefined entries:

- event selection throws on a dense-array invariant violation
- Kabelsalat continues and leaves fallback order intact

**Recommended action:** only extract a shared helper if it can preserve both sparse-entry policies clearly.

### Repeated Clamp-to-Unit Logic

**Status:** confirmed
**Files:** audio, UI, asset, economy, and minigame modules

There are repeated `Math.max(0, Math.min(1, value))` / `Math.min(1, Math.max(0, value))` patterns.

**Recommended action:** optional shared helper. Be careful with module boundaries: UI/audio code may not want to import broad game-state utilities.

## Verified Non-Issues and Caveats

### Locale Parity

EN/DE key parity and placeholder parity are clean across all checked namespaces:

- `assets`: 303 / 303
- `chatter`: 1158 / 1158
- `economy`: 266 / 266
- `events`: 1042 / 1042
- `items`: 204 / 204
- `minigame`: 11 / 11
- `traits`: 45 / 45
- `ui`: 1375 / 1375
- `unlocks`: 1 / 1
- `venues`: 66 / 66

No placeholder mismatches were found.

### `contrabandDelivered` Type Check

**Original finding:** `typeof contrabandDelivered === 'number'` in `minigameReducer.ts:582`.

**Verified status:** low-risk convention issue only.

`contrabandDelivered` is normalized by `createCompleteRoadieMinigameAction`, sanitized again inside `calculateRoadieMinigameResult`, and quest progress reads event amounts with `Number.isFinite`. The reducer branch should still use `Number.isFinite` for consistency, but this is not currently a data-corruption path.

### Band Additive Effect Arithmetic

**Original finding:** `band[field] = (band[field] || 0) + value` in `bandReducer.ts:299`.

**Verified status:** valid low-risk defensive cleanup.

The value comes from static item config, which mitigates the load-boundary risk. Still, `finiteNumberOr` would match project convention and avoid preserving `Infinity`.

### Cleared Convention Claims

Targeted searches found:

- no `forwardRef` usage in `src/`
- no active `.propTypes` blocks in `src/`
- no context-level hand-written action objects; inline `dispatch({ type })` usage is local rhythm-game `useReducer` state
- `Tone.now()` use is confined to `src/utils/audio/*`
- `assertNever` runtime traps match reducer instructions

Caveats:

- Test fixtures contain `@ts-ignore`; the clean claim only holds for production `src/`.
- Hex literals exist in `src/index.css` token definitions and `src/utils/brandColors.ts`, which are expected sources of truth. No ad-hoc source hardcoded-color issue was verified.
