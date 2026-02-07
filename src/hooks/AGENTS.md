# src/hooks/AGENTS.md

## Custom Hooks Specialist

This module contains custom React hooks that encapsulate complex game logic, promoting separation of concerns and reusability.

## Module Overview

| Hook               | Purpose                              | Used By                  |
| ------------------ | ------------------------------------ | ------------------------ |
| `useTravelLogic`   | Travel state, costs, navigation      | Overworld.jsx            |
| `usePurchaseLogic` | Shop purchases, inventory management | BandHQ.jsx, MainMenu.jsx |

## useTravelLogic

Encapsulates all travel-related state and logic for the Overworld scene.

### Import

```javascript
import { useTravelLogic } from '../hooks/useTravelLogic'
```

### Parameters

```javascript
const travel = useTravelLogic({
  player, // Player state object
  band, // Band state object
  gameMap, // Generated game map
  updatePlayer, // Player update function
  updateBand, // Band update function
  advanceDay, // Day advancement function
  triggerEvent, // Event trigger function
  startGig, // Gig start function
  hasUpgrade, // Upgrade check function
  addToast, // Toast notification function
  changeScene, // Scene change function
  onShowHQ // Optional HQ display callback
})
```

### Return Values

```javascript
const {
  // State
  isTraveling, // boolean - Travel animation active
  travelTarget, // Object|null - Target node

  // Computed
  getCurrentNode, // () => Object|null - Current node
  isConnected, // (nodeId) => boolean - Check connection
  getNodeVisibility, // (nodeLayer, currentLayer) => string

  // Actions
  handleTravel, // (node) => void - Initiate travel
  handleRefuel, // () => void - Refuel van
  onTravelComplete, // (explicitNode?) => void - Complete travel
  travelCompletedRef // Ref for completion tracking
} = travel
```

### Key Features

- **Cost Calculation**: Uses `calculateTravelExpenses()` from economyEngine
- **Softlock Detection**: Monitors fuel/money to prevent game-over states
- **Event Integration**: Triggers travel and band events on arrival
- **Node Type Handling**: REST_STOP, SPECIAL, START, GIG nodes

### Example Usage

```jsx
function Overworld() {
  const { player, band, gameMap, ... } = useGameState()

  const {
    isTraveling,
    handleTravel,
    handleRefuel,
    getCurrentNode
  } = useTravelLogic({
    player, band, gameMap,
    updatePlayer, updateBand,
    advanceDay, triggerEvent,
    startGig, hasUpgrade,
    addToast, changeScene
  })

  const currentNode = getCurrentNode()

  return (
    <div>
      <MapDisplay
        nodes={gameMap.nodes}
        onNodeClick={handleTravel}
        isTraveling={isTraveling}
      />
      <button onClick={handleRefuel}>REFUEL</button>
    </div>
  )
}
```

---

## usePurchaseLogic

Encapsulates all purchase-related logic for the BandHQ shop.

### Import

```javascript
import { usePurchaseLogic } from '../hooks/usePurchaseLogic'
```

### Parameters

```javascript
const purchase = usePurchaseLogic({
  player, // Player state object
  band, // Band state object
  updatePlayer, // Player update function
  updateBand, // Band update function
  addToast // Toast notification function
})
```

### Return Values

```javascript
const {
  handleBuy, // (item) => boolean - Purchase item
  isItemOwned, // (item) => boolean - Check ownership
  canAfford, // (item) => boolean - Check affordability
  isItemDisabled // (item) => boolean - Should disable button
} = purchase
```

### Supported Effect Types

| Effect Type      | Description            | Example                                                             |
| ---------------- | ---------------------- | ------------------------------------------------------------------- |
| `inventory_set`  | Set inventory boolean  | `{ type: 'inventory_set', item: 'golden_pick', value: true }`       |
| `inventory_add`  | Add to inventory count | `{ type: 'inventory_add', item: 'shirts', value: 50 }`              |
| `stat_modifier`  | Modify stats           | `{ type: 'stat_modifier', target: 'van', stat: 'fuel', value: 20 }` |
| `unlock_upgrade` | Unlock van upgrade     | `{ type: 'unlock_upgrade', id: 'van_sound_system' }`                |
| `unlock_hq`      | Unlock HQ item         | `{ type: 'unlock_hq' }`                                             |

### Example Usage

```jsx
function ShopTab({ items }) {
  const { player, band, updatePlayer, updateBand, addToast } = useGameState()

  const { handleBuy, isItemDisabled } = usePurchaseLogic({
    player,
    band,
    updatePlayer,
    updateBand,
    addToast
  })

  return (
    <div>
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => handleBuy(item)}
          disabled={isItemDisabled(item)}
        >
          {item.name} - {item.cost} {item.currency === 'fame' ? 'Fame' : '$'}
        </button>
      ))}
    </div>
  )
}
```

---

## Creating New Hooks

### Guidelines

1. **Single Responsibility**: Each hook handles one logical domain
2. **Pure Logic**: Extract calculations to utility functions
3. **Dependency Injection**: Accept state and callbacks as parameters
4. **Return Object**: Use consistent return shape with state, computed, and actions

### Template

```javascript
/**
 * Hook description
 * @module useHookName
 */

import { useState, useCallback } from 'react'
import { handleError } from '../utils/errorHandler'

/**
 * @param {Object} params
 * @param {Object} params.player - Player state
 * @returns {Object} Hook return values
 */
export const useHookName = ({ player, ...other }) => {
  const [localState, setLocalState] = useState(null)

  const computedValue = useCallback(() => {
    // Computed logic
  }, [dependencies])

  const handleAction = useCallback(() => {
    try {
      // Action logic
    } catch (error) {
      handleError(error, { ...options })
    }
  }, [dependencies])

  return {
    // State
    localState,
    // Computed
    computedValue,
    // Actions
    handleAction
  }
}
```

---

## Testing

Tests are located in `/tests/`:

```bash
npm run test -- --grep "useTravelLogic"
npm run test -- --grep "usePurchaseLogic"
```

### Test Patterns

```javascript
import { renderHook, act } from '@testing-library/react-hooks'
import { usePurchaseLogic } from '../src/hooks/usePurchaseLogic'

describe('usePurchaseLogic', () => {
  it('should handle purchase correctly', () => {
    const { result } = renderHook(() =>
      usePurchaseLogic({
        player: { money: 500 },
        band: { inventory: {} },
        updatePlayer: jest.fn(),
        updateBand: jest.fn(),
        addToast: jest.fn()
      })
    )

    act(() => {
      result.current.handleBuy(mockItem)
    })

    // Assert expectations
  })
})
```

---

## Dependencies

- `src/utils/economyEngine.js` - Travel cost calculations
- `src/utils/errorHandler.js` - Centralized error handling
- `src/utils/AudioManager.js` - Sound effects
- `src/utils/logger.js` - Debug logging

## Maintenance

- Last updated: 2026-02-06.
