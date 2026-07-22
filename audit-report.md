# Neurotoxic Code-Quality Audit Report and Fix Log

## Scope and Process

- **Repository audited and fixed:** `/workspace/neurotoxic-game`.
- **Primary audit scope:** `src/`.
- **Skipped as primary:** `node_modules/`, `dist/`, and `tests/`; tests were checked only to verify orphan/public-surface claims and to add regression coverage for fixes.
- **Process used:** read root and scoped agent instructions, dispatched focused audit subagents, verified findings with `rg`/symbol/jscpd checks, wrote failing regression tests for behavior changes, implemented surgical fixes, then reran targeted and type verification.

## Resolution Summary

| ID | Category | Severity | Status | Action |
| --- | --- | --- | --- | --- |
| D-001 | Duplicate validators | MED | Fixed | **MERGE** into `validateDailySocialActionEligibility` |
| D-002 | Duplicate social-action hooks | MED | Fixed | **MERGE** into `useDailySocialAction` |
| D-003 | Duplicate same-day helpers | LOW | Fixed | **MERGE** into `hasDailySocialActionRunToday` |
| D-004 | Asset CSS shell clone | LOW | Fixed | **MERGE** shared shell background variables |
| O-001 / DU-001 / MI-002 | Empty PreGig stub | LOW | Fixed | **DELETE** `src/hooks/preGig/usePreGigState.ts` |
| O-002 | `socialEngine` brand-deal re-export | LOW | Resolved | **FIX** by documenting compatibility surface in code |
| O-003 | Overworld barrel private hook export | LOW | Fixed | **DELETE** unnecessary barrel export |
| O-004 / I-003 | Shared UI barrel import policy | LOW | Resolved | **FIX** by documenting supported mixed import policy |
| I-001 | `capacity || undefined` falsy handling | LOW | Fixed | **FIX** to `capacity ?? undefined` |
| I-002 | Social-action numeric defensiveness | LOW | Fixed | **FIX** by routing validators through shared finite/clamp helper |
| DU-002 / MI-001 | Inert `enablesBulkProduction` flag | MED | Fixed | **DELETE** from asset types, defaults, and aggregators |

---

## 1. DUPLICATES

### D-001 — MED — Daily social-action validators duplicated the same eligibility algorithm

- **Original locations:** `validateCultIndoctrination` in `src/utils/cultIndoctrinationUtils.ts`, `validateDarkWebLeak` in `src/utils/darkWebLeakUtils.ts`, and `validatePirateBroadcast` in `src/utils/pirateRadioUtils.ts`.
- **Resolution:** Added `src/utils/dailySocialActionUtils.ts` with shared `hasDailySocialActionRunToday` and `validateDailySocialActionEligibility` helpers. The three action-specific utility modules now delegate to the shared helper while preserving their public exports.
- **Recommended action completed:** **MERGE**.
- **Verification:** Added `tests/node/dailySocialActionUtils.test.js`; ran `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/dailySocialActionUtils.test.js tests/node/pirateRadioUtils.test.js tests/node/overworldServiceValidators.test.js tests/node/questProducers.test.js`.

### D-002 — MED — Social-action hook orchestration repeated across three hooks

- **Original locations:** `src/hooks/useDarkWebLeak.ts`, `src/hooks/useCultIndoctrination.ts`, and `src/hooks/usePirateRadio.ts`.
- **Resolution:** Added `src/hooks/useDailySocialAction.ts` to centralize modal state, open/close callbacks, validation error logging, SFX, dispatch, and close-on-success. The three exported hooks remain as action-specific wrappers with their existing return shapes.
- **Recommended action completed:** **MERGE**.
- **Verification:** Ran `pnpm exec vitest run tests/hooks/useDarkWebLeak.test.jsx tests/hooks/usePirateRadio.test.jsx`.

### D-003 — LOW — “Already acted today” helpers implemented the same comparison with divergent guards

- **Original locations:** `checkHasIndoctrinatedToday`, `checkHasLeakedToday`, and `checkHasBroadcastedToday`.
- **Resolution:** All three helpers now call `hasDailySocialActionRunToday`, which rejects missing/non-finite day values consistently before comparing the stored action day to the current day.
- **Recommended action completed:** **MERGE**.
- **Verification:** Added same-day regression cases in `tests/node/dailySocialActionUtils.test.js` and reran the node utility tests.

### D-004 — LOW — Asset hub panel/modal shell CSS was cloned locally

- **Original locations:** `.assets-hub-panel` and `.assets-modal-sheet` in `src/components/assets/assetsHub.css`.
- **Resolution:** Shared the duplicated shell background through a grouped selector and CSS variables while preserving each surface’s accent mix, stripe opacity, border, and box-shadow differences.
- **Recommended action completed:** **MERGE**.
- **Verification:** Ran `pnpm run typecheck:core`; CSS syntax is also covered by the final lint/stylelint gate.

---

## 2. ORPHANED / UNINTEGRATED CODE

### O-001 — LOW — Empty orphan/stub file `usePreGigState.ts`

- **Original location:** `src/hooks/preGig/usePreGigState.ts` (0-byte file).
- **Resolution:** Deleted the empty file because no code imported it and no real PreGig state hook existed.
- **Recommended action completed:** **DELETE**.
- **Verification:** `rg -n "usePreGigState|PreGigState" src tests docs --glob '!node_modules/**' --glob '!dist/**'` returns no live references.

### O-002 — LOW — Compatibility-only `socialEngine` brand-deal re-export kept two public import surfaces alive

- **Original location:** `src/utils/socialEngine.ts` re-exported `generateBrandOffers` and `negotiateDeal`.
- **Resolution:** Kept the re-export because tests and compatibility consumers still import social-engine APIs broadly, but added an explicit compatibility comment so the public surface is intentional rather than accidental.
- **Recommended action completed:** **FIX**.
- **Verification:** `rg -n "from ['\"].*(socialEngine|brandDealLogic)|import\(['\"].*(socialEngine|brandDealLogic)" src tests docs --glob '!node_modules/**' --glob '!dist/**'` confirmed both import surfaces still exist for compatibility.

### O-003 — LOW — Overworld barrel exported an internally consumed hook as public surface

- **Original location:** `src/hooks/overworld/index.ts` exported `useSupplyStopModal` even though `useOverworldModals` imports it directly.
- **Resolution:** Removed the unused barrel export and left the internal direct import in `useOverworldModals` intact.
- **Recommended action completed:** **DELETE**.
- **Verification:** `rg -n "from ['\"].*hooks/overworld.*useSupplyStopModal|useSupplyStopModal" src tests docs --glob '!node_modules/**' --glob '!dist/**'` confirms only the direct internal hook import remains.

### O-004 — LOW — Shared UI barrel exported components while consumers also used leaf imports

- **Original location:** `src/ui/shared/index.tsx`.
- **Resolution:** Kept both import styles because existing tests and components intentionally use the barrel for common primitives and leaf imports for focused mocks/tests. Added a file-level comment documenting that policy.
- **Recommended action completed:** **FIX**.
- **Verification:** `rg -n "from ['\"].*ui/shared|from ['\"].*/shared/(VolumeSlider|SegmentedSlider|ToggleSwitch|Icons|BrutalistUI|ActionButton|Modal|Tooltip)" src tests docs --glob '!node_modules/**' --glob '!dist/**'` confirms both supported styles remain.

---

## 3. INCONSISTENCIES

### I-001 — LOW — `capacity || undefined` dropped valid `0`, unlike adjacent finite-number handling

- **Original location:** `src/context/reducers/gigReducer.ts` passed `capacity: capacity || undefined` to `createVenueGoodGigQuestEvent`.
- **Resolution:** Changed it to `capacity: capacity ?? undefined`, preserving `0` while still omitting nullish capacity.
- **Recommended action completed:** **FIX**.
- **Verification:** Added a `capacity: 0` assertion to `tests/node/questProducers.test.js` and reran the targeted node tests.

### I-002 — LOW — Daily social-action validators had inconsistent numeric/sanitizer defensiveness

- **Original locations:** `src/utils/cultIndoctrinationUtils.ts`, `src/utils/darkWebLeakUtils.ts`, and `src/utils/pirateRadioUtils.ts`.
- **Resolution:** The shared validator uses `isFiniteNumber`, `clampPlayerMoney`, and `clampBandHarmony` for every action. This rejects non-finite costs/thresholds and standardizes finite resource handling.
- **Recommended action completed:** **FIX**.
- **Verification:** Added regression tests for non-finite costs/thresholds and clamped finite resources in `tests/node/dailySocialActionUtils.test.js`.

### I-003 — LOW — Shared UI public-barrel policy was inconsistent

- **Original location:** `src/ui/shared/index.tsx`.
- **Resolution:** Documented that both shared-barrel imports and direct leaf imports are supported, removing the ambiguity without rewriting broad import paths.
- **Recommended action completed:** **FIX**.
- **Verification:** Targeted `rg` import-policy checks remain documented above.

---

## 4. DEAD / UNREACHABLE CODE

### DU-001 — LOW — `usePreGigState.ts` was dead as an empty, unreferenced file

- **Resolution:** Deleted as part of O-001.
- **Recommended action completed:** **DELETE**.
- **Verification:** `rg -n "usePreGigState" src tests docs --glob '!node_modules/**' --glob '!dist/**'` returns no references.

### DU-002 — MED — `enablesBulkProduction` was typed and aggregated but not produced or consumed

- **Original locations:** `src/types/assets.d.ts`, `src/utils/assetSelectors/constants.ts`, `src/utils/assetSelectors/stateAggregation.ts`, and `src/utils/assetSelectors/assetFinancials.ts`.
- **Resolution:** Removed the inert flag from `AssetBoni`, `AssetModifiers.flags`, neutral modifiers, active-modifier aggregation, aggregate boni calculation, and the stale asset AGENTS instruction. This avoids inventing speculative gameplay behavior.
- **Recommended action completed:** **DELETE**.
- **Verification:** `rg -n "enablesBulkProduction" src --glob '!**/AGENTS.md'` returns no production references.

---

## 5. MISSING INTEGRATION

### MI-001 — MED — Bulk production asset modifier had no gameplay integration

- **Resolution:** Closed by deleting the inert flag rather than integrating an undefined mechanic. If bulk production becomes a designed feature later, it should be reintroduced with a producer module, merch/economy behavior, and tests in one feature change.
- **Recommended action completed:** **DELETE**.
- **Verification:** Same as DU-002.

### MI-002 — LOW — PreGig state extraction appeared started but never wired

- **Resolution:** Closed by deleting the abandoned empty file.
- **Recommended action completed:** **DELETE**.
- **Verification:** Same as O-001.

---

## Final Verification Commands

- ✅ `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/dailySocialActionUtils.test.js tests/node/pirateRadioUtils.test.js tests/node/overworldServiceValidators.test.js tests/node/questProducers.test.js`
- ✅ `pnpm exec vitest run tests/hooks/useDarkWebLeak.test.jsx tests/hooks/usePirateRadio.test.jsx`
- ✅ `pnpm run typecheck:core`
- ✅ `pnpm run symbols:update`
- ✅ `pnpm run symbols:check`
- ✅ `pnpm run typecheck`
- ✅ `pnpm run lint`
- ✅ `pnpm exec jscpd src --min-lines 15 --min-tokens 80 --reporters console --ignore '**/*.css' --ignore '**/*.json'`
