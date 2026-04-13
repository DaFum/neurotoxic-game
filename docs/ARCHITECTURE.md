# Neurotoxic Game Architecture

This document is a code-aligned architecture snapshot for the current `main` app runtime.

## Runtime Overview

- **App shell**: `src/main.jsx` mounts `App` and imports global styles from `src/index.css`.
- **Root composition**: `src/App.jsx` wraps the game in `ErrorBoundary` + `GameStateProvider`, then renders scene content, overlays, analytics, and dev-only debug tools.
- **Scene routing**: scene selection is controlled by `currentScene` in global state. The overworld supports multiple node types: `START`, `GIG`, `FESTIVAL`, `REST_STOP`, `SPECIAL`, and `FINALE`.
- **Lazy loading**: heavy scenes are lazy-loaded through `createNamedLazyLoader` (`src/utils/lazySceneLoader.js`) to reduce first-render bundle work.

## Source Layout (Current)

```text
src
├── assets/
├── components/
│   ├── clinic/
│   ├── hud/
│   ├── minigames/
│   ├── overworld/
│   ├── postGig/
│   ├── pregig/
│   ├── stage/
│   ├── ChatterOverlay.jsx
│   ├── GigHUD.jsx
│   ├── HecklerOverlay.jsx
│   ├── MapConnection.jsx
│   ├── MapNode.jsx
│   ├── MinigameSceneFrame.jsx
│   ├── PixiStage.jsx
│   ├── PixiStageController.js
│   ├── SceneRouter.jsx
│   ├── ToggleRadio.jsx
│   └── TutorialManager.jsx
├── context/
│   ├── reducers/
│   ├── GameState.jsx
│   ├── actionCreators.js
│   ├── actionTypes.js
│   ├── gameConstants.js
│   ├── gameReducer.js
│   └── initialState.js
├── data/
│   ├── chatter/
│   ├── events/
│   ├── brandDeals.js
│   ├── characters.js
│   ├── chatter.js
│   ├── hqItems.js
│   ├── platforms.js
│   ├── postOptions.js
│   ├── socialTrends.js
│   ├── songs.js
│   ├── upgradeCatalog.js
│   └── venues.js
├── hooks/
│   ├── minigames/
│   ├── rhythmGame/
│   ├── useArrivalLogic.js
│   ├── useAudioControl.js
│   ├── useBandHQModal.js
│   ├── useGigEffects.js
│   ├── useGigInput.js
│   ├── useLeaderboardSync.js
│   ├── usePurchaseLogic.js
│   ├── useQuestsModal.js
│   ├── useRhythmGameLogic.js
│   └── useTravelLogic.js
├── scenes/
│   ├── credits/
│   ├── gameover/
│   ├── intro/
│   ├── kabelsalat/
│   ├── mainmenu/
│   ├── AmpCalibrationScene.jsx
│   ├── ClinicScene.jsx
│   ├── Credits.jsx
│   ├── GameOver.jsx
│   ├── Gig.jsx
│   ├── IntroVideo.jsx
│   ├── KabelsalatScene.jsx
│   ├── MainMenu.jsx
│   ├── Overworld.jsx
│   ├── PostGig.jsx
│   ├── PreGig.jsx
│   ├── RoadieRunScene.jsx
│   ├── Settings.jsx
│   └── TourbusScene.jsx
├── schemas/
├── ui/
│   ├── bandhq/
│   ├── overworld/
│   ├── settings/
│   ├── shared/
│   ├── BandHQ.jsx
│   ├── BloodBankModal.jsx
│   ├── ContrabandStash.jsx
│   ├── CrashHandler.jsx
│   ├── DebugLogViewer.jsx
│   ├── EventModal.jsx
│   ├── GigModifierButton.jsx
│   ├── GlitchButton.jsx
│   ├── HUD.jsx
│   ├── MerchPressModal.jsx
│   ├── PirateRadioModal.jsx
│   ├── QuestsModal.jsx
│   └── ToastOverlay.jsx
├── utils/
│   ├── audio/
│   ├── AudioManager.js
│   ├── arrivalUtils.js
│   ├── audioContextState.js
│   ├── audioEngine.js
│   ├── clinicLogicUtils.js
│   ├── contrabandStashUtils.js
│   ├── contrabandUtils.js
│   ├── crypto.js
│   ├── economyEngine.js
│   ├── effectFormatter.js
│   ├── errorHandler.js
│   ├── eventEngine.js
│   ├── eventValidator.js
│   ├── gameStateUtils.js
│   ├── gigInputUtils.js
│   ├── gigStats.js
│   ├── hecklerLogic.js
│   ├── imageGen.js
│   ├── lazySceneLoader.js
│   ├── locationI18n.js
│   ├── logger.js
│   ├── mapGenerator.js
│   ├── mapUtils.js
│   ├── numberUtils.js
│   ├── pirateRadioUtils.js
│   ├── postGigUtils.js
│   ├── purchaseLogicUtils.js
│   ├── questUtils.js
│   ├── randomUtils.js
│   ├── rhythmGameAudioUtils.js
│   ├── rhythmGameInputUtils.js
│   ├── rhythmGameLoopUtils.js
│   ├── rhythmGameScoringUtils.js
│   ├── rhythmUtils.js
│   ├── saveValidator.js
│   ├── simulationUtils.js
│   ├── socialEngine.js
│   ├── stringUtils.js
│   ├── traitLogic.js
│   ├── traitUtils.js
│   ├── translationUtils.js
│   ├── travelLogicUtils.js
│   ├── travelUtils.js
│   ├── unlockCheck.js
│   ├── unlockManager.js
│   └── upgradeUtils.js
├── App.jsx
├── i18n.js
├── index.css
└── main.jsx
```

## State Model

Global state lives in `GameStateProvider` and is mutated only through reducer actions.

### High-level slices

- `currentScene`
- `player` (money/day/time/location/van/fame/tutorial state/stats)
- `band` (members/harmony/inventory/performance)
- `social` (platform followers, virality, controversy level, loyalty, ego focus, reputationCooldown)
- `gameMap`
- `currentGig`, `setlist`, `lastGigStats`
- `activeEvent`, `pendingEvents`, `eventCooldowns`, `activeStoryFlags`
- `toasts`
- `settings`
- `gigModifiers`
- `venueBlacklist`, `activeQuests`, `reputationByRegion`

### Guardrails implemented in reducer

- `player.money` is clamped to `>= 0` via shared state guards (`clampPlayerMoney`)
- `band.harmony` is clamped to `1..100` via shared state guards (`clampBandHarmony`)
- event flags are orchestration-only and do not mutate non-canonical player stat fields
- Loaded scene values are validated against an allowlist
- State restoration is validated through `saveValidator` before reducer ingestion

## Core Flow

The core game loop adheres to the following sequence:

```mermaid
graph TD
    A[INTRO] --> B[MENU]
    B --> C[OVERWORLD]

    C -- Travel --> D[TRAVEL_MINIGAME]
    D -- GIG/FESTIVAL/FINALE --> E[PREGIG]
    D -- Other Node --> C

    E -- Confirm Setlist --> F[PRE_GIG_MINIGAME]
    F -- Equipment Delivered --> G[GIG]
    G -- Song Complete --> H[POSTGIG]
    H -- Payout & Stats --> C
    H -- Fail Condition --> I[GAMEOVER]
```

### Economy Model

- Travel consumes **Fuel Liters** and **Money for Food**.
- **Refuel** action (at Overworld/Gas Stations) is the only place gas money is deducted.
- Post-Gig P&L reports only track performance-related income/expense, excluding travel overhead to ensure net profit matches wallet changes.

## Diagnostics and Reliability

- `ErrorBoundary` (`src/ui/CrashHandler.jsx`) protects the app shell.
- `logger` + `DebugLogViewer` provide structured runtime diagnostics in development.
- `saveValidator` validates load payloads before state restoration.

---

_Last updated: 2026-02-25. Consequence system, quest system, and source tree corrections applied._

