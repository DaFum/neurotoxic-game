# Game State Shapes & Structures

Reference for the game state object used in golden path tests.

## Root State Shape

```javascript
{
  currentScene: 'INTRO' | 'MENU' | 'OVERWORLD' | 'PRE_GIG' | 'GIG' | 'POST_GIG' | 'GAMEOVER' | 'SETTINGS' | 'CREDITS',

  // Player (resources + progression)
  player: {
    money: number >= 0,           // Clamped to 0
    fame: number >= 0,            // Career score, unbounded
    day: number >= 1,             // Current game day
    currentNodeId: string | null, // Map node ID
    location: string,             // City name
    van: {
      fuel: number in [0, 100],   // Clamped
      condition: number in [0, 100], // Durability, decays daily
      breakdownChance: number,    // %
      upgrades: {
        engine: boolean,
        suspension: boolean,
        interior: boolean
      }
    }
  },

  // Band (collective resources)
  band: {
    name: string,
    harmony: number in [1, 100],  // Clamped; 1 = ready to break, 100 = perfect
    members: [
      {
        id: string,
        name: string,
        stamina: number in [0, 100],  // Clamped
        role: string
      }
    ],
    inventory: {
      shirts: number,        // Numeric countable
      posters: number,
      strings: boolean,      // Binary consumable
      catering: boolean
    }
  },

  // Current gig (when in PRE_GIG, GIG, or POST_GIG)
  currentGig: null | {
    id: string,
    name: string,
    capacity: number,
    price: number,           // Ticket price
    pay: number,             // Base payment
    dist: number,            // Distance to travel
    diff: number,            // Difficulty level
    type: 'GIG' | 'START'    // START = home base
  },

  // Setlist (songs for current gig)
  setlist: [
    { id: string, name?: string, ... }
  ],

  // Gig modifiers (PreGig configuration)
  gigModifiers: {
    soundcheck: boolean,
    merch: boolean,
    promo: boolean,
    catering: boolean
  },

  // Stats from last gig
  lastGigStats: null | {
    score: number,
    perfectHits: number,
    misses: number,
    maxCombo: number,
    peakHype: number,
    toxicTimeTotal: number
  },

  // Game map
  gameMap: null | {
    layers: Array<Array<Node>>,
    nodes: { [nodeId: string]: Node },
    connections: Array<[string, string]>
  },

  // Event tracking
  eventCooldowns: string[],  // Event IDs in cooldown
  pastEvents: Array<{
    eventId: string,
    day: number,
    outcome?: string
  }>,

  // Social / Followers
  social: {
    instagram: number,
    tiktok: number,
    fanmail: number
  },

  // Save slot (for persistence)
  saveSlot: string | null
}
```

## Common Preconditions

When setting up a test, use these patterns:

### Start Fresh

```javascript
let state = createInitialState()
```

### Move to OVERWORLD

```javascript
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
```

### Set up a gig

```javascript
const venue = {
  id: 'test_venue',
  name: 'Punk Hall',
  capacity: 200,
  price: 10,
  pay: 300,
  dist: 50,
  diff: 2,
  type: 'GIG'
}
state = applyAction(state, ActionTypes.START_GIG, venue)
```

### Prepare for performance

```javascript
state = applyAction(state, ActionTypes.SET_SETLIST, [
  { id: '01 Kranker Schrank' }
])
state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
  soundcheck: true
})
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)
```

### Simulate gig performance

```javascript
const gigStats = {
  score: 8000,
  perfectHits: 50,
  misses: 3,
  maxCombo: 25,
  peakHype: 70,
  toxicTimeTotal: 0
}
state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)
```

## Key Constraints

| Field                    | Min | Max | Notes                                       |
| ------------------------ | --- | --- | ------------------------------------------- |
| `money`                  | 0   | ∞   | Clamped by UPDATE_PLAYER, APPLY_EVENT_DELTA |
| `harmony`                | 1   | 100 | Clamped by UPDATE_BAND, APPLY_EVENT_DELTA   |
| `fuel`                   | 0   | 100 | Clamped by APPLY_EVENT_DELTA                |
| `condition`              | 0   | 100 | Van durability, decays ~2 per day           |
| `day`                    | 1   | ∞   | Min 1, incremented by ADVANCE_DAY           |
| `stamina` (band members) | 0   | 100 | Clamped; can decay/recover                  |

## Accessing Nested State

```javascript
// Player money
state.player.money

// Band harmony
state.band.harmony

// Current venue
state.currentGig.name

// Van fuel
state.player.van.fuel

// First band member
state.band.members[0].stamina

// Gig stat score
state.lastGigStats?.score ?? 0 // Safe access
```

## State Mutation Rules

**NEVER** mutate state directly:

```javascript
// ❌ WRONG: state.player.money = 100
// ✅ CORRECT:
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 100 })
```

Always use action creators through `gameReducer()`.
