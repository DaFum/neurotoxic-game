# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NEUROTOXIC: GRIND THE VOID v3.0** — a web-based roguelike tour manager + rhythm action game. The player manages a Death Grindcore band touring Germany, navigating a procedural map, managing resources (money, fuel, harmony), and performing gigs via a 3-lane rhythm game rendered with Pixi.js at 60fps.

## Commands

```bash
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build to ./dist
npm run preview    # Preview production build locally
npm run test       # Node test runner (--import tsx --experimental-test-module-mocks)
npm run test:e2e   # Playwright end-to-end tests
npm run lint       # ESLint
npm run format     # Prettier --write .
```

Tests use Node's built-in `node:test` module with `tsx` for ESM transpilation. Test files live in `tests/`. To run a single test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/economyEngine.test.js`

## Tech Stack & Version Constraints

| Category  | Technology    | Version                                |
| --------- | ------------- | -------------------------------------- |
| Framework | React         | 19.2.4                                 |
| Build     | Vite          | 7.3.1                                  |
| Language  | JavaScript    | ES2021 (ESModules, `"type": "module"`) |
| Rendering | Pixi.js       | 8.16.0                                 |
| Animation | Framer Motion | 12.34.3                                |
| Styling   | Tailwind CSS  | 4.2.0                                  |
| Audio     | Tone.js       | 15.5.0                                 |

**DO NOT upgrade**: React (stay 19.2.4), Vite (stay 7.3.1), Tailwind (stay 4.2.0), Framer Motion (stay 12.34.3), Tone.js (stay 15.5.0). Node.js 22.3+ required.

## Architecture

### State Management — `src/context/`

All game state flows through a single React Context + `useReducer`:

- **GameState.jsx** — Provider + `useGameState()` hook exposing `player`, `band`, `social`, `settings`, `gameMap`, `currentGig`, `setlist`, plus dispatch wrappers (`updatePlayer()`, `updateBand()`, `changeScene()`, etc.)
- **gameReducer.js** — Centralized reducer with `ActionTypes` enum (`CHANGE_SCENE`, `UPDATE_PLAYER`, `UPDATE_BAND`, `ADVANCE_DAY`, `APPLY_EVENT_DELTA`, etc.)
- **actionCreators.js** — Factory functions for type-safe dispatch
- **initialState.js** — Default state (money: 500, day: 1, location: Stendal, 3 band members, harmony: 80)

### Scene System — `src/scenes/`

The game is a state machine. `App.jsx` switches on `currentScene` string:

```
INTRO → MENU ↔ SETTINGS | CREDITS
         ↓
      OVERWORLD ↔ TRAVEL_MINIGAME
          ↓
      OVERWORLD (or PREGIG if Performance)
          ↓
      PREGIG → PRE_GIG_MINIGAME → GIG → POSTGIG → OVERWORLD
```

### Game Engines — `src/utils/`

Core logic lives in stateless utility modules:

- **eventEngine.js** — Event pool filtering/triggering based on conditions (day, location, harmony, money) and choice resolution.
- **economyEngine.js** — Ticket sales, merch, expenses, gig financials. Travel only consumes fuel liters and food money; refueling at gas stations is the only monetary fuel cost. `calculateGigExpenses` focuses on performance modifiers and excludes travel overhead.
- **simulationUtils.js** — Daily updates (harmony decay, mood, stamina, social growth, van degradation, and **Passive Platform Perks** such as YouTube Ads, IG Endorsements, TikTok Surge, and Merch Sales).
- **mapGenerator.js** — Procedural Germany map with venue nodes and travel connections. Assigns `FESTIVAL` type to nodes with capacity ≥ 1000.
- **audioEngine.js** — Facade for audio/MIDI playback, timing clock, and WebAudio synth (see `src/utils/audio/`).
- **rhythmUtils.js** — 3-lane note spawning, hit windows (Perfect/Good/Miss).
- **socialEngine.js** — Dynamic social media post generation (`generatePostOptions`), resolution (`resolvePost`), follower growth mechanics, and virality.
- **errorHandler.js** — Typed errors (`GameError`, `StateError`, `AudioError`), toast dispatch.

### Rhythm Game — `src/components/` + `src/hooks/`

- **PixiStageController.js** — Pixi.js app lifecycle for Rhythm Game
- **PixiStage.jsx** — React wrapper for the Pixi canvas; accepts `controllerFactory` prop to inject different stage controllers (e.g. `TourbusStageController`, `RoadieStageController`).
- **stage managers under `src/components/stage/*`** — crowd/effects/lanes/notes managers + utils
- **useRhythmGameLogic.js** — Keyboard input (arrow keys), combo tracking, hype calculation; its `stats` object includes `accuracy` (0–100, live-computed from `perfectHits / (perfectHits + misses)`)
- **rhythm sub-hooks under `src/hooks/rhythmGame/*`** — split audio/input/loop/scoring/state orchestration; `useRhythmGameAudio` merges `calculateGigPhysics` multipliers into `gameStateRef.current.modifiers` so `useRhythmGameScoring` can apply band-trait bonuses without re-deriving them

### Custom Hooks — `src/hooks/`

- **useTravelLogic.js** — Travel, fuel consumption, event triggering on move
- **useArrivalLogic.js** — Shared arrival sequence (Save, Advance Day, Event Trigger) used by Travel Logic and Minigames.
- **usePurchaseLogic.js** — Shop validation (`canAfford`, `isItemOwned`, `isItemDisabled`)
- **useAudioControl.js** — Ambient music toggle
- **src/hooks/minigames/** — `useTourbusLogic.js`, `useRoadieLogic.js` (Minigame game loops)

### Data — `src/data/`

Static game data: `venues.js`, `characters.js`, `songs.js`, `upgrades.js`, `hqItems.js`, `chatter.js`, and `postOptions.js` (a condition-driven dictionary of dynamic social media actions). Event definitions live in `src/data/events/*` and are aggregated through `src/data/events.js`.

## Code Style

**Prettier**: Single quotes, no semicolons, 2-space indent, no trailing commas, arrow parens: avoid.

**ESLint**: `eslint:recommended` + `react` + `react-hooks` plugins. `no-unused-vars` warns (allows `_` prefix). Ignores `dist/` and `src/data/songs.js`.

**Naming**: Components PascalCase, functions/variables camelCase, constants SCREAMING_SNAKE_CASE.

**Component structure**: Hooks first → Effects → Handlers → Return JSX.

**Import order**: React → Third-party → Context/Hooks → Components → Utils/Data.

## Design System

<!-- jscpd:ignore-start -->

**Never hardcode colors.** Use CSS variables with Tailwind v4 syntax:

```jsx
// CORRECT (Tailwind v4)
<div className="bg-(--void-black) text-(--toxic-green)">

// WRONG (v3 bracket syntax)
<div className="bg-[var(--void-black)]">
```

In PixiJS, use `getPixiColorFromToken('--token-name')` instead of hex literals.

| Variable           | Hex     | Usage                     |
| ------------------ | ------- | ------------------------- |
| `--toxic-green`    | #00FF41 | Primary UI, text, borders |
| `--void-black`     | #0A0A0A | Backgrounds               |
| `--blood-red`      | #CC0000 | Errors, critical states   |
| `--ash-gray`       | #3A3A3A | Secondary text, borders   |
| `--warning-yellow` | #FFCC00 | Warnings                  |

<!-- jscpd:ignore-end -->

Typography: Headers use `var(--font-display)` (Metal Mania), body uses `var(--font-ui)` (Courier New monospace). Aesthetic is brutalist — uppercase buttons, boxy layouts, CRT overlay when `settings.crtEnabled`, glitch effects on hover/critical states.

## Critical Patterns

### Minigame Architecture

- **Separation of Concerns**: Logic lives in hooks (`useTourbusLogic`, `useRoadieLogic`), rendering in `StageController` classes (`TourbusStageController`, `RoadieStageController`), and state persistence in `gameReducer`.
- **Testing**: Minigame logic must be tested via unit tests (e.g., `tests/minigameState.test.js`) separate from PixiJS rendering tests.

### State Safety

- Always clamp: `Math.max(0, player.money - cost)` — never let money go negative
- Validate `band.harmony > 0` before allowing gigs
- Use action creators from `actionCreators.js` for type-safe dispatch

### Pixi.js Memory Management

Always clean up Pixi apps on unmount to prevent leaks. Use v8 destroy signature:

```jsx
const isMountedRef = useRef(true)
useEffect(() => {
  const app = new Application({ ... })
  return () => {
    isMountedRef.current = false
    // v8 signature: destroy(rendererOptions, destroyOptions)
    app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })
  }
}, [])
```

### Audio

Production requires HTTPS (WebAudio API mixed-content policy). Ambient playback is started by main-menu tour actions via `AudioManager.startAmbient()`, preferring OGG playback with MIDI fallback; gig playback uses configured excerpts and bounded playback windows. Audio logic is implemented in `src/utils/audio/`.

- **Tone.js Only**: The project uses Tone.js wrappers for audio playback and synthesis. Do NOT introduce Howler.js.
- **Multi-Song Gigs**: Sequential playback is driven by `setlistCompleted` (set when `playSongAtIndex` exhausts the setlist) together with `isNearTrackEnd` (gig clock ≥ `totalDuration − 300 ms`). Do **not** re-introduce `audioPlaybackEnded` — that flag is legacy and was replaced by this dual-gate mechanism. When the last song's `onEnded` fires, `totalDuration` is snapped to the current frozen gig-clock value so the loop finalises on the next frame.
- **Note-driven audio end**: For songs with JSON notes, OGG/MIDI playback is capped to `maxNoteTime + NOTE_TAIL_MS` so music stops when bars finish falling, not at the end of the audio excerpt. For procedurally-generated songs (no JSON notes) the full excerpt duration is used.

## Sub-Agent Documentation

Each `src/` subdirectory contains an `AGENTS.md` with domain-specific guidance. Consult the relevant one when working in that area:

| Domain     | File                       |
| ---------- | -------------------------- |
| Context    | `src/context/AGENTS.md`    |
| Hooks      | `src/hooks/AGENTS.md`      |
| Scenes     | `src/scenes/AGENTS.md`     |
| Utils      | `src/utils/AGENTS.md`      |
| Components | `src/components/AGENTS.md` |
| Data       | `src/data/AGENTS.md`       |
| UI         | `src/ui/AGENTS.md`         |

Additional docs: `docs/ARCHITECTURE.md` (system diagrams), `docs/STATE_TRANSITIONS.md` (state machine), `docs/CODING_STANDARDS.md` (coding standards), `docs/TAILWIND_V4_PATTERNS.md` (tailwind v4 patterns), `docs/agent_knowledge_update.md` (agent knowledge update), `docs/TRAIT_SYSTEM.md` (trait system), `docs/CRISIS_MANAGEMENT.md` (crisis management), Exploration reports are available in `docs/*_Exploration_Report.md`.

## CI/CD

- **deploy.yml** — Builds and deploys `dist/` to GitHub Pages on push to `main`
- **super-linter.yml** — ESLint on PRs and pushes to `main`
- **lint-fix-preview.yml** — Prettier/ESLint auto-fix preview on PRs

Commits use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).

_Documentation sync: dependency/tooling baseline reviewed on 2026-02-23. Minigame architecture documented 2026-02-21. Economy refactor and map icons documented 2026-02-23. Social Engine Overhaul documented 2026-02-24. Brand Deals & Crisis Management added 2026-02-24. PostGig UI modularization completed 2026-02-24. State Validation & Brand Deal fixes 2026-02-25._
