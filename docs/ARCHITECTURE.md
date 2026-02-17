# Neurotoxic Game Architecture

This document provides a comprehensive overview of the game's architecture, including module relationships, state management, and component interactions.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Module Dependency Graph](#module-dependency-graph)
3. [State Management](#state-management)
4. [Scene Flow](#scene-flow)
5. [Component Hierarchy](#component-hierarchy)
6. [Error Handling](#error-handling)

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Entry Points"
        HTML[index.html]
        Main[main.jsx]
    end

    subgraph "Application Layer"
        App[App.jsx]
        EB[ErrorBoundary]
    end

    subgraph "State Management"
        GSP[GameStateProvider]
        GR[gameReducer]
        IS[initialState]
        AC[actionCreators]
    end

    subgraph "Scenes"
        Menu[MainMenu]
        OW[Overworld]
        PG[PreGig]
        Gig[Gig]
        POG[PostGig]
        Set[Settings]
        GO[GameOver]
        Cred[Credits]
    end

    subgraph "UI Components"
        HUD[HUD]
        EM[EventModal]
        BHQ[BandHQ]
        Toast[ToastOverlay]
        DL[DebugLogViewer]
    end

    subgraph "Game Components"
        PSC[PixiStageController]
        PS[PixiStage]
        CO[ChatterOverlay]
        TM[TutorialManager]
    end

    subgraph "Core Systems"
        EE[eventEngine]
        ECO[economyEngine]
        SIM[simulationUtils]
        MG[mapGenerator]
        AM[AudioManager]
        AE[audioEngine]
    end

    subgraph "Data Layer"
        CHAR[characters]
        VEN[venues]
        EVT[events]
        UPG[upgrades]
        HQI[hqItems]
    end

    HTML --> Main
    Main --> EB
    EB --> App
    App --> GSP
    GSP --> GR
    GR --> IS
    GR --> AC

    GSP --> Menu
    GSP --> OW
    GSP --> PG
    GSP --> Gig
    GSP --> POG
    GSP --> Set
    GSP --> GO
    GSP --> Cred

    App --> HUD
    App --> EM
    App --> Toast
    App --> DL
    App --> TM

    OW --> BHQ
    OW --> CO
    OW --> MG
    OW --> ECO
    OW --> AM

    Gig --> PSC
    Gig --> PS
    Gig --> AE
    Gig --> SIM

    GSP --> EE
    POG --> ECO
    PG --> SIM

    EE --> EVT
    MG --> VEN
    IS --> CHAR
    BHQ --> HQI
    BHQ --> UPG
```

---

## Module Dependency Graph

```mermaid
graph LR
    subgraph "Context Layer"
        GameState[GameState.jsx]
        initialState[initialState.js]
        gameReducer[gameReducer.js]
        actionCreators[actionCreators.js]
    end

    subgraph "Utils Layer"
        eventEngine[eventEngine.js]
        economyEngine[economyEngine.js]
        simulationUtils[simulationUtils.js]
        mapGenerator[mapGenerator.js]
        AudioManager[AudioManager.js]
        audioEngine[audioEngine.js]
        errorHandler[errorHandler.js]
        logger[logger.js]
        gameStateUtils[gameStateUtils.js]
        rhythmUtils[rhythmUtils.js]
        gigStats[gigStats.js]
    end

    subgraph "Data Layer"
        characters[characters.js]
        venues[venues.js]
        events[events/]
        upgrades[upgrades.js]
        hqItems[hqItems.js]
        songs[songs.js]
    end

    GameState --> initialState
    GameState --> gameReducer
    GameState --> actionCreators
    GameState --> eventEngine
    GameState --> mapGenerator
    GameState --> errorHandler
    GameState --> logger

    gameReducer --> initialState
    gameReducer --> gameStateUtils
    gameReducer --> simulationUtils
    gameReducer --> logger

    initialState --> characters

    eventEngine --> events
    economyEngine --> venues
    mapGenerator --> venues

    errorHandler --> logger
```

---

## State Management

### State Structure

```mermaid
graph TB
    subgraph "Global State"
        CS[currentScene]

        subgraph "Player State"
            PM[money]
            PD[day]
            PL[location]
            PF[fame]
            PV[van]
        end

        subgraph "Band State"
            BM[members]
            BH[harmony]
            BI[inventory]
            BP[performance]
        end

        subgraph "Social State"
            SI[instagram]
            ST[tiktok]
            SY[youtube]
        end

        GM[gameMap]
        CG[currentGig]
        SL[setlist]
        AE[activeEvent]
        TS[toasts]
        GM2[gigModifiers]
    end
```

### Action Flow

```mermaid
sequenceDiagram
    participant C as Component
    participant D as Dispatch
    participant AC as ActionCreator
    participant R as Reducer
    participant S as State

    C->>AC: Call action creator
    AC->>D: Return action object
    D->>R: Dispatch action
    R->>R: Process action type
    R->>S: Return new state
    S->>C: Re-render with new state
```

### Action Types

| Action Type         | Description          | Payload                    |
| ------------------- | -------------------- | -------------------------- |
| `CHANGE_SCENE`      | Navigate to a scene  | `string` (scene name)      |
| `UPDATE_PLAYER`     | Update player stats  | `object` (partial player)  |
| `UPDATE_BAND`       | Update band stats    | `object` (partial band)    |
| `UPDATE_SOCIAL`     | Update social media  | `object` (partial social)  |
| `SET_MAP`           | Set generated map    | `object` (map data)        |
| `START_GIG`         | Begin gig sequence   | `object` (venue)           |
| `SET_ACTIVE_EVENT`  | Show event modal     | `object` (event) or `null` |
| `APPLY_EVENT_DELTA` | Apply event effects  | `object` (delta)           |
| `ADVANCE_DAY`       | Progress to next day | none                       |
| `LOAD_GAME`         | Load saved state     | `object` (save data)       |
| `RESET_STATE`       | Reset to initial     | none                       |

---

## Scene Flow

```mermaid
stateDiagram-v2
    [*] --> MENU

    MENU --> OVERWORLD: Start Game
    MENU --> SETTINGS: Open Settings
    MENU --> CREDITS: View Credits

    OVERWORLD --> PREGIG: Select Venue
    OVERWORLD --> MENU: Return to Menu
    OVERWORLD --> GAMEOVER: Stranded

    PREGIG --> GIG: Start Performance
    PREGIG --> OVERWORLD: Cancel

    GIG --> POSTGIG: Gig Complete
    GIG --> POSTGIG: Band Collapsed

    POSTGIG --> OVERWORLD: Continue Tour
    POSTGIG --> GAMEOVER: Bankrupt

    GAMEOVER --> MENU: Try Again

    SETTINGS --> MENU: Back
    CREDITS --> MENU: Back
```

---

## Component Hierarchy

```mermaid
graph TB
    subgraph "App.jsx"
        GSP[GameStateProvider]

        subgraph "Global Overlays"
            HUD[HUD]
            EM[EventModal]
            Toast[ToastOverlay]
            Debug[DebugLogViewer]
            TM[TutorialManager]
        end

        subgraph "Scene Router"
            GC[GameContent]
        end
    end

    GSP --> GC
    GSP --> HUD
    GSP --> EM
    GSP --> Toast
    GSP --> Debug
    GSP --> TM

    subgraph "Overworld Scene"
        OW[Overworld]
        TR[ToggleRadio]
        BHQ[BandHQ]
        CO[ChatterOverlay]
        MapSVG[Map SVG]
        Nodes[Node Components]
    end

    GC --> OW
    OW --> TR
    OW --> BHQ
    OW --> CO
    OW --> MapSVG
    OW --> Nodes

    subgraph "BandHQ Modal"
        Stats[Stats Tab]
        Shop[Shop Tab]
        Upgrades[Upgrades Tab]
        SB[StatBox]
        PB[ProgressBar]
    end

    BHQ --> Stats
    BHQ --> Shop
    BHQ --> Upgrades
    Stats --> SB
    Stats --> PB

    subgraph "Gig Scene"
        Gig[Gig]
        RGL[useRhythmGameLogic]
        PS[PixiStage]
        PSC[PixiStageController]
    end

    GC --> Gig
    Gig --> RGL
    Gig --> PS
    PS --> PSC
```

---

## Error Handling

### Error Hierarchy

```mermaid
graph TB
    GE[GameError]
    GE --> SE[StateError]
    GE --> AE[AudioError]
    GE --> STE[StorageError]
    GE --> RE[RenderError]
    GE --> GLE[GameLogicError]
```

### Error Flow

```mermaid
sequenceDiagram
    participant C as Component
    participant EH as ErrorHandler
    participant L as Logger
    participant T as Toast
    participant EL as ErrorLog

    C->>EH: handleError(error, options)
    EH->>EH: Classify error
    EH->>EL: Store in error log

    alt High Severity
        EH->>L: logger.error()
        EH->>T: Show error toast
    else Medium Severity
        EH->>L: logger.warn()
        EH->>T: Show warning toast
    else Low Severity
        EH->>L: logger.debug()
    end
```

### Error Categories

| Category     | Description              | Severity | Recoverable |
| ------------ | ------------------------ | -------- | ----------- |
| `STATE`      | State management errors  | High     | Yes         |
| `RENDER`     | Rendering/display errors | High     | No          |
| `AUDIO`      | Audio playback issues    | Low      | Yes         |
| `STORAGE`    | LocalStorage operations  | Medium   | Yes         |
| `GAME_LOGIC` | Game rule violations     | Medium   | Yes         |
| `UNKNOWN`    | Unclassified errors      | Medium   | Yes         |

---

## File Structure

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root component
├── index.css                   # Global styles
│
├── context/                    # State management
│   ├── GameState.jsx          # Provider & hooks
│   ├── initialState.js        # Default state
│   ├── gameReducer.js         # Reducer logic
│   └── actionCreators.js      # Action factories
│
├── scenes/                     # Major game scenes
│   ├── MainMenu.jsx
│   ├── Overworld.jsx
│   ├── PreGig.jsx
│   ├── Gig.jsx
│   ├── PostGig.jsx
│   ├── Settings.jsx
│   ├── Credits.jsx
│   └── GameOver.jsx
│
├── ui/                         # UI components
│   ├── HUD.jsx
│   ├── EventModal.jsx
│   ├── BandHQ.jsx
│   ├── UpgradeMenu.jsx
│   ├── ToastOverlay.jsx
│   ├── DebugLogViewer.jsx
│   ├── CrashHandler.jsx
│   └── GlitchButton.jsx
│
├── components/                 # Game components
│   ├── PixiStageController.js
│   ├── PixiStage.jsx
│   ├── ChatterOverlay.jsx
│   └── TutorialManager.jsx
│
├── hooks/                      # Custom hooks
│   ├── useRhythmGameLogic.js
│   ├── useTravelLogic.js
│   └── usePurchaseLogic.js
│
├── utils/                      # Utility modules
│   ├── eventEngine.js
│   ├── economyEngine.js
│   ├── simulationUtils.js
│   ├── mapGenerator.js
│   ├── AudioManager.js
│   ├── audioEngine.js
│   ├── errorHandler.js
│   ├── logger.js
│   ├── gameStateUtils.js
│   ├── rhythmUtils.js
│   ├── gigStats.js
│   ├── imageGen.js
│   ├── pixiStageUtils.js
│   ├── socialEngine.js
│   └── eventResolver.js
│
├── systems/                    # Game systems
│   └── SoundSynthesizer.js
│
└── data/                       # Static data
    ├── characters.js
    ├── venues.js
    ├── songs.js
    ├── upgrades.js
    ├── hqItems.js
    ├── chatter.js
    └── events/
        ├── band.js
        ├── gig.js
        ├── special.js
        ├── financial.js
        └── transport.js
```

---

## Dependency Injection Pattern

The codebase uses a lightweight dependency injection approach through React Context:

```javascript
// Provider wraps the app
;<GameStateProvider>
  <App />
</GameStateProvider>

// Components consume via hook
const { player, updatePlayer, addToast } = useGameState()
```

This pattern ensures:

- **Testability**: Components can receive mock state/actions
- **Decoupling**: Components don't import state directly
- **Consistency**: Single source of truth for game state

---

## Best Practices

1. **State Updates**: Always use action creators instead of raw dispatch
2. **Error Handling**: Use the centralized `handleError` function
3. **Logging**: Use the `logger` utility for consistent logging
4. **Type Safety**: Action types are centralized in `ActionTypes` enum
5. **Modularity**: Keep files focused on single responsibilities

_Documentation sync: dependency/tooling baseline reviewed on 2026-02-17._
