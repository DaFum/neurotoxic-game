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
npm run lint       # ESLint
npm run format     # Prettier --write .
```

Tests use Node's built-in `node:test` module with `tsx` for ESM transpilation. Test files live in `tests/`. To run a single test: `node --test --import tsx --experimental-test-module-mocks tests/economyEngine.test.js`

## Tech Stack & Version Constraints

| Category  | Technology    | Version                                |
| --------- | ------------- | -------------------------------------- |
| Framework | React         | 18.x (`^18.2.0`)                       |
| Build     | Vite          | 5.x (`^5.0.0`)                         |
| Language  | JavaScript    | ES2021 (ESModules, `"type": "module"`) |
| Rendering | Pixi.js       | 8.x (`^8.0.0`)                         |
| Animation | Framer Motion | 12.x (`^12.0.0`)                       |
| Styling   | Tailwind CSS  | 4.x (`^4.0.0`)                         |
| Audio     | Tone.js       | 15.x (`^15.1.22`)                      |

**DO NOT upgrade**: React (stay 18.x, not v19), Vite (stay 5.x), Tailwind (stay v4). Node.js 20+ required.

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
     OVERWORLD → PREGIG → GIG → POSTGIG → OVERWORLD
         ↓
     GAMEOVER → MENU
```

### Game Engines — `src/utils/`

Core logic lives in stateless utility modules:

- **eventEngine.js** — Event pool filtering/triggering based on conditions (day, location, harmony, money)
- **economyEngine.js** — Ticket sales, merch, expenses, gig financials
- **simulationUtils.js** — Daily updates (harmony decay, mood, stamina, social growth, van degradation)
- **mapGenerator.js** — Procedural Germany map with venue nodes and travel connections
- **audioEngine.js** — WebAudio/Tone.js synth, MIDI gig playback, timing clock
- **rhythmUtils.js** — 3-lane note spawning, hit windows (Perfect/Good/Miss)
- **socialEngine.js** — Follower growth and viral mechanics
- **errorHandler.js** — Typed errors (`GameError`, `StateError`, `AudioError`), toast dispatch

### Rhythm Game — `src/components/` + `src/hooks/`

- **PixiStageController.js** — Pixi.js app lifecycle, note sprites, animation loop
- **PixiStage.jsx** — React wrapper for the Pixi canvas
- **useRhythmGameLogic.js** — Keyboard input (arrow keys), combo tracking, hype calculation

### Custom Hooks — `src/hooks/`

- **useTravelLogic.js** — Travel, fuel consumption, event triggering on move
- **usePurchaseLogic.js** — Shop validation (`canAfford`, `isItemOwned`, `isItemDisabled`)
- **useAudioControl.js** — Ambient music toggle

### Data — `src/data/`

Static game data: `venues.js`, `characters.js`, `songs.js`, `upgrades.js`, `hqItems.js`, `chatter.js`. Events are split by category under `data/events/` (band, gig, financial, special, transport).

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

### State Safety

- Always clamp: `Math.max(0, player.money - cost)` — never let money go negative
- Validate `band.harmony > 0` before allowing gigs
- Use action creators from `actionCreators.js` for type-safe dispatch

### Pixi.js Memory Management

Always clean up Pixi apps on unmount to prevent leaks:

```jsx
const isMountedRef = useRef(true)
useEffect(() => {
  const app = new Application({ ... })
  return () => {
    isMountedRef.current = false
    app.destroy(true, { children: true, texture: true })
  }
}, [])
```

### Audio

Production requires HTTPS (WebAudio API mixed-content policy). Ambient tracks play full MIDI duration. Gig tracks play first 30-60 second excerpts.

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

Additional docs: `docs/ARCHITECTURE.md` (system diagrams), `docs/STATE_TRANSITIONS.md` (state machine), `docs/CODING_STANDARDS.md`, `docs/TAILWIND_V4_PATTERNS.md`.

## CI/CD

- **deploy.yml** — Builds and deploys `dist/` to GitHub Pages on push to `main`
- **super-linter.yml** — ESLint on PRs and pushes to `main`
- **lint-fix-preview.yml** — Prettier/ESLint auto-fix preview on PRs

Commits use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
