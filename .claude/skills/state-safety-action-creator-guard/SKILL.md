---
name: state-safety-action-creator-guard
description: enforce state immutability and valid transitions. Trigger when modifying the reducer, creating actions, or debugging state bugs.
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
import { createUpdatePlayerAction } from 'src/context/actionCreators';

if (player.money >= 50) {
  // Use createUpdatePlayerAction with object payload
  dispatch(createUpdatePlayerAction({ money: Math.max(0, player.money - 50) }));
} else {
  console.error('Insufficient funds');
}
```

**Reducer Check**:
```javascript
case 'UPDATE_PLAYER':
  return {
    ...state,
    player: {
      ...state.player,
      ...action.payload
    }
  };
```

**Output**:
"Updated dispatch to use `createUpdatePlayerAction` with validation check `player.money >= 50`."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
