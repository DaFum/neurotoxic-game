# Neurotoxic Game Architecture

This document is a code-aligned architecture snapshot for the current `main` app runtime.

## Runtime Overview

- **App shell**: `src/main.jsx` mounts `App` and imports global styles from `src/index.css`.
- **Root composition**: `src/App.jsx` wraps the game in `ErrorBoundary` + `GameStateProvider`, then renders scene content, overlays, analytics, and dev-only debug tools.
- **Scene routing**: scene selection is controlled by `currentScene` in global state (`INTRO`, `MENU`, `SETTINGS`, `CREDITS`, `GAMEOVER`, `OVERWORLD`, `PREGIG`, `GIG`, `POSTGIG`).
- **Lazy loading**: heavy scenes are lazy-loaded through `createNamedLazyLoader` (`src/utils/lazySceneLoader.js`) to reduce first-render bundle work.

## Source Layout (Current)

```text
src/
├── App.jsx
├── main.jsx
├── index.css
├── assets/
├── components/
│   ├── PixiStage.jsx
│   ├── PixiStageController.js
│   ├── GigHUD.jsx
│   ├── HecklerOverlay.jsx
│   ├── ChatterOverlay.jsx
│   ├── ToggleRadio.jsx
│   ├── TutorialManager.jsx
│   └── stage/
│       ├── utils.js              # Stage-specific utilities
│       └── ...                   # Pixi manager classes
├── context/
│   ├── GameState.jsx
│   ├── initialState.js
│   ├── gameReducer.js
│   └── actionCreators.js
├── data/
│   ├── events.js
│   ├── venues.js
│   ├── songs.js
│   ├── chatter.js
│   ├── upgrades.js
│   ├── upgradeCatalog.js
│   ├── hqItems.js
│   └── events/
├── hooks/
│   ├── useTravelLogic.js
│   ├── usePurchaseLogic.js
│   ├── useAudioControl.js
│   ├── useRhythmGameLogic.js
│   └── rhythmGame/
│       ├── useRhythmGameAudio.js
│       ├── useRhythmGameInput.js
│       ├── useRhythmGameLoop.js
│       ├── useRhythmGameScoring.js
│       └── useRhythmGameState.js
├── scenes/
│   ├── IntroVideo.jsx
│   ├── MainMenu.jsx
│   ├── Overworld.jsx
│   ├── PreGig.jsx
│   ├── Gig.jsx
│   ├── PostGig.jsx
│   ├── Settings.jsx
│   ├── Credits.jsx
│   └── GameOver.jsx
├── ui/
│   ├── HUD.jsx
│   ├── EventModal.jsx
│   ├── ToastOverlay.jsx
│   ├── DebugLogViewer.jsx
│   ├── BandHQ.jsx
│   ├── GlitchButton.jsx
│   ├── CrashHandler.jsx
│   └── shared/
└── utils/
    ├── audio/
    │   ├── assets.js
    │   ├── constants.js
    │   ├── playback.js
    │   ├── procedural.js
    │   ├── setup.js
    │   ├── midiUtils.js
    │   ├── playbackUtils.js
    │   ├── selectionUtils.js
    │   ├── songUtils.js
    │   └── timingUtils.js
    ├── audioEngine.js
    ├── AudioManager.js
    ├── eventEngine.js
    ├── mapGenerator.js
    ├── economyEngine.js
    ├── simulationUtils.js
    ├── gameStateUtils.js
    ├── saveValidator.js
    └── ...
```

## State Model

Global state lives in `GameStateProvider` and is mutated only through reducer actions.

### High-level slices

- `currentScene`
- `player` (money/day/time/location/van/fame/tutorial state)
- `band` (members/harmony/inventory/performance)
- `social`
- `gameMap`
- `currentGig`, `setlist`, `lastGigStats`
- `activeEvent`, `pendingEvents`, `eventCooldowns`, `activeStoryFlags`
- `toasts`
- `settings`
- `gigModifiers`

### Guardrails implemented in reducer

- `player.money` is clamped to `>= 0` via shared state guards (`clampPlayerMoney`)
- `band.harmony` is clamped to `1..100` via shared state guards (`clampBandHarmony`)
- event flags are orchestration-only and do not mutate non-canonical player stat fields
- Loaded scene values are validated against an allowlist
- State restoration is validated through `saveValidator` before reducer ingestion

## Core Flow

1. **Intro/Menu**
   - `INTRO` auto/transitions into `MENU`.
2. **Overworld loop**
   - Map travel, event checks, HQ/shop actions, resource updates.
3. **Gig loop**
   - `START_GIG` sets the venue and transitions to `PREGIG`, then `GIG`, then `POSTGIG`.
4. **Post-gig resolution**
   - Payout/stats/effects applied, then return to `OVERWORLD` or go to `GAMEOVER` if fail conditions are met.

## Diagnostics and Reliability

- `ErrorBoundary` (`src/ui/CrashHandler.jsx`) protects the app shell.
- `logger` + `DebugLogViewer` provide structured runtime diagnostics in development.
- `saveValidator` validates load payloads before state restoration.

---

_Last updated: 2026-02-19._
