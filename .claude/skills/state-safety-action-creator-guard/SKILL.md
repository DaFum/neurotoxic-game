---
name: state-safety-action-creator-guard
description: Enforce state immutability and valid transitions. Trigger when modifying the reducer, creating actions, or debugging state bugs.
---

# State Safety & Action Creator Guard

Ensure global state remains consistent, immutable, and valid.

## Workflow

1.  **Use Action Creators**
    *   **Rule**: Never dispatch raw objects (`dispatch({ type: 'FOO' })`).
    *   **Fix**: Import from `src/context/actionCreators.js`.
    *   *Why*: Centralizes logic and ensures payload shape.

2.  **Enforce Invariants**
    *   **Money**: Must be `>= 0`.
    *   **Harmony**: Must be `> 0` (or triggers Game Over).
    *   **Inventory**: Items must be unique IDs.

3.  **Check Reducer Logic**
    *   **Immutability**: Use spread syntax `...state` or `immer` (if available).
    *   **Clamping**: `Math.max(0, newState.money)`.

## Example

**Input**: "Deduct 50 money for the venue fee."

**Bad**:
```javascript
dispatch({ type: 'DEDUCT_MONEY', amount: 50 });
```

**Good**:
```javascript
import { updatePlayerMoney } from '../context/actionCreators';
dispatch(updatePlayerMoney(-50));
```

**Reducer Check**:
```javascript
case 'UPDATE_MONEY':
  return {
    ...state,
    player: {
      ...state.player,
      money: Math.max(0, state.player.money + action.payload)
    }
  };
```

**Output**:
"Updated dispatch to use `updatePlayerMoney`. Verified reducer clamps money at 0."
