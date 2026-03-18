# Common Assertions & Patterns

Standard assertion patterns for golden path tests.

## Resource Boundary Checks

### Money (must be ≥ 0)

```javascript
// ✅ After any money-changing action
assert.ok(state.player.money >= 0, 'Money >= 0')

// ✅ With a specific value
assert.equal(state.player.money, 450, 'Money should be 450')

// ✅ With a delta (before/after)
const moneyBefore = state.player.money
state = applyAction(state, ActionTypes.ADVANCE_DAY)
const moneyCost = moneyBefore - state.player.money
assert.ok(moneyCost > 0, 'Daily expenses deducted')
assert.ok(state.player.money >= 0, 'Never negative after deduction')
```

### Harmony (must be in [1, 100])

```javascript
// ✅ Single check
assert.ok(
  state.band.harmony >= 1 && state.band.harmony <= 100,
  `Harmony ${state.band.harmony} in [1,100]`
)

// ✅ After event that damages harmony
const harmonyBefore = state.band.harmony
state = gameReducer(state, {
  type: ActionTypes.APPLY_EVENT_DELTA,
  payload: { band: { harmony: -50 } }
})
assert.ok(state.band.harmony >= 1, 'Harmony clamped at 1')
assert.ok(state.band.harmony <= harmonyBefore, 'Harmony decreased')
```

### Fuel & Van Condition (must be in [0, 100])

```javascript
// ✅ Fuel bounds
assert.ok(
  state.player.van.fuel >= 0 && state.player.van.fuel <= 100,
  'Fuel in [0,100]'
)

// ✅ Van condition bounds
assert.ok(
  state.player.van.condition >= 0 && state.player.van.condition <= 100,
  'Condition in [0,100]'
)

// ✅ Both together
const { fuel, condition } = state.player.van
assert.ok(fuel >= 0 && fuel <= 100, `Fuel ${fuel} valid`)
assert.ok(condition >= 0 && condition <= 100, `Condition ${condition} valid`)
```

## State Mutation Checks

### Scene Transitions

```javascript
// ✅ Scene changed
assert.equal(
  state.currentScene,
  GAME_PHASES.OVERWORLD,
  'Transitioned to OVERWORLD'
)

// ✅ Scene did NOT change
const sceneBefore = state.currentScene
state = applyAction(state, ActionTypes.INVALID_ACTION)
assert.equal(
  state.currentScene,
  sceneBefore,
  'Invalid action does not change scene'
)
```

### Gig Lifecycle

```javascript
// ✅ Gig started
state = applyAction(state, ActionTypes.START_GIG, venue)
assert.ok(state.currentGig, 'currentGig set')
assert.deepEqual(state.currentGig, venue, 'Correct venue')

// ✅ Gig cleared
state = applyAction(state, ActionTypes.SET_GIG, null)
assert.equal(state.currentGig, null, 'currentGig nulled after PostGig')

// ✅ Gig stats recorded
const gigStats = { score: 8000, perfectHits: 50, misses: 3 }
state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)
assert.equal(state.lastGigStats.score, 8000, 'Stats recorded')
```

### Player Progression

```javascript
// ✅ Day advanced
const dayBefore = state.player.day
state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
assert.equal(state.player.day, dayBefore + 1, 'Day incremented')

// ✅ Fame updated
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { fame: 100 })
assert.equal(state.player.fame, 100, 'Fame updated')

// ✅ Location changed
state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
  currentNodeId: 'node_1_0',
  location: 'Berlin'
})
assert.equal(state.player.currentNodeId, 'node_1_0', 'Node changed')
assert.equal(state.player.location, 'Berlin', 'City updated')
```

## Inventory & Consumables

```javascript
// ✅ Numeric item consumed
const shirtsBefore = state.band.inventory.shirts
state = gameReducer(state, {
  type: ActionTypes.CONSUME_ITEM,
  payload: 'shirts'
})
assert.equal(
  state.band.inventory.shirts,
  shirtsBefore - 1,
  'Shirts decremented'
)

// ✅ Cannot go below 0
state = applyAction(state, ActionTypes.UPDATE_BAND, {
  inventory: { ...state.band.inventory, shirts: 0 }
})
state = gameReducer(state, {
  type: ActionTypes.CONSUME_ITEM,
  payload: 'shirts'
})
assert.equal(state.band.inventory.shirts, 0, 'Never negative')

// ✅ Boolean item toggled
assert.equal(state.band.inventory.strings, true, 'Has strings')
state = gameReducer(state, {
  type: ActionTypes.CONSUME_ITEM,
  payload: 'strings'
})
assert.equal(state.band.inventory.strings, false, 'Strings consumed')
```

## Modifier & Configuration

```javascript
// ✅ Modifier set
state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, { soundcheck: true })
assert.equal(state.gigModifiers.soundcheck, true, 'Soundcheck enabled')

// ✅ Modifier merges with existing
state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, { merch: true })
assert.equal(state.gigModifiers.soundcheck, true, 'Previous modifier persists')
assert.equal(state.gigModifiers.merch, true, 'New modifier set')

// ✅ Modifier with function updater
state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, current => ({
  soundcheck: !current.soundcheck
}))
assert.equal(state.gigModifiers.soundcheck, false, 'Toggle worked')
```

## Multi-Action Sequences

### Full Gig Cycle

```javascript
// ✅ Complete gig from start to earnings
let state = createInitialState()

// Setup
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
state = applyAction(state, ActionTypes.START_GIG, venue)
assert.equal(state.currentScene, GAME_PHASES.PRE_GIG)

// PreGig config
state = applyAction(state, ActionTypes.SET_SETLIST, songs)
state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, { soundcheck: true })

// Enter gig
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)

// Performance
const gigStats = {
  score: 8000,
  perfectHits: 50,
  misses: 3,
  maxCombo: 25,
  peakHype: 70,
  toxicTimeTotal: 0
}
state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)

// PostGig
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)
assert.ok(state.lastGigStats, 'Stats available')
assert.ok(state.currentGig, 'Gig still active')

// Earnings
const earnings = 250
state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
  money: state.player.money + earnings,
  fame: state.player.fame + 50
})

// Return
state = applyAction(state, ActionTypes.SET_GIG, null)
state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
assert.equal(state.currentScene, GAME_PHASES.OVERWORLD)
assert.equal(state.currentGig, null)
```

## Edge Cases & Errors

### Bankruptcy Path

```javascript
// ✅ Low money triggers GAMEOVER path
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 5 })
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.PRE_GIQ, venue)
// ... perform badly ...
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: -100 })
assert.equal(state.player.money, 0, 'Money clamped to 0')
// Game controller should transition to GAMEOVER (checked in component logic)
```

### Van Breakdown

```javascript
// ✅ Low fuel affects travel
state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
  van: { ...state.player.van, fuel: 5 }
})
assert.equal(state.player.van.fuel, 5, 'Fuel is low')

// Breakdown chance increases when fuel < 20
const breakdown = state.player.van.breakdownChance
assert.ok(breakdown > 0, 'Breakdown chance calculated')
```

### Harmony Crisis

```javascript
// ✅ Harmony near minimum
state = applyAction(state, ActionTypes.UPDATE_BAND, { harmony: 1 })
assert.equal(state.band.harmony, 1, 'Harmony at minimum')

// Further damage doesn't go below 1
state = gameReducer(state, {
  type: ActionTypes.APPLY_EVENT_DELTA,
  payload: { band: { harmony: -50 } }
})
assert.equal(state.band.harmony, 1, 'Harmony stays at minimum')
```

## Helper Utility

Create a helper file for reusable assertions:

```javascript
// tests/helpers/assertions.js
export const assertMoneySafe = (state, message = '') => {
  assert.ok(
    state.player.money >= 0,
    `Money ${state.player.money} >= 0 ${message}`
  )
}

export const assertHarmonySafe = (state, message = '') => {
  assert.ok(
    state.band.harmony >= 1 && state.band.harmony <= 100,
    `Harmony ${state.band.harmony} in [1,100] ${message}`
  )
}

export const assertVanSafe = (state, message = '') => {
  assert.ok(
    state.player.van.fuel >= 0 && state.player.van.fuel <= 100,
    `Fuel safe ${message}`
  )
  assert.ok(
    state.player.van.condition >= 0 && state.player.van.condition <= 100,
    `Condition safe ${message}`
  )
}

// Usage:
import {
  assertMoneySafe,
  assertHarmonySafe,
  assertVanSafe
} from '../helpers/assertions.js'

await t.test('After transaction', () => {
  state = applyAction(state, ActionTypes.ADVANCE_DAY)
  assertMoneySafe(state, 'after day advance')
  assertHarmonySafe(state, 'after day advance')
  assertVanSafe(state, 'after day advance')
})
```
