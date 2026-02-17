# GitHub Copilot Instructions for NEUROTOXIC: GRIND THE VOID

## Primary Directive

**Before generating any code, consult `/AGENTS.md` for project overview and specialized sub-agent guidance in each `src/*/AGENTS.md` file.**

## Project Identity

Web-based Roguelike Tour Manager with rhythm action mechanics. Manage a Death Grindcore band touring Germany.

**Design Philosophy**: Aesthetic-first, brutalist UI.

## Tech Stack

| Category    | Technology    | Version                     |
| ----------- | ------------- | --------------------------- |
| Framework   | React         | 19.2.4                      |
| Build       | Vite          | 7.3.1                       |
| Language    | JavaScript    | ECMAScript 2021 (ESModules) |
| Game Engine | Pixi.js       | 8.16.0                      |
| Animation   | Framer Motion | 12.34.0                     |
| Styling     | Tailwind CSS  | 4.1.18                      |
| Audio       | Tone.js       | 15.x                        |
| Linting     | ESLint        | 9.39.2                      |

## Visual Design System (STRICT)

### Color Palette

<!-- jscpd:ignore-start -->

**NEVER use hardcoded colors.** Always use CSS variables. Refer to `CLAUDE.md` for the full palette and usage examples.

| Variable           | Hex     | Usage                     |
| ------------------ | ------- | ------------------------- |
| `--toxic-green`    | #00FF41 | Primary UI, text, borders |
| `--void-black`     | #0A0A0A | Backgrounds               |
| `--blood-red`      | #CC0000 | Errors, critical states   |
| `--ash-gray`       | #3A3A3A | Secondary text, borders   |
| `--warning-yellow` | #FFCC00 | Warnings                  |

<!-- jscpd:ignore-end -->

### Typography

- Headers: `font-family: var(--font-display)` ('Metal Mania')
- UI/Body: `font-family: var(--font-ui)` ('Courier New', monospace)

### UI Patterns

- Buttons: uppercase, boxy, brutalist
- CRT overlay in main layouts when `settings.crtEnabled`
- Glitch effects sparingly on hover/critical states

## State Management Architecture

### Module Structure

```text
src/context/
├── GameState.jsx      # Context provider with useGameState() hook
├── initialState.js    # Default state configurations
├── gameReducer.js     # Centralized reducer with ActionTypes
└── actionCreators.js  # Factory functions for dispatch actions
```

### Action Pattern

```jsx
import { useGameState } from '../context/GameState'
import { ActionTypes } from '../context/gameReducer'
import { createUpdatePlayerAction } from '../context/actionCreators'

function MyComponent() {
  const { player, dispatch } = useGameState()

  // Use action creators for type safety
  // Always use Math.max(0, ...) for deductions to prevent negative values
  dispatch(createUpdatePlayerAction({ money: Math.max(0, player.money - 100) }))

  // Or dispatch directly with ActionTypes
  dispatch({ type: ActionTypes.UPDATE_PLAYER, payload: { money: 400 } })
}
```

### Available Action Types

```javascript
ActionTypes = {
  CHANGE_SCENE,
  UPDATE_PLAYER,
  UPDATE_BAND,
  UPDATE_SOCIAL,
  UPDATE_SETTINGS,
  SET_MAP,
  SET_GIG,
  START_GIG,
  SET_SETLIST,
  SET_LAST_GIG_STATS,
  SET_ACTIVE_EVENT,
  ADD_TOAST,
  REMOVE_TOAST,
  SET_GIG_MODIFIERS,
  LOAD_GAME,
  RESET_STATE,
  APPLY_EVENT_DELTA,
  POP_PENDING_EVENT,
  CONSUME_ITEM,
  ADVANCE_DAY
}
```

## Custom Hooks

### Travel Logic (`src/hooks/useTravelLogic.js`)

```jsx
const {
  isTraveling, travelTarget,
  handleTravel, handleRefuel,
  getCurrentNode, isConnected, getNodeVisibility
} = useTravelLogic({ player, band, gameMap, updatePlayer, ... })
```

### Purchase Logic (`src/hooks/usePurchaseLogic.js`)

```jsx
const { handleBuy, isItemOwned, canAfford, isItemDisabled } = usePurchaseLogic({
  player,
  band,
  updatePlayer,
  updateBand,
  addToast
})
```

## Error Handling

Use the centralized error handler (`src/utils/errorHandler.js`):

```javascript
import { handleError, GameError, StateError } from '../utils/errorHandler'

try {
  // risky operation
} catch (error) {
  handleError(error, { addToast, fallbackMessage: 'Operation failed' })
}

// For state errors
throw new StateError('Invalid state transition', { from: 'MENU', to: 'GIG' })
```

## Pixi.js Integration (CRITICAL)

Always wrap Pixi app creation with mounted ref to prevent memory leaks:

```jsx
const isMountedRef = useRef(true)

useEffect(() => {
  const app = new Application({ ... })

  return () => {
    isMountedRef.current = false
    app.destroy(true, { children: true, texture: true })
  }
}, [])
```

## Shared UI Components

Use components from `src/ui/shared/index.jsx`:

```jsx
import { StatBox, ProgressBar, Panel, ActionButton, Modal, Grid } from '../ui/shared/index.jsx'

<StatBox label="MONEY" value={player.money} icon="$" />
<ProgressBar label="FUEL" value={fuel} max={100} color="bg-(--toxic-green)" />
<ActionButton onClick={handleClick} variant="primary">ACTION</ActionButton>
```

## Code Style

### Component Structure

```jsx
export const ComponentName = ({ prop1, prop2 }) => {
  // 1. Hooks first
  const { player } = useGameState()
  const [localState, setLocalState] = useState(null)

  // 2. Effects
  useEffect(() => { ... }, [deps])

  // 3. Handlers
  const handleEvent = () => { ... }

  // 4. Return JSX
  return <div>...</div>
}
```

### Naming Conventions

| Type                | Convention           | Example                           |
| ------------------- | -------------------- | --------------------------------- |
| Components          | PascalCase           | `GameState`, `PixiStage`          |
| Functions/Variables | camelCase            | `handleKeyPress`, `currentGig`    |
| Constants/Enums     | SCREAMING_SNAKE_CASE | `EVENTS_DB`, `ActionTypes`        |
| Files               | Match export         | `GameState.jsx`, `eventEngine.js` |

### Import Order

```javascript
// 1. React
import React, { useState, useEffect } from 'react'
// 2. Third-party
import { motion } from 'framer-motion'
// 3. Context/Hooks
import { useGameState } from '../context/GameState'
// 4. Components
import { GlitchButton } from '../ui/GlitchButton'
// 5. Utils/Data
import { eventEngine } from '../utils/eventEngine'
```

## Critical Constraints

### Version Pinning (DO NOT UPGRADE)

- `react@^18.2.0` (not v19)
- `vite@^5.0.0` (not alpha/beta)
- `tailwindcss@^4.0.0` (v4 syntax required)

### Tailwind v4 Syntax

```css
/* CORRECT */
@import 'tailwindcss';

/* WRONG */
@tailwind base;
```

#### CSS Variable Syntax (v4)

**Wichtig:** Tailwind v4 ändert die Syntax für CSS-Variablen.

- **Neu (v4):** `bg-(--void-black)` oder `text-(--toxic-green)`
- **Alt (v3):** bracket-variable syntax (jetzt falsch)

Siehe `docs/TAILWIND_V4_PATTERNS.md` für weitere Details.

### State Safety

- Check `player.money >= 0` before deductions
- Validate `band.harmony > 0` before gigs
- Use `Math.max(0, value)` to prevent negatives

## Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # ESLint
npm run format   # Prettier
```

## Sub-Agent Documentation

| Area       | File                       | Expertise                      |
| ---------- | -------------------------- | ------------------------------ |
| State      | `src/context/AGENTS.md`    | Reducers, actions, state shape |
| Hooks      | `src/hooks/AGENTS.md`      | Custom hooks, logic extraction |
| Scenes     | `src/scenes/AGENTS.md`     | Navigation, game flow          |
| Utils      | `src/utils/AGENTS.md`      | Engines, calculations          |
| Components | `src/components/AGENTS.md` | Pixi.js, rendering             |
| Data       | `src/data/AGENTS.md`       | Events, venues, balance        |
| UI         | `src/ui/AGENTS.md`         | Design system                  |

## Quality Checklist

- [ ] Builds without errors (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Uses CSS variables (no hardcoded colors)
- [ ] Follows naming conventions
- [ ] Pixi.js cleanup implemented
- [ ] Uses action creators for state changes
- [ ] UI matches brutalist aesthetic

---

**Remember**: Aesthetic coherence and functional stability over feature bloat.

_Documentation sync: dependency/tooling baseline reviewed on 2026-02-17._
