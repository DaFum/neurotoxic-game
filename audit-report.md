# Neurotoxic Code-Quality Audit Resolution Report

Audit/fix date: 2026-07-22
Repo: `/workspace/neurotoxic-game`
Primary scope: `src/`; tests were used to verify reference, reachability, and regression coverage.

## Process Summary

1. Reviewed root/scoped agent guidance before touching files.
2. Re-ran targeted audit verification (`rg`, `symbols`, and `jscpd`) from the original report.
3. Added regression tests first for behavior/integration findings where executable proof was useful.
4. Applied surgical fixes for finite-number safety, public-surface cleanup, generated-image fallback routing, schema integration, locale integrity, and reachability/parity coverage.
5. Regenerated and checked `symbols.json` after export/type-shape changes.
6. Ran targeted node/Vitest suites, lint, TypeScript gates, production build, symbol checks, and patch whitespace checks.

## Resolution Summary

| ID | Original category | Status | Action taken |
| --- | --- | --- | --- |
| DUP-001 | Duplicate daily social wrappers | Documented | Left explicit wrappers in place; existing shared daily-social primitives are already used and this remains a low-risk small-wrapper pattern. |
| DUP-002 | Duplicate HUD player status layout | Documented | Left in place because no HUD behavior changed; report records extraction as future opportunistic cleanup. |
| DUP-003 | Duplicate audio source fields | Fixed | Added shared `SongAudioSources` and reused it in rhythm setlist/raw song/audio runtime contracts. |
| DUP-004 | PreGig hook test seam | Fixed | Removed `usePreGigLogic.__testInternals`; tests now import pure helpers from `preGigUtils`. |
| ORPH-001 | Exported internal audio constructors | Fixed | Made `createLayeredSnare` and `buildDrumKit` module-private. |
| ORPH-002 | Exported internal event helper | Fixed | Made `appendEffectToResult` module-private. |
| ORPH-003 | Exported internal asset selector helper | Fixed | Made `getInstalledModules` module-private. |
| ORPH-004 | Exported local domain result interfaces | Fixed | Made `AvailableQuestOffer`, `QuestRewardResult`, and `QuestPenaltyResult` module-private. |
| ORPH-005 | Exported local tuning constants | Fixed | Made `LUCK_MOD_PER_POINT`, `REFINANCE_FEE_RATE`, and `DEBOUNCE_MS` module-private. |
| ORPH-006 | Unreferenced React SVG asset | Fixed | Deleted `src/assets/react.svg`. |
| ORPH-007 / INT-001 | Empty schema namespace | Fixed | Added `src/schemas/contraband.ts` and wired `src/data/contraband.ts` through `validateContrabandItem`. |
| ORPH-008 / INT-003 | Contraband schema test not reusable | Fixed | Updated `contraband.schema.test.js` to exercise `validateContrabandItem`. |
| INC-001 | Quest progress non-finite numeric guards | Fixed | Replaced bare numeric checks with `isFiniteNumber` / `finiteNumberOr` in quest progress matching/thresholds. |
| INC-002 | Cult indoctrination social sanitizer gap | Fixed | Added `lastCultIndoctrinationDay` to social nullable/numeric sanitizer field sets and tests. |
| INC-003 | PostGig `??` harmony penalty | Fixed | Used `finiteNumberOr(band.harmony, 1)` before deriving the pedal penalty. |
| INC-004 | Roadie `typeof === 'number'` damage display | Fixed | Used `finiteNumberOr` at the unknown minigame-state boundary. |
| INC-005 | Overworld map raw generated `<img>` | Fixed | Routed the map background through `FallbackImage` with a custom fallback source. |
| INC-006 | Brand-deal prompt localization mismatch | Fixed | Built generated art prompts from translated display name/description when available. |
| DEAD-001 | Legacy travel arrival fallback drift risk | Guarded | Kept the intentional fallback and added a parity test for shared arrival side effects and gig-node policy. |
| INT-002 | Cult Indoctrination reachability coverage | Fixed | Added an `OverworldMenu` reachability test for the HUSTLES menu item. |
| INT-004 | Locale duplicate/parity guard | Fixed | Added `localeIntegrity.test.js` for EN/DE namespace parity and duplicate-key scanning. |

## Notable Implementation Details

### Numeric and state-safety fixes

- `QuestProgress` now requires finite `minScore` and finite event score values before matching score-gated rules, and threshold fields use `finiteNumberOr` instead of bare `typeof` checks.
- `createUpdateSocialAction` now treats `lastCultIndoctrinationDay` like the other nullable numeric social cooldown day fields.
- `usePostGigLogic` and `RoadieRunScene` now normalize potentially non-finite values before derived UI calculations.

### Public API cleanup

- Internal helpers that had no external `src`/`tests` consumers were made module-private rather than documented as public API.
- The obsolete Vite `react.svg` asset was removed after `rg` found no references.
- `SongAudioSources` now centralizes the `sourceMid` / `sourceOgg` pair that drives audio asset lookup.

### Integration coverage

- Contraband data now validates each item through `src/schemas/contraband.ts` before populating lookup maps.
- Locale integrity coverage now checks EN/DE namespace/key parity and scans JSON source text for duplicate object keys before parsing.
- Overworld menu coverage now asserts Cult Indoctrination remains reachable from HUSTLES.
- Travel fallback coverage now guards that the legacy arrival path and minigame arrival path both advance the day, process travel events, move/check rivals, and do not opt into gig-node travel events.

## Verification Commands

```bash
# RED checks observed before implementation
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/actionCreators.test.js tests/node/questSystem.test.js
pnpm exec vitest run tests/ui/usePostGigLogic.test.jsx tests/ui/RoadieRunScene.test.jsx tests/ui/BrandDealsTab.test.jsx tests/ui/OverworldMenu.test.jsx --reporter=dot
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/contraband.schema.test.js

# Targeted green checks
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/contraband.schema.test.js
node --test tests/node/localeIntegrity.test.js
node --test tests/node/travelArrivalParity.test.js
pnpm exec vitest run tests/ui/PreGig.test.jsx --reporter=dot
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/actionCreators.test.js tests/node/questSystem.test.js tests/node/contraband.schema.test.js tests/node/localeIntegrity.test.js tests/node/travelArrivalParity.test.js
pnpm exec vitest run tests/ui/usePostGigLogic.test.jsx tests/ui/RoadieRunScene.test.jsx tests/ui/BrandDealsTab.test.jsx tests/ui/OverworldMenu.test.jsx tests/ui/PreGig.test.jsx --reporter=dot

# Lint, type, build, symbol, and patch gates
pnpm run lint
pnpm run typecheck:core
pnpm run typecheck
pnpm run symbols:update
pnpm run symbols:check
git diff --check
pnpm run build

# Post-fix reference checks
rg -n "export function createLayeredSnare|export function buildDrumKit|export const appendEffectToResult|export const getInstalledModules|export const LUCK_MOD_PER_POINT|export const REFINANCE_FEE_RATE|export const DEBOUNCE_MS|export interface AvailableQuestOffer|export interface QuestRewardResult|export interface QuestPenaltyResult" src
rg -n "react\.svg|ReactComponent|vite\.svg" src tests public index.html package.json
rg --files src/schemas
rg -n "validateContrabandItem|src/schemas|schemas/contraband" src tests package.json --glob '!src/schemas/AGENTS.md'
```
