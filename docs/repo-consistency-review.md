# Repository Consistency Review (2026-04-16)

## Table of Contents
- [Scope](#scope)
- [Findings and actions](#findings-and-actions)
- [Open points (intentionally not fully resolved in this pass)](#open-points-intentionally-not-fully-resolved-in-this-pass)
- [Risk assessment](#risk-assessment)


## Scope

Review and remediation focused on:

- docs/manifest drift,
- pnpm tooling consistency,
- script naming clarity,
- travel/arrival orchestration consistency,
- redundancy documentation.

## Findings and actions

### 1) Documentation drift

#### Finding

- `README.md` listed outdated React/Vite versions.
- `.devin/wiki.json` described stale architecture/tooling details.
- `docs/TEST_FAST_FEEDBACK_CHANGES.md` did not reflect current workflow/tooling precisely.

#### Action

- Synced README version lines to `package.json` reality.
- Rewrote `.devin/wiki.json` into a concise, current-state note set.
- Replaced fast-feedback doc with current script/workflow mapping.

#### Decision

- Keep docs concise and factual; avoid speculative CI references.

---

### 2) Tooling inconsistency (`npm`/`npx` inside pnpm repo)

#### Finding

- `scripts/lint-fix-preview.sh` mixed `npm` and `npx` in a pnpm-first repository.

#### Action

- Migrated checks and invocations to `pnpm run` and `pnpm exec`.

#### Decision

- Canonical package manager is pnpm across local and CI automation.

---

### 3) Script naming clarity

#### Finding

- `test:vitest:node` name was easy to misread relative to script implementation (`run-vitest-ui.mjs` with node config override).

#### Action

- Added explicit script: `test:vitest:logic`.
- Kept `test:vitest:node` as backward-compatible alias.

#### Decision

- Improve semantic readability without breaking existing CI/local habits.

---

### 4) Travel/Arrival overlap

#### Finding

- Travel-event trigger logic was duplicated in `useTravelLogic` and `arrivalUtils`.
- Comments in `useArrivalLogic` referenced legacy behavior with ambiguous wording.

#### Action

- `useTravelLogic` delegates travel-event triggering to `arrivalUtils.processTravelEvents` only for non-performance destination nodes. It still handles transport/band travel events inline for GIG, FESTIVAL, and FINALE destinations.
- Updated `useArrivalLogic` comment to explicitly reflect the current behavior (i.e., delegated handling vs. inline handling) rather than implying a full consolidation.

#### Decision

- Keep split orchestration (`useTravelLogic` + `useArrivalLogic`) but unify shared travel-event semantics in one utility.

---

### 5) Mirror trees (`.agents` vs `.claude`)

#### Finding

- Large overlap exists (76 matching relative files), indicating high maintenance duplication risk.

#### Action

- Documented overlap in inventory report; no destructive deletion performed.

#### Decision

- Defer structural reduction until ownership/source generation strategy is agreed.

#### Agent guidance

- **Purpose:** agent instructions are for maintenance automation support (diagnostics, consistency checks, scripted refactors), not for defining runtime game rules.
- **Operational limitations:** treat source code + tests as canonical when instruction trees drift; avoid destructive repo-wide rewrites; keep changes scoped and verifiable.
- **Recommended usage scenarios:** use mirror-tree guidance for repetitive workflow tasks (test orchestration, docs consistency, migration checklists), then validate outcomes with project tests before merging.

---

### 6) Scene export strategy

#### Finding

- Lazy scene loading used a named-export adapter (`createNamedLazyLoader`) although scenes can be standardized on default exports.

#### Action

- Added default exports across lazy-loaded scene modules.
- Simplified `SceneRouter` lazy imports to direct `lazy(() => import(...))`.
- Removed `src/utils/lazySceneLoader.js` and its dedicated node test.

#### Decision

- Canonical scene lazy-load convention is now default-export based.

---

### 7) GameState API surface split (phased)

#### Finding

- Consumers depended on broad `useGameState()` contract mixing state and actions.

#### Action

- Introduced `useGameSelector` and `useGameActions` in `GameState`.
- Updated key consumers (`BandHQ`, `ToastOverlay`) to use selector/action split.
- Kept `useGameState()` for backward compatibility.

#### Decision

- Move to selector/action split incrementally without breaking existing callers.

---

### 8) Audio service contract (phased)

#### Finding

- Audio read/write paths were spread over manager/snapshot helpers in hooks.

#### Action

- Added `src/utils/audioService.js` with explicit surface (`getState`, `subscribe`, command methods).
- Updated `useAudioControl` to use the new service as its backing contract.

#### Decision

- Keep `useAudioControl` as thin adapter; centralize command/state access in `audioService`.

---

### 9) Structured toast payloads

#### Finding

- Multiple reducers/hooks encoded i18n context in pipe-delimited toast strings.

#### Action

- `createAddToastAction` now accepts structured payloads in addition to strings.
- Migrated quest/social/void-trade toasts to `messageKey` + `options`.
- Preserved legacy pipe-string parsing in `ToastOverlay` for compatibility.

#### Decision

- Structured payloads are preferred; string encoding remains legacy fallback.

---

### 10) Shop/upgrade tab duplication

#### Finding

- `ShopTab` and `UpgradesTab` duplicated item-grid and card rendering logic.

#### Action

- Added shared `CatalogTab` and routed both tabs through it.

#### Decision

- Keep tab-level wrappers for readability, centralize grid behavior in one component.

---

### 11) checkJs hardening (phased)

#### Finding

- Global `checkJs` remains disabled; no staged strict gate existed for high-risk domains.

#### Action

- Added `jsconfig.checkjs.json` targeting high-risk paths (state, rhythm hooks, audio, BandHQ).
- Added `typecheck:core` script (`tsc -p jsconfig.checkjs.json`).

#### Decision

- Enforce strict JS checking incrementally by domain, not as a single big-bang toggle.

## Open points (intentionally not fully resolved in this pass)

1. Full deduplication plan for `.agents/**` and `.claude/**` needs stakeholder decision (single source vs intentional dual-output).
2. E2E startup/audio instability remains partially documented via runtime skips in `e2e/game-flow.spec.js`; a deeper stabilization pass should isolate root causes per browser/audio init branch.
3. Wider travel/arrival refactor (single orchestrator hook) was intentionally deferred to avoid behavior risk without an expanded regression suite.
4. Remaining consumers still using legacy `useGameState()` should be migrated in batches to selector/action hooks.

## Risk assessment

- **Low risk:** doc/script alignment and alias script additions.
- **Low-medium risk:** travel-event helper delegation (covered by existing arrival/travel test suites and targeted reruns).
