# State Mutations & Patterns

Clear, proven patterns for managing game state correctly.

## The Three-Part Rule

Adding or modifying state always requires updating three files together:

1. **`src/context/gameReducer.js`**: The reducer case
2. **`src/context/actionCreators.js`**: Action creator function
3. **`src/context/gameConstants.js`**: `ActionTypes` enum

**Never update just one**. Always update all three.

---

## Pattern 1: Adding a New Action Type

### Scenario
Add action `REPAIR_VAN` that costs money and restores van condition.

### Step 1: Add to ActionTypes

**File: `src/context/gameConstants.js`**
```javascript
export const ActionTypes = {
  // ...existing...
  ADVANCE_DAY: 'ADVANCE_DAY',
  REPAIR_VAN: 'REPAIR_VAN',  // ← NEW
}
```

### Step 2: Add Reducer Case

**File: `src/context/gameReducer.js`**
```javascript
function gameReducer(state, action) {
  switch (action.type) {
    // ...existing cases...

    case ActionTypes.REPAIR_VAN: {
      const { cost, conditionRestored } = action.payload
      const newMoney = state.player.money - cost
      const newCondition = Math.min(
        100,
        state.player.van.condition + conditionRestored
      )
      return {
        ...state,
        player: {
          ...state.player,
          money: Math.max(0, newMoney),  // ← Clamp to 0
          van: {
            ...state.player.van,
            condition: newCondition
          }
        }
      }
    }

    default:
      return state
  }
}
```

### Step 3: Add Action Creator

**File: `src/context/actionCreators.js`**
```javascript
export function repairVan(cost, conditionRestored) {
  return {
    type: ActionTypes.REPAIR_VAN,
    payload: { cost, conditionRestored }
  }
}
```

### Step 4: Use in Component/Hook

**File: `src/hooks/useHQLogic.js` or similar**
```javascript
function handleRepairVan() {
  const cost = 200
  const conditionRestored = 30
  dispatch(repairVan(cost, conditionRestored))
}
```

### Step 5: Test

**File: `tests/van-repair.test.js`**
```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { createInitialState } from '../src/context/initialState.js'
import { repairVan } from '../src/context/actionCreators.js'

test('REPAIR_VAN restores condition and deducts money', () => {
  let state = createInitialState()
  state = { ...state, player: { ...state.player, van: { ...state.player.van, condition: 30 } } }

  const action = repairVan(200, 30)
  state = gameReducer(state, action)

  assert.equal(state.player.van.condition, 60, 'Condition restored')
  assert.equal(state.player.money, 300, 'Money deducted (500 - 200)')
  assert.ok(state.player.money >= 0, 'Money clamped')
})
```

---

## Pattern 2: Updating Nested State Safely

### Scenario
Update player harmony during a gig (nested in band object).

### ❌ WRONG (Direct Mutation)
```javascript
// DON'T DO THIS
state.band.harmony = 50
return state
```

### ✅ CORRECT (Immutable Spread)
```javascript
case ActionTypes.UPDATE_BAND: {
  const { harmony } = action.payload
  const clampedHarmony = Math.min(100, Math.max(1, harmony))  // Clamp [1, 100]
  return {
    ...state,
    band: {
      ...state.band,
      harmony: clampedHarmony
    }
  }
}
```

### Pattern: Deeply Nested Updates

When updating a deeply nested property (e.g., `state.player.van.upgrades.engine`):

```javascript
case ActionTypes.UPGRADE_VAN_ENGINE: {
  return {
    ...state,
    player: {
      ...state.player,
      van: {
        ...state.player.van,
        upgrades: {
          ...state.player.van.upgrades,
          engine: true  // ← Update this one property
        }
      }
    }
  }
}
```

---

## Pattern 3: Batch Updates (Multiple Properties)

### Scenario
`UPDATE_PLAYER` changes money, fame, and location at once.

```javascript
case ActionTypes.UPDATE_PLAYER: {
  const updates = action.payload  // { money, fame, location, ... }
  return {
    ...state,
    player: {
      ...state.player,
      // Spread existing player, then apply updates
      ...updates,
      // But clamp critical fields!
      money: Math.max(0, updates.money ?? state.player.money),
      fame: Math.max(0, updates.fame ?? state.player.fame)
    }
  }
}
```

**Usage in component**:
```javascript
dispatch({
  type: ActionTypes.UPDATE_PLAYER,
  payload: {
    money: 450,
    fame: 100,
    location: 'Berlin'
  }
})
```

---

## Pattern 4: Array Updates (Items, Band Members)

### Scenario
Add a new HQ item to band.

#### ❌ WRONG
```javascript
state.band.hqItems.push('meditation_pod')
return state
```

#### ✅ CORRECT (Immutable)
```javascript
case ActionTypes.ADD_HQ_ITEM: {
  const itemId = action.payload
  return {
    ...state,
    band: {
      ...state.band,
      hqItems: [...state.band.hqItems, itemId]  // New array
    }
  }
}
```

### Array Filter (Remove Item)
```javascript
case ActionTypes.REMOVE_HQ_ITEM: {
  const itemId = action.payload
  return {
    ...state,
    band: {
      ...state.band,
      hqItems: state.band.hqItems.filter(id => id !== itemId)
    }
  }
}
```

### Array Map (Update Item)
```javascript
case ActionTypes.UPDATE_BAND_MEMBER: {
  const { memberId, updates } = action.payload
  return {
    ...state,
    band: {
      ...state.band,
      members: state.band.members.map(m =>
        m.id === memberId ? { ...m, ...updates } : m
      )
    }
  }
}
```

---

## Pattern 5: Clamping Resource Bounds

### The Four Critical Resources

All require clamping:

```javascript
import { clampMoney, clampHarmony } from '../utils/gameStateUtils.js'

case ActionTypes.APPLY_EVENT_DELTA: {
  const { player: playerDelta, band: bandDelta } = action.payload

  const newMoney = clampMoney(state.player.money + (playerDelta?.money ?? 0))
  const newHarmony = clampHarmony(state.band.harmony + (bandDelta?.harmony ?? 0))

  return {
    ...state,
    player: {
      ...state.player,
      money: newMoney,
      van: {
        ...state.player.van,
        fuel: Math.max(0, Math.min(100, state.player.van.fuel + (playerDelta?.van?.fuel ?? 0))),
        condition: Math.max(0, Math.min(100, state.player.van.condition + (playerDelta?.van?.condition ?? 0)))
      }
    },
    band: {
      ...state.band,
      harmony: newHarmony
    }
  }
}
```

**Bounds Reference**:
| Resource | Min | Max | Clamp Helper |
|----------|-----|-----|---|
| `money` | 0 | ∞ | `clampMoney()` |
| `harmony` | 1 | 100 | `clampHarmony()` |
| `fuel` | 0 | 100 | Manual: `Math.max(0, Math.min(100, ...))` |
| `condition` | 0 | 100 | Manual: `Math.max(0, Math.min(100, ...))` |

---

## Pattern 6: Conditional Updates

### Scenario
Only apply harmony change if player has meditation pod.

```javascript
case ActionTypes.ADVANCE_DAY: {
  let harmonyDelta = 0
  if (state.band.hqItems.includes('meditation_pod')) {
    harmonyDelta = 1  // +1 harmony per day
  }

  const newHarmony = clampHarmony(state.band.harmony + harmonyDelta)

  return {
    ...state,
    band: {
      ...state.band,
      harmony: newHarmony
    },
    player: {
      ...state.player,
      day: state.player.day + 1
    }
  }
}
```

---

## Pattern 7: Computed Derived State

### Scenario
Calculate van breakdown chance from condition.

**Option A: Calculate in Selector** (preferred)
```javascript
// In a hook or component
function getBreakdownChance(vanCondition) {
  if (vanCondition >= 60) return 0
  if (vanCondition >= 30) return (60 - vanCondition) / 30 * 15  // 0-15%
  return 15 + (30 - vanCondition) / 30 * 20  // 15-35%
}

// Use in component
const breakdownChance = getBreakdownChance(state.player.van.condition)
```

**Option B: Calculate in Reducer** (if needed in state)
```javascript
case ActionTypes.ADVANCE_DAY: {
  const newCondition = Math.max(0, state.player.van.condition - 2)
  const breakdownChance = calculateBreakdownChance(newCondition)

  return {
    ...state,
    player: {
      ...state.player,
      van: {
        ...state.player.van,
        condition: newCondition,
        breakdownChance  // ← Derived, recalculated
      }
    }
  }
}
```

---

## Testing State Mutations

### Test 1: Property Updates
```javascript
test('UPDATE_PLAYER updates money', () => {
  let state = createInitialState()
  state = gameReducer(state, {
    type: ActionTypes.UPDATE_PLAYER,
    payload: { money: 300 }
  })
  assert.equal(state.money, 300)
})
```

### Test 2: Clamping
```javascript
test('Money clamped to 0 when negative', () => {
  let state = createInitialState()
  state = gameReducer(state, {
    type: ActionTypes.UPDATE_PLAYER,
    payload: { money: -500 }
  })
  assert.equal(state.player.money, 0)
})
```

### Test 3: Immutability
```javascript
test('Reducer does not mutate original state', () => {
  const state = createInitialState()
  const stateCopy = structuredClone(state)  // Deep copy
  gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
  // state should be unchanged
  assert.deepEqual(state, stateCopy)
})
```

---

## Anti-Patterns to Avoid

| ❌ Anti-Pattern | ✅ Correct Approach |
|---|---|
| `state.player.money = 100` | `{ ...state, player: { ...state.player, money: 100 } }` |
| `state.band.members.push(m)` | `{ ...state.band.members, [m.id]: m }` (or array map) |
| No clamping for money | Always clamp: `Math.max(0, newMoney)` |
| Calling reducer directly | Use action creators + dispatch |
| Creating action payload in component | Move to action creator function |
| Storing same data in multiple places | Single source of truth (reducer state) |

