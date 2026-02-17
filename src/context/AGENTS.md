# src/context/AGENTS.md

## State Management Architect

This module contains the centralized state management system using React Context and useReducer pattern.

## Module Overview

| File                | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `GameState.jsx`     | React Context provider and `useGameState()` hook  |
| `initialState.js`   | Default state configurations and factory function |
| `gameReducer.js`    | Centralized reducer with ActionTypes enum         |
| `actionCreators.js` | Factory functions for creating dispatch actions   |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       GameState.jsx                          │
│  ┌─────────────────┐  ┌──────────────────────────────────┐ │
│  │ GameStateContext │  │ useGameState() hook              │ │
│  └────────┬────────┘  │ - player, band, social           │ │
│           │           │ - dispatch, changeScene          │ │
│           ▼           │ - updatePlayer, updateBand       │ │
│  ┌─────────────────┐  │ - addToast, triggerEvent        │ │
│  │ useReducer()    │  └──────────────────────────────────┘ │
│  │ (gameReducer,   │                                        │
│  │  initialState)  │                                        │
│  └────────┬────────┘                                        │
└───────────┼─────────────────────────────────────────────────┘
            │
   ┌────────┴────────┐
   ▼                 ▼
┌──────────────┐  ┌────────────────────┐
│ initialState │  │ gameReducer        │
│ .js          │  │ .js                │
│              │  │                    │
│ DEFAULT_*    │  │ ActionTypes enum   │
│ initialState │  │ Handler functions  │
│ createInitial│  │ State mutations    │
│ State()      │  │                    │
└──────────────┘  └────────┬───────────┘
                           │
                  ┌────────┴────────┐
                  ▼                 │
         ┌────────────────┐        │
         │ actionCreators │◄───────┘
         │ .js            │ (imports ActionTypes)
         │                │
         │ create*Action()│
         │ functions      │
         └────────────────┘
```

## State Shape

```javascript
{
  currentScene: 'MENU',           // Current game screen
  player: {
    money: 500,                   // Currency
    day: 1,                       // Game day
    time: 12,                     // Hour of day
    location: 'Stendal',          // Current city
    currentNodeId: 'node_0_0',    // Map position
    tutorialStep: 0,              // Tutorial progress
    fame: 0,                      // Fame points
    fameLevel: 0,                 // Fame tier
    hqUpgrades: [],               // Purchased HQ items
    passiveFollowers: 0,          // Auto followers
    van: {
      fuel: 100,                  // Current fuel
      condition: 100,             // Van health
      upgrades: [],               // Van upgrades
      breakdownChance: 0.05       // Breakdown probability
    }
  },
  band: {
    members: [...],               // Band member objects
    harmony: 80,                  // Band cohesion
    harmonyRegenTravel: false,    // Travel harmony bonus
    inventorySlots: 0,            // Extra inventory
    luck: 0,                      // Luck modifier
    performance: { ... },         // Performance modifiers
    inventory: { ... }            // Merch and supplies
  },
  social: {
    instagram: 228,               // Follower counts
    tiktok: 64,
    youtube: 14,
    newsletter: 0,
    viral: 0                      // Viral multiplier
  },
  gameMap: null,                  // Generated map data
  currentGig: null,               // Active gig venue
  setlist: [],                    // Selected songs
  lastGigStats: null,             // Post-gig results
  activeEvent: null,              // Current event modal
  toasts: [],                     // Notification queue
  activeStoryFlags: [],           // Story progress
  eventCooldowns: [],             // Event cooldown timers
  pendingEvents: [],              // Queued events
  reputationByRegion: {},         // Regional reputation
  settings: { crtEnabled: true }, // User settings
  npcs: {},                       // NPC states
  gigModifiers: { ... }           // Pre-gig choices
}
```

---

## ActionTypes

All action types are defined in `gameReducer.js`:

```javascript
import { ActionTypes } from './gameReducer'

// Scene navigation
ActionTypes.CHANGE_SCENE // payload: string

// State updates
ActionTypes.UPDATE_PLAYER // payload: object (partial player)
ActionTypes.UPDATE_BAND // payload: object (partial band)
ActionTypes.UPDATE_SOCIAL // payload: object (partial social)
ActionTypes.UPDATE_SETTINGS // payload: object (partial settings)

// Game flow
ActionTypes.SET_MAP // payload: map object
ActionTypes.SET_GIG // payload: gig object or null
ActionTypes.START_GIG // payload: venue object
ActionTypes.SET_SETLIST // payload: song array
ActionTypes.SET_LAST_GIG_STATS // payload: stats object

// Events
ActionTypes.SET_ACTIVE_EVENT // payload: event object or null
ActionTypes.APPLY_EVENT_DELTA // payload: delta object
ActionTypes.POP_PENDING_EVENT // no payload

// UI
ActionTypes.ADD_TOAST // payload: toast object
ActionTypes.REMOVE_TOAST // payload: toast id
ActionTypes.SET_GIG_MODIFIERS // payload: modifiers object

// Game management
ActionTypes.LOAD_GAME // payload: saved state
ActionTypes.RESET_STATE // no payload
ActionTypes.CONSUME_ITEM // payload: item key
ActionTypes.ADVANCE_DAY // no payload
```

---

## Action Creators

Use action creators from `actionCreators.js` for type safety:

```javascript
import {
  createChangeSceneAction,
  createUpdatePlayerAction,
  createUpdateBandAction,
  createStartGigAction,
  createAddToastAction
} from './actionCreators'

// Instead of:
dispatch({ type: 'UPDATE_PLAYER', payload: { money: 400 } })

// Use:
dispatch(createUpdatePlayerAction({ money: 400 }))
```

### Available Action Creators

| Creator                       | Parameters                      |
| ----------------------------- | ------------------------------- |
| `createChangeSceneAction`     | `(scene: string)`               |
| `createUpdatePlayerAction`    | `(updates: object)`             |
| `createUpdateBandAction`      | `(updates: object)`             |
| `createUpdateSocialAction`    | `(updates: object)`             |
| `createUpdateSettingsAction`  | `(updates: object)`             |
| `createSetMapAction`          | `(map: object)`                 |
| `createSetGigAction`          | `(gig: object\|null)`           |
| `createStartGigAction`        | `(venue: object)`               |
| `createSetSetlistAction`      | `(songs: array)`                |
| `createSetLastGigStatsAction` | `(stats: object)`               |
| `createSetActiveEventAction`  | `(event: object\|null)`         |
| `createAddToastAction`        | `(message, type)`               |
| `createRemoveToastAction`     | `(id: string)`                  |
| `createSetGigModifiersAction` | `(modifiers: object\|function)` |
| `createLoadGameAction`        | `(savedState: object)`          |
| `createResetStateAction`      | `()`                            |
| `createApplyEventDeltaAction` | `(delta: object)`               |
| `createPopPendingEventAction` | `()`                            |
| `createConsumeItemAction`     | `(itemType: string)`            |
| `createAdvanceDayAction`      | `()`                            |

---

## useGameState Hook

The primary interface for accessing game state:

```javascript
import { useGameState } from './context/GameState'

function MyComponent() {
  const {
    // State slices
    player,
    band,
    social,
    currentScene,
    currentGig,
    activeEvent,
    settings,
    gameMap,
    toasts,
    gigModifiers,

    // Raw dispatch
    dispatch,

    // Convenience actions
    changeScene,
    updatePlayer,
    updateBand,
    updateSocial,
    setMap,
    setGig,
    startGig,
    setSetlist,
    setLastGigStats,
    setActiveEvent,
    addToast,
    setGigModifiers,
    advanceDay,
    loadGame,
    triggerEvent,
    hasUpgrade
  } = useGameState()
}
```

---

## Save/Load Migration

The `handleLoadGame` reducer handles migration of old save data:

```javascript
// Migration: energy -> catering (renamed field)
if (loadedState.gigModifiers?.energy !== undefined) {
  loadedState.gigModifiers.catering = loadedState.gigModifiers.energy
  delete loadedState.gigModifiers.energy
}

// Safe merge with defaults
const mergedPlayer = {
  ...DEFAULT_PLAYER_STATE,
  ...loadedState.player,
  van: { ...DEFAULT_PLAYER_STATE.van, ...loadedState.player?.van }
}
```

---

## Testing

Tests are located in `/tests/gameReducer.test.js`:

```bash
npm run test -- --grep "gameReducer"
npm run test -- --grep "actionCreators"
```

### Test Coverage

- All ActionTypes handled
- State immutability verified
- Migration logic tested
- Edge cases (null payloads, missing fields)

---

## Best Practices

### DO

```javascript
// Use action creators
dispatch(createUpdatePlayerAction({ money: player.money - 100 }))

// Use ActionTypes enum
import { ActionTypes } from './gameReducer'
if (action.type === ActionTypes.CHANGE_SCENE) { ... }

// Validate before dispatch
if (player.money >= cost) {
  dispatch(createUpdatePlayerAction({ money: player.money - cost }))
}
```

### DON'T

```javascript
// Don't use string literals
dispatch({ type: 'UPDATE_PLAYER', ... })  // Typo-prone

// Don't mutate state directly
player.money -= 100  // WRONG

// Don't deeply nest updates
dispatch({ type: 'UPDATE_PLAYER', payload: {
  van: { ...player.van, fuel: newFuel }  // Use updatePlayer convenience
}})
```

---

## Dependencies

- `src/utils/gameStateUtils.js` - State utility functions
- `src/utils/simulationUtils.js` - Daily update calculations
- `src/utils/logger.js` - Debug logging
- `src/data/characters.js` - Character definitions

## Maintenance

- Last updated: 2026-02-17.
