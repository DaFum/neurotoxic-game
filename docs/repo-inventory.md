# Repository Inventory (Machine-Readable Companion: `docs/repo-inventory.json`)

Generated baseline: 2026-04-16.

## Aggregated tree snapshot

- `src/` (327 files)
  - `src/context/` state container, action creators, reducer slices
  - `src/hooks/` orchestration hooks (travel, arrival, rhythm, minigames)
  - `src/scenes/` scene-level route components
  - `src/utils/` pure logic + side-effect services (audio, save, map, events)
  - `src/components/` Pixi/scene-level rendering helpers
  - `src/ui/` reusable UI components
- `tests/` (351 files)
  - node:test suites under `tests/node`, reducers/context/event and golden-path checks
  - Vitest suites under `tests/ui` and mixed logic suites under `tests/utils`
- `.agents/` (125 files) and `.claude/` (123 files)
  - mirrored skill trees with substantial overlap (76 matching relative file paths)
- `.github/workflows/`
  - `test.yml`, `deploy.yml`, `lint-fix-preview.yml`
- `scripts/`
  - test runners and maintenance scripts (pnpm-oriented)

## Module/entity index summary

Data source: `docs/repo-inventory.json`.

- Total files indexed: **1035** (repo-wide count; not limited to the top-level snapshot bullets above).
- Modules with explicit exports: **349**
- Hook modules (`src/hooks/**`): **29**
- Context/reducer modules (`src/context/**`): **17**
- Utility modules (`src/utils/**`): **62**
- Scene modules (`src/scenes/**`): **58**
- UI/component modules (`src/ui/**`, `src/components/**`): **110**

## Domain map and canonical paths

### App bootstrap / routing

- Canonical boot: `src/main.jsx` -> `src/App.jsx`.
- Scene transitions are centralized through context actions (`src/context/actionCreators.js`, `src/context/gameReducer.js`).

### Context / reducer / state

- Public state API: `useGameState`, `useGameSelector`, `useGameActions`, `useGameDispatch`, `GameStateProvider` in `src/context/GameState.jsx`. `src/ui/BandHQ.jsx` and `src/ui/ToastOverlay.jsx` consume `useGameSelector`/`useGameActions`.
- Reducer entry: `gameReducer` in `src/context/gameReducer.js`.

### Hooks

- Travel orchestration: `src/hooks/useTravelLogic.js`.
- Arrival orchestration after travel minigame: `src/hooks/useArrivalLogic.js`.
- Rhythm orchestration facade + subhooks: `src/hooks/useRhythmGameLogic.js`, `src/hooks/rhythmGame/*`.

### Travel / arrival (focus)

- Canonical node-type behavior and event trigger helper: `src/utils/arrivalUtils.js`.
- Travel state updates at arrival: `src/utils/travelLogicUtils.js`.
- Access/resource checks: `src/utils/travelUtils.js`.
- **Current canonical orchestration split:**
  - Overworld click-to-travel path: `useTravelLogic`
  - Minigame-completion arrival path: `useArrivalLogic`

### Audio

- Single orchestrator service: `src/utils/AudioManager.js` + `src/utils/audio/*`.
- Hook integration boundary: `src/hooks/rhythmGame/useRhythmGameAudio.js`.

### API/backend-near helpers

- `lib/apiUtils.js`, `lib/redis.js`, and API route helpers under `api/` exist, but runtime gameplay remains frontend-first SPA.
- Treat backend-near files as optional integrations/auxiliary tooling unless an active deployment path explicitly wires them in.

### Tests

- Node runner domains: `tests/node/**` and additional node-managed dirs from `scripts/run-node-tests.mjs`.
- Vitest runner domains: `tests/ui/**` + vitest-configured logic suites.

### CI / scripts

- CI workflows now consistently assume pnpm.
- Local test orchestrators: `scripts/run-tests.mjs`, `scripts/run-node-tests.mjs`, `scripts/run-vitest-ui.mjs`.

## Agents

### Purpose and scope

- `.agents/` and `.claude/` are agent-instruction trees used by automated contributors and bot-style workflows.
- Both trees are currently discoverable in this repo and indexed in the machine-readable companion `docs/repo-inventory.json`.
- They are intended to accelerate repetitive maintenance tasks (testing, refactors, workflow guidance), not to define runtime game behavior.

### How to choose between `.agents/` and `.claude/`

- Prefer whichever tree is actively configured by your automation runner in the current environment.
- If both are available and equivalent for your task, prefer the one referenced by your CI/bot integration docs for consistency.
- If there is divergence between mirrored files, request maintainer clarification before treating either side as authoritative.

### Known limitations

- Overlap/mirroring exists and ownership is not fully explicit.
- Content may be duplicated across trees and can drift over time.
- Neither tree should be treated as canonical architecture truth when it conflicts with source code and tests.

### Contributor guidance

- Update `docs/repo-inventory.json` whenever agent-tree structure changes materially (added/removed directories, major reorganization).
- Keep `docs/repo-inventory.md` and `docs/repo-inventory.json` aligned so humans and tooling can locate mirrored files quickly.
- If/when a canonical owner/source is formalized, record it here and in repository governance docs.

## Legacy, duplication, and overlap markers

- `.agents/**` and `.claude/**` are overlapping mirror trees; keep as explicit duplication until ownership/source-of-truth is decided.
- Travel event triggering previously duplicated in `useTravelLogic`; now delegated to `arrivalUtils.processTravelEvents` for one shared behavior path.
- Script alias overlap remains intentional for DX compatibility (`test:vitest:node` retained as alias to `test:vitest:logic`).
- `SceneRouter` now relies on scene default exports directly; the named-export lazy adapter (`lazySceneLoader`) was removed.
