# Improvement Patterns & Examples

Complete, real-world patterns for common game improvements.

## Pattern 1: Bug Fix (Logic Error)

### Scenario
Travel costs are calculated incorrectly — fuel is deducted twice (once at travel, once at day advance).

### Analysis
1. **Find source of truth**: Where is travel fuel cost calculated?
   - `src/hooks/useOverworldLogic.js` → calls travel action
   - `src/context/gameReducer.js` → `UPDATE_PLAYER` case handles fuel
   - `src/utils/economyEngine.js` → calculates travel cost including fuel
2. **Trace the bug**:
   - Travel action: `UPDATE_PLAYER({ van: { fuel: fuel - cost } })`
   - Day advance: `ADVANCE_DAY` → `UPDATE_BAND` (harmony) + `UPDATE_PLAYER` (daily costs)
   - **Problem**: Travel deducts fuel, then somewhere else deducts again
3. **Find test**:
   - `tests/travel.test.js` or `tests/goldenPath.test.js`
   - Assertion: "Travel deducts fuel exactly once"

### Implementation

**File 1: `src/hooks/useOverworldLogic.js`**
```javascript
// ❌ WRONG: Deducting fuel in both action payload
const handleTravel = (destination) => {
  const cost = calculateTravelCost(current, destination)
  dispatch({
    type: ActionTypes.UPDATE_PLAYER,
    payload: {
      van: {
        fuel: state.player.van.fuel - cost.fuel  // ← First deduction
      }
    }
  })
  // ...later in reducer, day advance deducts again
}

// ✅ CORRECT: Deduct fuel only at travel, not again at day advance
const handleTravel = (destination) => {
  const cost = calculateTravelCost(current, destination)
  dispatch({
    type: ActionTypes.UPDATE_PLAYER,
    payload: {
      van: {
        fuel: state.player.van.fuel - cost.fuel
      }
    }
  })
  // Don't deduct again in day advance
}
```

**File 2: Check `src/context/gameReducer.js`**
```javascript
// In ADVANCE_DAY case:
case ActionTypes.ADVANCE_DAY: {
  // ✅ Daily costs should NOT include travel fuel
  // Travel fuel deducted at travel time, not here
  const dailyCosts = DAILY_BASE_COST + (bandSize * PER_MEMBER_COST)
  // DON'T include travel fuel here
  return {
    ...state,
    player: {
      ...state.player,
      money: Math.max(0, state.player.money - dailyCosts),
      day: state.player.day + 1
    }
  }
}
```

### Testing

**Test file: `tests/travel.test.js`**
```javascript
test('Travel deducts fuel exactly once', async t => {
  let state = createInitialState()
  const fuelBefore = state.player.van.fuel

  // Travel
  state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
    van: { ...state.player.van, fuel: fuelBefore - 15 }
  })
  assert.equal(state.player.van.fuel, fuelBefore - 15, 'Fuel deducted at travel')

  // Day advance (should NOT deduct fuel again)
  state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
  assert.equal(state.player.van.fuel, fuelBefore - 15, 'Fuel unchanged on day advance')
})
```

### Verification
```bash
pnpm run test -- tests/travel.test.js
# ✓ Travel deducts fuel exactly once
```

---

## Pattern 2: New Feature (Item/Upgrade Addition)

### Scenario
Add "Meditation Pod" upgrade: Costs 500, recovers +1 harmony daily (max 100).

### Analysis
1. **Data structure**: Check `src/data/hqItems.js` for format
2. **Economic impact**: Cost vs benefit. Daily harmony regeneration is strong.
3. **State**: Harmony clamped [1, 100]. `ADVANCE_DAY` applies effects.
4. **Tests**: Verify cost deduction, harmony recovery, clamping.

### Implementation

**File 1: `src/data/hqItems.js`**
```javascript
export const HQ_ITEMS = [
  // ...existing items...
  {
    id: 'meditation_pod',
    name: 'Meditation Pod',
    description: 'Recover harmony over time',
    cost: 500,
    category: 'upgrade',
    effect: {
      type: 'harmony_regen',
      amount: 1  // +1 harmony per day
    }
  }
]
```

**File 2: `src/hooks/useGameLoop.js`** (or wherever daily effects are applied)
```javascript
function applyDailyEffects(state, dispatch) {
  // Apply HQ item effects
  for (const item of state.band.hqItems) {
    const itemDef = HQ_ITEMS.find(i => i.id === item.id)
    if (!itemDef) continue

    if (itemDef.effect?.type === 'harmony_regen') {
      const recoveredHarmony = Math.min(
        100,
        state.band.harmony + itemDef.effect.amount
      )
      dispatch({
        type: ActionTypes.UPDATE_BAND,
        payload: { harmony: recoveredHarmony }
      })
    }
  }
}
```

**File 3: `src/utils/economyEngine.js`** (add to modifier/item costs)
```javascript
// If there's a central costs object, add it
export const HQ_ITEM_COSTS = {
  meditation_pod: 500,
  // ...
}
```

**File 4: Localization - `public/locales/en.json`**
```json
{
  "ui": {
    "items": {
      "meditation_pod": {
        "name": "Meditation Pod",
        "description": "Recover {{amount}} harmony each day"
      }
    }
  }
}
```

**File 5: Localization - `public/locales/de.json`**
```json
{
  "ui": {
    "items": {
      "meditation_pod": {
        "name": "Meditationspod",
        "description": "{{amount}} Harmonie täglich regenerieren"
      }
    }
  }
}
```

### Testing

**Test file: `tests/meditation_pod.test.js`**
```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { createInitialState } from '../src/context/initialState.js'

test('Meditation Pod increases harmony daily', async t => {
  let state = createInitialState()

  await t.test('Purchase meditation pod', () => {
    const cost = 500
    state = gameReducer(state, {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: state.player.money - cost }
    })
    assert.equal(state.player.money, 0, 'Money deducted')

    // Add item to HQ inventory
    state = gameReducer(state, {
      type: ActionTypes.ADD_HQ_ITEM,
      payload: 'meditation_pod'
    })
    assert.ok(state.band.hqItems.includes('meditation_pod'))
  })

  await t.test('Harmony regenerates on day advance', () => {
    state = gameReducer(state, {
      type: ActionTypes.UPDATE_BAND,
      payload: { harmony: 50 }
    })
    assert.equal(state.band.harmony, 50)

    // Advance day with meditation pod active
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.equal(state.band.harmony, 51, 'Harmony +1')
  })

  await t.test('Harmony clamped at 100', () => {
    state = gameReducer(state, {
      type: ActionTypes.UPDATE_BAND,
      payload: { harmony: 100 }
    })
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.equal(state.band.harmony, 100, 'Harmony clamped at max')
  })
})
```

### Verification
```bash
pnpm run test -- tests/meditation_pod.test.js
# ✓ Meditation Pod increases harmony daily
# ✓ Purchase meditation pod
# ✓ Harmony regenerates on day advance
# ✓ Harmony clamped at 100
```

---

## Pattern 3: Performance Optimization (Memory Leak)

### Scenario
Memory grows 50MB/min when switching gigs. Suspect: Pixi scene not destroying.

### Analysis
1. **Profiler**: DevTools Memory tab → heap snapshots
2. **Suspect**: `PixiStageController.jsx` or `GigScene.jsx`
3. **Cleanup**: Does `useEffect` return cleanup function?

### Implementation

**File: `src/components/PixiStageController.jsx`**
```javascript
// ❌ WRONG: No cleanup
useEffect(() => {
  const app = new PIXI.Application({ ... })
  containerRef.current.appendChild(app.view)

  // App runs but never destroyed
}, [])

// ✅ CORRECT: Destroy on unmount
useEffect(() => {
  const app = new PIXI.Application({ ... })
  containerRef.current.appendChild(app.view)

  return () => {
    // Full cleanup per CLAUDE.md
    app.destroy({
      removeView: true
    }, {
      children: true,
      texture: true,
      textureSource: true
    })
  }
}, [])
```

### Testing
1. Open DevTools Memory tab
2. Switch gigs 5 times
3. Force garbage collection (trash icon in DevTools)
4. Check heap size: Should NOT grow 50MB/min
5. Before: ~500MB. After: Still ~500MB (stable).

---

## Pattern 4: Refactoring (Extract Component)

### Scenario
`PreGigMenu.jsx` is 400 lines. Extract `ModifierSelector` component.

### Implementation
1. **Identify cohesive unit**: Lines 150-220 (modifier UI + state)
2. **Create `ModifierSelector.jsx`**:
   - Props: `modifiers`, `onModifierChange`
   - Returns: JSX for modifier buttons
3. **Update `PreGigMenu.jsx`**: Replace inline UI with `<ModifierSelector />`
4. **Test**: Vitest — props, callbacks, renders correctly
5. **Verify**: Same visual output, no behavioral change

### Verification
```bash
pnpm run test:ui -- tests/ModifierSelector.test.jsx
pnpm run build  # Ensure bundle size doesn't increase significantly
```

---

## Common Mistakes to Avoid

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Direct state mutation | Reducer doesn't return new state | Always use `{ ...state, changed: true }` |
| Missing action in ActionTypes | "Unknown action" error in tests | Add to `ActionTypes` enum first |
| Harmony not clamped | Harmony goes to 0 or 150 | Use `gameStateUtils.clampHarmony()` |
| Pixi not destroyed | Memory leak | Add cleanup in `useEffect` return |
| No i18n keys | Raw strings in UI | Use `t('namespace:key')` |
| Hardcoded colors | Color doesn't match theme | Use CSS vars: `var(--color-toxic-green)` |
| Per-frame allocation | FPS drops | Pre-compute arrays/objects, reuse them |

