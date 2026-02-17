# Utils Module Agent

## Role

You are the **Core Game Systems Architect** for NEUROTOXIC: GRIND THE VOID. You maintain the game engines, utility functions, and business logic that power the gameplay experience.

## Domain Expertise

This folder (`src/utils/`) contains the "brains" of the game - pure logic modules that handle:

| Module                | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `eventEngine.js`      | Random encounter system, skill checks, narrative branching |
| `economyEngine.js`    | Financial calculations, payout formulas, cost modeling     |
| `socialEngine.js`     | Social media simulation, viral content mechanics           |
| `mapGenerator.js`     | Procedural map generation, graph-based travel system       |
| `AudioManager.js`     | Tone.js audio coordinator, sound effect management         |
| `simulationUtils.js`  | Time progression, day/night cycle, RNG utilities           |
| `imageGen.js`         | Placeholder image URL generation                           |
| `audioTimingUtils.js` | Gig/audio clock alignment helpers                          |
| `errorHandler.js`     | Centralized error handling and logging                     |
| `logger.js`           | Debug logging with categories and levels                   |
| `gameStateUtils.js`   | State transformation utilities                             |

## Core Principles

### Pure Functions

**All utilities must be pure functions** (except AudioManager):

```javascript
// ✅ CORRECT - Pure function
export const calculatePayout = (
  baseAmount,
  performanceMultiplier,
  difficulty
) => {
  return Math.floor(baseAmount * performanceMultiplier * (1 + difficulty * 0.1))
}

// ❌ WRONG - Side effects
export const calculatePayout = gig => {
  gig.payout = Math.floor(gig.base * 1.5) // Mutates input
  return gig.payout
}
```

### State Agnostic

Utils should NOT import `GameState.jsx`. They receive state as parameters:

```javascript
// ✅ CORRECT
export const eventEngine = {
  checkEvent: (category, gameState, triggerPoint) => {
    // Logic uses gameState parameter
  }
}

// ❌ WRONG
import { useGameState } from '../context/GameState'
export const checkEvent = () => {
  const { player } = useGameState() // NO
}
```

### Testable & Deterministic

All RNG should be explicit:

```javascript
// ✅ CORRECT - Deterministic with seed option
export const rollDice = (sides = 6, seed = Math.random()) => {
  return Math.floor(seed * sides) + 1
}

// ✅ CORRECT - Explicit probability
export const checkChance = probability => {
  return Math.random() < probability
}
```

## File-Specific Guidelines

### eventEngine.js

**Purpose**: Trigger and resolve random narrative events (band conflicts, vehicle issues, lucky breaks)

**Key Functions:**

- `checkEvent(category, gameState, triggerPoint)` - Returns event or null
- `resolveChoice(choice, gameState)` - Processes player's decision

**Event Categories:**

- `'travel'` - Triggered during map navigation
- `'pregig'` - Before gig preparation
- `'postgig'` - After gig results
- `'financial'` - Money-related events
- `'band'` - Band member interactions

**Event Structure:**

```javascript
{
  id: 'event_van_breakdown',
  title: 'VAN BREAKDOWN',
  description: 'Your van sputters to a halt...',
  trigger: 'travel', // When to check for this event
  chance: 0.15, // 15% probability
  condition: (state) => state.player.van.condition < 50, // Optional
  choices: [
    {
      text: 'Pay for mechanic (€200)',
      cost: { money: 200 },
      outcome: { vanCondition: +50 }
    },
    {
      text: 'DIY Repair',
      skillCheck: {
        stat: 'technical', // Check a band member's stat
        threshold: 6,
        success: { vanCondition: +30 },
        failure: { vanCondition: -10, time: +2 }
      }
    }
  ]
}
```

**Critical Logic:**

1. **Pending Events** - Prioritize queued events from previous choices
2. **Cooldowns** - Check `gameState.eventCooldowns` to prevent spam
3. **Story Flags** - Boost chance if `activeStoryFlags` match event tags
4. **Skill Checks** - Roll against band member stats or luck

**Skill Check Algorithm:**

```javascript
const skillValue = Math.max(...gameState.band.members.map(m => m[stat] || 0))
const roll = Math.random() * 10
const critBonus = roll > 8 ? 2 : 0
const total = skillValue + critBonus

if (total >= threshold) {
  // Success outcome
} else {
  // Failure outcome
}
```

### economyEngine.js

**Purpose**: Calculate money flows, validate transactions, prevent exploits

**Key Functions:**

- `calculateGigPayout(baseAmount, performance, modifiers)` - Earnings formula
- `calculateMerchRevenue(inventory, attendance, hype)` - Merch sales
- `calculateTravelCost(distance, fuelPrice, vanCondition)` - Trip expenses
- `validateTransaction(currentMoney, cost)` - Prevent negative balances

**Economic Balance:**

- Base gig payout: €150-€600 depending on venue difficulty
- Travel costs: ~€30-€80 per node
- Merch markup: 200-400% profit margin
- Upgrades cost: €100-€500

**Formulas:**

```javascript
// Gig Payout
const basePayout = venue.basePay
const performanceMultiplier = (accuracy / 100) * (1 + comboBonus)
const difficultyBonus = 1 + venue.difficulty * 0.15
const promoBonus = modifiers.promo ? 1.3 : 1.0
const finalPayout =
  basePayout * performanceMultiplier * difficultyBonus * promoBonus

// Merch Revenue
const baseAttendance = venue.capacity * (performance / 100)
const merchBuyRate = modifiers.merchTable ? 0.4 : 0.2 // 20-40% of crowd
const avgItemPrice = 15
const revenue = baseAttendance * merchBuyRate * avgItemPrice
```

**Anti-Cheat:**

- Always use `Math.floor()` for final currency values
- Validate `currentMoney >= cost` before deductions
- Cap earnings to prevent overflow exploits

### socialEngine.js

**Purpose**: Simulate social media growth, viral mechanics, audience building

**Key Functions:**

- `calculateSocialGrowth(platform, performance, currentFollowers)` - Follower delta
- `checkViralEvent(performance, randomness)` - Rare viral boost
- `applyReputationDecay(followers, daysSinceLastPost)` - Organic decline

**Platform Mechanics:**

- **Instagram**: Steady linear growth, good for merch sales
- **TikTok**: High variance, potential for viral spikes
- **YouTube**: Slow build, best for long-term fame
- **Newsletter**: Direct fan connection, low churn

**Growth Formula:**

```javascript
const baseGrowth = Math.floor(performance / 10) // 0-10 followers per gig
const platformMultiplier = {
  instagram: 1.2,
  tiktok: 1.5, // More volatile
  youtube: 0.8,
  newsletter: 0.5
}[platform]
const viralBonus = checkViralEvent() ? 100 : 0
const finalGrowth = baseGrowth * platformMultiplier + viralBonus
```

**Viral Triggers:**

- Performance accuracy > 95%
- Combo multiplier > 2.5x
- Random chance (1% base, boosted by modifiers)

### mapGenerator.js

**Purpose**: Create procedural travel graph of German cities

**Key Functions:**

- `generateMap(startCity, depth, branchFactor)` - Creates node graph
- `getAdjacentNodes(nodeId, mapGraph)` - Find neighbors
- `calculateDistance(nodeA, nodeB)` - For fuel costs

**Map Structure:**

```javascript
{
  nodes: [
    {
      id: 'node_0_0',
      city: 'Stendal',
      region: 'Sachsen-Anhalt',
      type: 'START',
      venue: null,
      connections: ['node_1_0', 'node_1_1']
    },
    {
      id: 'node_1_0',
      city: 'Leipzig',
      region: 'Sachsen',
      type: 'VENUE',
      venue: { name: 'UT Connewitz', difficulty: 3, basePay: 300 },
      connections: ['node_0_0', 'node_2_0']
    }
  ]
}
```

**Generation Rules:**

- Start node always in Stendal (band's hometown)
- ~70% of nodes are venues (drawn from `venues.js`)
- ~20% are rest stops (no gig, just events)
- ~10% are special nodes (festivals, secret locations)
- Graph must be connected (no isolated nodes)

### AudioManager.js

**Purpose**: Coordinate ambient playback, gig background audio, and SFX routing.

**Key Functions:**

- `startAmbient()` - Start ambient MIDI playback if not already running
- `playSFX(type)` - Trigger synth-based SFX (`hit`, `miss`, `menu`, `travel`, `cash`)
- `stopMusic()` - Stop ambient/music playback
- `setMusicVolume(level)` - Set music volume via the dedicated music bus
- `setSFXVolume(level)` - Set SFX volume
- `toggleMute()` - Toggle global mute

**Sound Categories:**

- **SFX**: Button clicks, note hits, crowd reactions
- **Music**: Ambient MIDI and gig background playback
- **Ambience**: Tour ambience via MIDI assets

**Current Status**: MIDI-driven ambient and gig playback via Tone.js with synth SFX.

### simulationUtils.js

**Purpose**: Utility helpers for game simulation

**Key Functions:**

- `advanceTime(currentTime, hours)` - Move clock forward
- `getTimeOfDay(hour)` - Return 'MORNING', 'AFTERNOON', 'NIGHT'
- `randomInt(min, max)` - Inclusive integer random
- `weightedChoice(items, weights)` - Probability selection

**Time System:**

- Game operates on 24-hour clock
- Gigs typically happen at night (19:00-23:00)
- Travel takes 2-4 hours depending on distance
- Events can modify time (delays, fast-forwards)

### imageGen.js

**Purpose**: Generate placeholder image URLs for missing assets

**Key Constants:**

```javascript
export const IMG_PROMPTS = {
  VENUE_CLUB: 'dark-underground-club',
  VENUE_FESTIVAL: 'outdoor-metal-festival',
  MATZE_PLAYING: 'death-metal-guitarist'
  // ... etc
}

export const getGenImageUrl = prompt => {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`
}
```

**Note**: These are temporary. Replace with real assets when available.

### errorHandler.js

**Purpose**: Centralized error handling with custom error types and recovery utilities.

**Error Classes:**

```javascript
import {
  GameError, // Base error class
  StateError, // State-related errors
  RenderError, // Rendering errors
  AudioError, // Audio system errors
  GameLogicError, // Game logic errors
  StorageError, // localStorage errors
  handleError, // Main error handler
  safeStorageOperation // Safe localStorage wrapper
} from '../utils/errorHandler'
```

**Error Severity Levels:**

| Severity   | Action                           |
| ---------- | -------------------------------- |
| `LOW`      | Log only                         |
| `MEDIUM`   | Log + toast notification         |
| `HIGH`     | Log + toast + may need recovery  |
| `CRITICAL` | Log + toast + scene change/reset |

**Usage:**

```javascript
// Handling errors with toast notifications
try {
  riskyOperation()
} catch (error) {
  handleError(error, {
    addToast,
    fallbackMessage: 'Operation failed',
    silent: false
  })
}

// Creating custom errors
throw new StateError('Invalid state transition', {
  from: 'MENU',
  to: 'GIG',
  reason: 'No gig selected'
})

// Safe localStorage operations
const savedGame = safeStorageOperation(
  'read',
  () => JSON.parse(localStorage.getItem('save')),
  null // fallback value
)
```

**Error Categories:**

- `STATE` - State management errors
- `RENDER` - Component rendering errors
- `AUDIO` - Audio playback errors
- `LOGIC` - Game logic errors
- `STORAGE` - Save/load errors
- `NETWORK` - Network errors (future)

### logger.js

**Purpose**: Debug logging with categories and configurable levels.

**Usage:**

```javascript
import { logger } from '../utils/logger'

logger.info('GameState', 'Scene changed', { from: 'MENU', to: 'OVERWORLD' })
logger.debug('TravelLogic', 'Calculating costs', { fuel: 50, distance: 100 })
logger.warn('EventEngine', 'Event cooldown active', eventId)
logger.error('PixiStage', 'Failed to create texture', error)
```

**Log Levels:**

- `debug` - Verbose debugging info (dev only)
- `info` - Important state changes
- `warn` - Potential issues
- `error` - Errors that occurred

### gameStateUtils.js

**Purpose**: State transformation utilities for the reducer.

**Key Functions:**

- `applyEventDelta(state, delta)` - Apply event outcomes to state
- State merging and validation utilities

## Testing Guidelines

### Unit Test Structure

```javascript
// Example test for economyEngine
describe('calculateGigPayout', () => {
  it('applies performance multiplier correctly', () => {
    const result = calculateGigPayout(300, 0.85, {})
    expect(result).toBe(255) // 300 * 0.85
  })

  it('caps payout at maximum threshold', () => {
    const result = calculateGigPayout(1000, 2.0, {})
    expect(result).toBeLessThanOrEqual(1500) // Anti-exploit cap
  })
})
```

### Manual Testing

- Run functions in browser console
- Verify outputs with different game states
- Check edge cases (negative values, null inputs)

## Integration Points

- **Scenes**: Import and call utility functions
- **Context**: GameState dispatches actions based on utility results
- **Data**: Utilities reference static databases (events.js, venues.js)
- **Hooks**: `useRhythmGameLogic` uses simulationUtils for timing

## Common antipatterns

### ❌ Mutating State

```javascript
// WRONG
export const deductMoney = (gameState, amount) => {
  gameState.player.money -= amount // Direct mutation
}
```

### ❌ Hidden Side Effects

```javascript
// WRONG
export const checkEvent = () => {
  localStorage.setItem('lastEvent', Date.now()) // Side effect
}
```

### ❌ Tight Coupling

```javascript
// WRONG
import { EVENTS_DB } from '../data/events'
export const getEvent = () => EVENTS_DB.travel[0] // Hardcoded index
```

---

**Remember**: Utils are the "engine room" of the game. Keep them stateless, testable, and focused on single responsibilities. Complex orchestration belongs in scenes or the global context.

## Maintenance

- Audio: MIDI playback uses a clean, dry chain for ambient/gig background to avoid FX coloration.
- Last updated: 2026-02-17.
