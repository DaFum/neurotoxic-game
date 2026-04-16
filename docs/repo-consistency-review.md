# Repository Consistency Review (2026-04-16)

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
- `useTravelLogic` now delegates travel event trigger execution to `arrivalUtils.processTravelEvents`.
- Updated `useArrivalLogic` comment to describe current behavior explicitly.

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

## Open points (intentionally not fully resolved in this pass)

1. Full deduplication plan for `.agents/**` and `.claude/**` needs stakeholder decision (single source vs intentional dual-output).
2. E2E startup/audio instability remains partially documented via runtime skips in `e2e/game-flow.spec.js`; a deeper stabilization pass should isolate root causes per browser/audio init branch.
3. Wider travel/arrival refactor (single orchestrator hook) was intentionally deferred to avoid behavior risk without an expanded regression suite.

## Risk assessment

- **Low risk:** doc/script alignment and alias script additions.
- **Low-medium risk:** travel-event helper delegation (covered by existing arrival/travel test suites and targeted reruns).
