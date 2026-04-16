# Repository Inventory (Machine-Readable Companion: `docs/repo-inventory.json`)

Generated baseline: 2026-04-16.

## Aggregated tree snapshot

- `src/` (326 files)
  - `src/context/` state container, action creators, reducer slices
  - `src/hooks/` orchestration hooks (travel, arrival, rhythm, minigames)
  - `src/scenes/` scene-level route components
  - `src/utils/` pure logic + side-effect services (audio, save, map, events)
  - `src/components/` Pixi/scene-level rendering helpers
  - `src/ui/` reusable UI components
- `tests/` (352 files)
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

- Total files indexed: **741**
- Modules with explicit exports: **262**
- Hook modules (`src/hooks/**`): **29**
- Context/reducer modules (`src/context/**`): **17**
- Utility modules (`src/utils/**`): **62**
- Scene modules (`src/scenes/**`): **58**
- UI/component modules (`src/ui/**`, `src/components/**`): **44**

## Domain map and canonical paths

### App bootstrap / routing
- Canonical boot: `src/main.jsx` -> `src/App.jsx`.
- Scene transitions are centralized through context actions (`src/context/actionCreators.js`, `src/context/gameReducer.js`).

### Context / reducer / state
- Public state API: `useGameState`, `useGameDispatch`, `GameStateProvider` in `src/context/GameState.jsx`.
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
- `lib/apiUtils.js`, `lib/redis.js`, and API route helpers under `api/`.

### Tests
- Node runner domains: `tests/node/**` and additional node-managed dirs from `scripts/run-node-tests.mjs`.
- Vitest runner domains: `tests/ui/**` + vitest-configured logic suites.

### CI / scripts
- CI workflows now consistently assume pnpm.
- Local test orchestrators: `scripts/run-tests.mjs`, `scripts/run-node-tests.mjs`, `scripts/run-vitest-ui.mjs`.

## Legacy, duplication, and overlap markers

- `.agents/**` and `.claude/**` are overlapping mirror trees; keep as explicit duplication until ownership/source-of-truth is decided.
- Travel event triggering previously duplicated in `useTravelLogic`; now delegated to `arrivalUtils.processTravelEvents` for one shared behavior path.
- Script alias overlap remains intentional for DX compatibility (`test:vitest:node` retained as alias to `test:vitest:logic`).
