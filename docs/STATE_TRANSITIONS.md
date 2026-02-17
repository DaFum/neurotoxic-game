# State Transitions Documentation

This document provides detailed information about state transitions in the Neurotoxic game, including state diagrams, transition rules, and debugging guidelines.

## Table of Contents

1. [Scene State Machine](#scene-state-machine)
2. [Event State Machine](#event-state-machine)
3. [Gig State Machine](#gig-state-machine)
4. [Player State Transitions](#player-state-transitions)
5. [Debugging State Issues](#debugging-state-issues)

---

## Scene State Machine

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> MENU: App Load

    state MENU {
        [*] --> idle
        idle --> loading: Load Save
        loading --> idle: Load Failed
        loading --> OVERWORLD: Load Success
    }

    state OVERWORLD {
        [*] --> idle
        idle --> traveling: Select Node
        traveling --> idle: Arrive
        idle --> showingHQ: Enter HQ
        showingHQ --> idle: Close HQ
        idle --> event: Event Triggered
        event --> idle: Event Resolved
    }

    state PREGIG {
        [*] --> selecting
        selecting --> ready: Confirm Setlist
        ready --> GIG: Start Gig
    }

    state GIG {
        [*] --> playing
        playing --> paused: Event Interrupt
        paused --> playing: Resume
        playing --> ended: Song Complete
        playing --> failed: Health = 0
    }

    state POSTGIG {
        [*] --> calculating
        calculating --> displaying: Stats Ready
        displaying --> OVERWORLD: Continue
    }

    MENU --> OVERWORLD: New Game
    MENU --> SETTINGS: Settings
    MENU --> CREDITS: Credits

    OVERWORLD --> PREGIG: Start Gig
    OVERWORLD --> GAMEOVER: Stranded
    OVERWORLD --> MENU: Quit

    GIG --> POSTGIG: Complete
    POSTGIG --> OVERWORLD: Continue
    POSTGIG --> GAMEOVER: Bankrupt

    GAMEOVER --> MENU: Restart

    SETTINGS --> MENU: Back
    CREDITS --> MENU: Back
```

### Scene Transition Rules

| From Scene | To Scene  | Trigger                    | Conditions                          |
| ---------- | --------- | -------------------------- | ----------------------------------- |
| MENU       | OVERWORLD | `changeScene('OVERWORLD')` | New game or valid save loaded       |
| OVERWORLD  | PREGIG    | `startGig(venue)`          | Harmony > 0, at GIG node            |
| PREGIG     | GIG       | `changeScene('GIG')`       | Setlist selected                    |
| GIG        | POSTGIG   | `changeScene('POSTGIG')`   | Song duration elapsed or health = 0 |
| POSTGIG    | OVERWORLD | `changeScene('OVERWORLD')` | User clicks continue                |
| ANY        | GAMEOVER  | `changeScene('GAMEOVER')`  | Money < 0 or stranded               |

---

## Event State Machine

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> idle: No Event

    idle --> checking: triggerEvent()
    checking --> idle: No Event Found
    checking --> active: Event Found

    state active {
        [*] --> displaying
        displaying --> choosing: User Views Options
        choosing --> resolving: User Selects Choice
        resolving --> applying: Calculate Delta
    }

    active --> idle: resolveEvent()

    note right of checking
        Checks:
        - Category filter
        - Trigger point
        - Cooldowns
        - Story flags
        - Probability
    end note

    note right of applying
        Applies:
        - Money changes
        - Band stat changes
        - Inventory changes
        - Flag updates
    end note
```

### Event Flow

```mermaid
sequenceDiagram
    participant S as Scene
    participant GS as GameState
    participant EE as EventEngine
    participant EM as EventModal
    participant ER as EventResolver

    S->>GS: triggerEvent(category, triggerPoint)
    GS->>EE: checkEvent(category, context, triggerPoint)

    alt Event Found
        EE->>EE: Filter by conditions
        EE->>EE: Calculate probability
        EE-->>GS: Return event
        GS->>GS: setActiveEvent(event)
        GS-->>EM: Render modal

        EM->>EM: Display choices
        EM->>GS: resolveEvent(choice)
        GS->>ER: resolveEventChoice(choice, context)
        ER-->>GS: {result, delta, outcomeText}

        GS->>GS: dispatch(APPLY_EVENT_DELTA)
        GS->>GS: setActiveEvent(null)
        GS-->>S: Event resolved
    else No Event
        EE-->>GS: Return null
        GS-->>S: Continue
    end
```

### Event Trigger Points

| Trigger Point | When Fired             | Category            |
| ------------- | ---------------------- | ------------------- |
| `travel`      | After arriving at node | `transport`, `band` |
| `gig_start`   | Before gig begins      | `gig`               |
| `gig_end`     | After gig completes    | `gig`, `financial`  |
| `daily`       | On day advance         | `band`, `financial` |
| `special`     | At special nodes       | `special`           |

---

## Gig State Machine

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> initializing: Enter Gig Scene

    state initializing {
        [*] --> loadingPhysics
        loadingPhysics --> generatingNotes
        generatingNotes --> startingAudio
        startingAudio --> ready
    }

    initializing --> running: Init Complete

    state running {
        [*] --> playing
        playing --> toxicMode: Overload = 100
        toxicMode --> playing: Toxic Timer Expires
    }

    running --> paused: Event Interrupt
    paused --> running: Event Resolved

    running --> ended: Duration Elapsed
    running --> failed: Health = 0

    ended --> POSTGIG: Auto Transition
    failed --> POSTGIG: Delayed Transition (4s)
```

### Gig State Variables

```javascript
gameStateRef = {
  running: boolean, // Is game loop active
  paused: boolean, // Is game paused
  isGameOver: boolean, // Has player failed
  startTime: number, // Game start timestamp
  pauseTime: number | null, // When paused (for time correction)
  totalDuration: number, // Song duration in ms
  speed: number, // Note scroll speed
  notes: Array, // Note objects
  lanes: Array, // Lane configurations
  modifiers: Object, // Active gig modifiers
  stats: {
    perfectHits: number,
    misses: number,
    maxCombo: number,
    peakHype: number
  }
}
```

### Hit Detection Flow

```mermaid
flowchart TB
    Input[User Input] --> Check{Note in Window?}
    Check -->|Yes| Hit[Register Hit]
    Check -->|No| Miss[Register Miss]

    Hit --> AddScore[Add Score]
    Hit --> AddCombo[Increment Combo]
    Hit --> AddHealth[Restore Health]
    Hit --> AddOverload[Add Overload]

    AddOverload --> ToxicCheck{Overload >= 100?}
    ToxicCheck -->|Yes| Toxic[Activate Toxic Mode]
    ToxicCheck -->|No| Continue[Continue]

    Miss --> ResetCombo[Reset Combo]
    Miss --> DecHealth[Decrease Health]

    DecHealth --> DeathCheck{Health <= 0?}
    DeathCheck -->|Yes| GameOver[Game Over]
    DeathCheck -->|No| Continue
```

---

## Player State Transitions

### Money Transitions

```mermaid
flowchart LR
    subgraph Income
        GigPay[Gig Payment]
        MerchSales[Merch Sales]
        Streaming[Streaming Revenue]
    end

    subgraph Expenses
        Travel[Travel Costs]
        Living[Daily Living]
        Refuel[Fuel Costs]
        Purchases[Shop Purchases]
    end

    Money((Money))

    GigPay -->|+| Money
    MerchSales -->|+| Money
    Streaming -->|+| Money

    Money -->|-| Travel
    Money -->|-| Living
    Money -->|-| Refuel
    Money -->|-| Purchases

    Money -->|<0| GameOver[GAME OVER]
```

### Fame Transitions

```mermaid
flowchart TB
    subgraph "Fame Sources"
        GigSuccess[Successful Gigs]
        ViralMoment[Viral Moments]
        Upgrades[Fame Upgrades]
    end

    Fame((Fame))

    GigSuccess --> Fame
    ViralMoment --> Fame
    Upgrades --> Fame

    Fame --> FameLevel[Fame Level]
    FameLevel --> Unlocks[New Venues/Items]
```

### Band Harmony Transitions

```mermaid
flowchart TB
    subgraph "Harmony Increases"
        RestStop[Rest Stops +20]
        Upgrades[Sound System +5]
        Catering[Catering Boost]
        Events[Positive Events]
    end

    subgraph "Harmony Decreases"
        Travel[Long Travel]
        Arguments[Band Arguments]
        BadGigs[Failed Gigs]
        NegEvents[Negative Events]
    end

    Harmony((Harmony))

    RestStop --> Harmony
    Upgrades --> Harmony
    Catering --> Harmony
    Events --> Harmony

    Travel --> Harmony
    Arguments --> Harmony
    BadGigs --> Harmony
    NegEvents --> Harmony

    Harmony -->|<= 0| CantPlay[Cannot Perform]
```

---

## Debugging State Issues

### Common State Problems

#### 1. State Not Updating

```javascript
// Wrong: Direct mutation
state.player.money = 100

// Correct: Use action creator
dispatch(createUpdatePlayerAction({ money: 100 }))
```

#### 2. Stale State in Callbacks

```javascript
// Wrong: Captures stale state
const handleClick = () => {
  console.log(state.player.money) // May be outdated
}

// Correct: Use ref or callback form
const handleClick = () => {
  setMoney(prev => {
    console.log(prev) // Current value
    return prev + 100
  })
}
```

#### 3. Race Conditions

```javascript
// Wrong: Multiple rapid updates
updatePlayer({ money: player.money + 100 })
updatePlayer({ money: player.money + 50 }) // Uses stale value

// Correct: Single update or functional update
updatePlayer({ money: player.money + 150 })
```

### Debug Tools

#### Error Log Inspection

```javascript
import { getErrorLog } from './utils/errorHandler'

// In DebugLogViewer or console
const errors = getErrorLog()
console.table(errors)
```

#### State Snapshot

```javascript
// In GameState.jsx, add to provider value:
__DEV_getState: () => state,

// In console:
const state = useGameState().__DEV_getState();
```

### State Validation Checklist

- [ ] All actions dispatched through action creators
- [ ] No direct state mutations
- [ ] Async operations properly handled
- [ ] Error states have recovery paths
- [ ] State migrations for saved games
- [ ] Default values for all optional fields

---

## State Migration

When adding new state fields, update the `LOAD_GAME` handler in `gameReducer.js`:

```javascript
// Example: Adding new player field
const mergedPlayer = {
  ...DEFAULT_PLAYER_STATE, // Includes new defaults
  ...loadedState.player, // Saved values override
  newField: loadedState.player?.newField ?? DEFAULT_PLAYER_STATE.newField
}
```

This ensures backward compatibility with existing save files.

_Documentation sync: dependency/tooling baseline reviewed on 2026-02-17._
