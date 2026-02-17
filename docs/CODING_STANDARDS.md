# Coding Standards

This document outlines the coding standards and best practices for the Neurotoxic game project.

## Table of Contents

1. [General Principles](#general-principles)
2. [JavaScript/JSX Standards](#javascriptjsx-standards)
3. [React Patterns](#react-patterns)
4. [State Management](#state-management)
5. [Error Handling](#error-handling)
6. [Documentation](#documentation)
7. [Testing](#testing)

---

## General Principles

### Single Responsibility

Each module, component, or function should have one clear responsibility.

```javascript
// Good: Single responsibility
const calculateTravelCost = (distance, fuelPrice) => distance * fuelPrice
const canAffordTravel = (money, cost) => money >= cost

// Bad: Multiple responsibilities
const handleTravel = (player, distance) => {
  const cost = distance * 1.5
  if (player.money >= cost) {
    player.money -= cost
    player.location = newLocation
    showToast('Traveled!')
  }
}
```

### Explicit Over Implicit

Make code intentions clear through naming and structure.

```javascript
// Good: Explicit
const isPlayerBankrupt = player.money < 0
const canPerformGig = band.harmony > 0

// Bad: Implicit
const shouldStop = p.m < 0
```

### Fail Fast

Validate inputs early and return early for error cases.

```javascript
// Good: Early return
const processEvent = event => {
  if (!event) return null
  if (!event.choices?.length) return null

  // Main logic...
}

// Bad: Deep nesting
const processEvent = event => {
  if (event) {
    if (event.choices?.length) {
      // Main logic...
    }
  }
}
```

---

## JavaScript/JSX Standards

### Naming Conventions

| Type               | Convention       | Example                          |
| ------------------ | ---------------- | -------------------------------- |
| Variables          | camelCase        | `playerMoney`, `isLoading`       |
| Constants          | UPPER_SNAKE_CASE | `MAX_HEALTH`, `DEFAULT_SPEED`    |
| Functions          | camelCase        | `calculateDamage`, `handleClick` |
| Components         | PascalCase       | `BandHQ`, `ProgressBar`          |
| Hooks              | use + camelCase  | `useTravelLogic`, `useGameState` |
| Files (components) | PascalCase.jsx   | `GameState.jsx`                  |
| Files (utilities)  | camelCase.js     | `eventEngine.js`                 |

### Variable Declarations

```javascript
// Use const by default
const MAX_HEALTH = 100
const player = { name: 'Band' }

// Use let only when reassignment is needed
let currentHealth = 100
currentHealth -= damage

// Never use var
```

### Arrow Functions

```javascript
// Prefer arrow functions for callbacks
const doubled = numbers.map(n => n * 2)

// Use regular functions for methods that need `this` binding
class Player {
  damage(amount) {
    this.health -= amount
  }
}
```

### Destructuring

```javascript
// Good: Destructure objects
const { money, fame, location } = player
const { harmony, members } = band

// Good: Destructure in function parameters
const formatPlayer = ({ name, level }) => `${name} (Level ${level})`

// Good: Destructure arrays
const [first, second, ...rest] = items
```

### Template Literals

```javascript
// Good: Template literals for string interpolation
const message = `Player ${name} earned ${amount}€`

// Bad: String concatenation
const message = 'Player ' + name + ' earned ' + amount + '€'
```

### Optional Chaining and Nullish Coalescing

```javascript
// Good: Safe property access
const fuel = player.van?.fuel ?? 0
const upgrades = player.van?.upgrades ?? []

// Bad: Manual null checks
const fuel = player.van && player.van.fuel ? player.van.fuel : 0
```

---

## React Patterns

### Component Structure

```jsx
/**
 * Component description
 * @param {Object} props - Component props
 */
export const MyComponent = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState(null)
  const { data } = useGameState()

  // 2. Refs
  const timerRef = useRef(null)

  // 3. Computed values
  const computedValue = useMemo(() => expensive(state), [state])

  // 4. Callbacks
  const handleClick = useCallback(() => {
    setState(newValue)
  }, [])

  // 5. Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    }
  }, [dependency])

  // 6. Early returns
  if (!data) return <Loading />

  // 7. Render
  return <div>{/* JSX */}</div>
}
```

### Hook Dependencies

```javascript
// Good: Specify all dependencies
useEffect(() => {
  fetchData(playerId)
}, [playerId])

// Good: Use useCallback for stable references
const handleClick = useCallback(() => {
  doSomething(value)
}, [value])

// Bad: Missing dependencies (causes stale closures)
useEffect(() => {
  fetchData(playerId) // playerId not in deps
}, [])
```

### Conditional Rendering

```jsx
// Good: Short-circuit for simple conditions
{
  isLoading && <Spinner />
}

// Good: Ternary for either/or
{
  isError ? <Error /> : <Content />
}

// Good: Early return for complex conditions
if (!data) return <Loading />
if (error) return <Error message={error} />
return <Content data={data} />
```

### Event Handlers

```jsx
// Good: Meaningful handler names
<button onClick={handleSubmit}>Submit</button>
<input onChange={handleInputChange} />

// Good: Inline for simple one-liners
<button onClick={() => setOpen(true)}>Open</button>

// Bad: Anonymous functions for complex logic
<button onClick={() => {
  validate();
  submit();
  resetForm();
}}>Submit</button>
```

---

## State Management

### Use Action Creators

```javascript
// Good: Action creators provide type safety
dispatch(createUpdatePlayerAction({ money: 100 }))

// Bad: Raw action objects are error-prone
dispatch({ type: 'UPDTE_PLAYER', payload: { money: 100 } }) // Typo!
```

### Immutable Updates

```javascript
// Good: Spread operator for immutable updates
return {
  ...state,
  player: {
    ...state.player,
    money: state.player.money + amount
  }
}

// Bad: Direct mutation
state.player.money += amount
return state
```

### State Structure

```javascript
// Good: Normalized state
const state = {
  entities: {
    venues: { v1: { id: 'v1', name: 'Club' } }
  },
  ids: ['v1']
}

// Acceptable: Nested state for closely related data
const state = {
  player: {
    money: 100,
    van: {
      fuel: 50,
      upgrades: []
    }
  }
}
```

---

## Error Handling

### Use Custom Error Types

```javascript
import { GameLogicError, StateError } from '../utils/errorHandler'

// Good: Specific error types
throw new GameLogicError('Invalid move', { from, to })

// Bad: Generic errors
throw new Error('Something went wrong')
```

### Handle Errors at Boundaries

```javascript
// Good: Centralized error handling
const handleTravel = () => {
  try {
    validateTravel()
    executeTravel()
  } catch (error) {
    handleError(error, { addToast })
  }
}

// Bad: Scattered try-catches
const validateTravel = () => {
  try {
    /* ... */
  } catch (e) {
    console.log(e)
  }
}
const executeTravel = () => {
  try {
    /* ... */
  } catch (e) {
    console.log(e)
  }
}
```

### Provide Fallbacks

```javascript
// Good: Safe defaults
const fuel = player.van?.fuel ?? 100
const upgrades = player.van?.upgrades ?? []

// Good: Safe operations
const result = safeStorageOperation(
  'load',
  () => {
    return JSON.parse(localStorage.getItem('save'))
  },
  null
)
```

---

## Documentation

### JSDoc Comments

```javascript
/**
 * Calculates travel expenses including fuel and food costs.
 * @param {Object} destination - Target node
 * @param {Object} origin - Starting node
 * @param {Object} player - Player state
 * @returns {{dist: number, fuelLiters: number, totalCost: number}}
 */
export const calculateTravelExpenses = (destination, origin, player) => {
  // Implementation
}
```

### Component Documentation

```jsx
/**
 * BandHQ Component
 * Displays statistics and a shop for purchasing upgrades.
 *
 * @param {Object} props
 * @param {Object} props.player - The player state
 * @param {Object} props.band - The band state
 * @param {Function} props.onClose - Callback to close the modal
 */
export const BandHQ = ({ player, band, onClose }) => {
  // Implementation
}
```

### Inline Comments

```javascript
// Good: Explain WHY, not WHAT
// Using timeout to allow animation to complete before state change
setTimeout(() => setVisible(false), 300)

// Bad: Redundant comments
// Increment counter by 1
counter += 1
```

---

## Testing

### Test Structure

```javascript
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'

describe('economyEngine', () => {
  describe('calculateTravelExpenses', () => {
    beforeEach(() => {
      // Setup
    })

    it('should calculate correct fuel cost for distance', () => {
      const result = calculateTravelExpenses(dest, origin, player)
      assert.strictEqual(result.fuelLiters, expected)
    })

    it('should return zero cost for same location', () => {
      const result = calculateTravelExpenses(origin, origin, player)
      assert.strictEqual(result.totalCost, 0)
    })
  })
})
```

### Test Naming

```javascript
// Good: Descriptive test names
it('should reject purchase when player has insufficient funds', () => {})
it('should apply harmony bonus when van has sound system upgrade', () => {})

// Bad: Vague test names
it('works', () => {})
it('handles edge case', () => {})
```

### Test Coverage Goals

- All utility functions: 90%+ coverage
- Reducers and action handlers: 95%+ coverage
- Components: Key interactions covered
- Edge cases: Null inputs, empty arrays, boundary values

---

## File Organization

### Import Order

```javascript
// 1. React and core libraries
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

// 2. Third-party libraries
import { motion } from 'framer-motion'
import * as PIXI from 'pixi.js'

// 3. Context and hooks
import { useGameState } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'

// 4. Components
import { BandHQ } from '../ui/BandHQ'
import { ProgressBar } from '../ui/shared'

// 5. Utilities and helpers
import { calculateTravelExpenses } from '../utils/economyEngine'
import { logger } from '../utils/logger'

// 6. Data and constants
import { ALL_VENUES } from '../data/venues'

// 7. Styles (if applicable)
import './Component.css'
```

### Export Patterns

```javascript
// Named exports for utilities (allows tree-shaking)
export const calculateDamage = () => {}
export const calculateHealing = () => {}

// Default export for components
export default function MyComponent() {}

// Or named export for components (preferred in this codebase)
export const MyComponent = () => {}
```

---

## Linter rules

The project uses ESLint with these key rules:

| Rule                          | Setting                  | Reason              |
| ----------------------------- | ------------------------ | ------------------- |
| `react/prop-types`            | off                      | Using JSDoc instead |
| `no-unused-vars`              | warn (ignore `_` prefix) | Catch dead code     |
| `react-hooks/rules-of-hooks`  | error                    | Enforce hooks rules |
| `react-hooks/exhaustive-deps` | warn                     | Catch missing deps  |

Run linting with:

```bash
npm run lint
```

Run formatting with:

```bash
npm run format
```

_Documentation sync: dependency/tooling baseline reviewed on 2026-02-17._
