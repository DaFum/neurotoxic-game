# GitHub Copilot Instructions for NEUROTOXIC: GRIND THE VOID

## 🎯 Primary Directive

**Before generating any code, ALWAYS consult `/AGENTS.md` for comprehensive project documentation and specialized sub-agent guidance.**

## 🎮 Project Identity

This is a web-based Roguelike Tour Manager game with rhythm action mechanics. The player manages a Death Grindcore band touring Germany.

**Design Philosophy**: Aesthetic-first, brutalist UI with "Designer-Turned-Developer" sensibility.

## 🛠️ Tech Stack

### Core Framework

- **React 18.2.0** (ESModules) - UI framework and state management
- **Vite 5.0.0** - Build tool and dev server
- **JavaScript (ES2021)** - No TypeScript; use JSDoc comments for complex functions

### Game Engine & Graphics

- **Pixi.js 8.0.0** - High-performance 2D canvas rendering for rhythm game
- **Framer Motion 12.0.0** - UI animations and transitions

### Styling

- **Tailwind CSS v4** - Utility-first CSS framework
  - Use `@import "tailwindcss";` syntax (NOT `@tailwind base`)
  - Rely heavily on CSS custom properties from `src/index.css`
- **CSS Custom Properties** - Primary theming mechanism

### Audio

- **Howler.js 2.2.4** - Audio playback and management

### Linting

- **ESLint 8.57** - Code quality
- **eslint-plugin-react** - React-specific linting
- **eslint-plugin-react-hooks** - Hooks validation

## 🎨 Visual Design System (STRICT ENFORCEMENT)

### Color Palette

**NEVER use hardcoded hex values or standard colors.** Always use CSS variables:

```jsx
// ✅ CORRECT
<div className="bg-[var(--void-black)] text-[var(--toxic-green)]">
<div style={{ borderColor: 'var(--blood-red)' }}>

// ❌ WRONG
<div className="bg-black text-green-500">
<div style={{ borderColor: '#CC0000' }}>
```

**Primary Variables:**

- `--toxic-green` (#00FF41) - Primary UI color, text, borders
- `--void-black` (#0A0A0A) - Backgrounds
- `--blood-red` (#CC0000) - Errors, critical states
- `--shadow-black`, `--concrete-gray`, `--ash-gray` - UI depth
- `--cosmic-purple`, `--void-blue` - Special effects

### Typography

```jsx
// Headers and display text
font-family: var(--font-display)  // 'Metal Mania', cursive

// UI and body text
font-family: var(--font-ui)  // 'Courier New', monospace
```

### UI Component Patterns

1. **Buttons must be uppercase, boxy, with brutalist aesthetics**

   ```jsx
   <GlitchButton onClick={handleClick}>BRUTAL TEXT</GlitchButton>
   ```

2. **Always include CRT overlay in main layouts**

   ```jsx
   {
     settings.crtEnabled && (
       <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
     )
   }
   ```

3. **Glitch effects for emphasis** - Use sparingly on hover/critical states

## 📐 Code Style Conventions

### React Patterns

#### State Management

```jsx
// ✅ Use the global context hook
import { useGameState } from '../context/GameState'

function MyComponent() {
  const { player, band, dispatch } = useGameState()
  // ...
}

// ❌ DO NOT prop-drill deeply
// ❌ DO NOT create new context providers
```

#### Component Structure

```jsx
// Standard functional component pattern
export const ComponentName = ({ prop1, prop2 }) => {
  // 1. Hooks first
  const { stateValue } = useGameState()
  const [localState, setLocalState] = useState(null)

  // 2. Effects after hooks
  useEffect(() => {
    // ...
  }, [dependencies])

  // 3. Event handlers
  const handleEvent = () => {
    // ...
  }

  // 4. Return JSX
  return <div>...</div>
}
```

#### Pixi.js Integration

**CRITICAL PATTERN**: Always wrap Pixi app creation in `useEffect` with mounted ref:

```jsx
useEffect(() => {
  const isMountedRef = { current: true };

  // Create Pixi app
  const app = new Application({...});

  // Cleanup
  return () => {
    isMountedRef.current = false;
    app.destroy(true, { children: true, texture: true });
  };
}, []);
```

This prevents memory leaks during React Strict Mode double-rendering.

### JavaScript Style

#### Naming Conventions

- **Components**: PascalCase (`GameState`, `PixiStage`)
- **Functions/Variables**: camelCase (`handleKeyPress`, `currentGig`)
- **Constants/Enums**: SCREAMING_SNAKE_CASE (`EVENTS_DB`, `IMG_PROMPTS`)
- **Files**: Match component name (`GameState.jsx`) or camelCase for utils (`eventEngine.js`)

#### Function Declarations

```javascript
// Prefer arrow functions for utilities
export const calculateDamage = (base, modifier) => {
  return base * modifier
}

// Use function declarations for class methods or complex logic
function processGameLoop(deltaTime) {
  // Complex multi-step logic
}
```

#### Destructuring & Spreading

```javascript
// ✅ Use destructuring for readability
const { player, band, dispatch } = useGameState()
const { money, day, location } = player

// ✅ Use spreading for state updates
dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, money: newMoney } })
```

#### Error Handling

```javascript
// Check for null/undefined before operations
if (!currentGig) {
  console.error('[Gig] No current gig set')
  return
}

// Use optional chaining for nested properties
const venueName = currentGig?.venue?.name ?? 'Unknown'
```

### File Organization

#### Import Order

```javascript
// 1. React imports
import React, { useState, useEffect } from 'react'

// 2. Third-party libraries
import { motion } from 'framer-motion'

// 3. Local contexts/hooks
import { useGameState } from '../context/GameState'

// 4. Components
import { GlitchButton } from '../ui/GlitchButton'

// 5. Utilities/data
import { eventEngine } from '../utils/eventEngine'
import { EVENTS_DB } from '../data/events'
```

#### Component File Structure

```
src/
├── components/     # Reusable game components (PixiStage, ChatterOverlay)
├── context/        # Global state (GameState.jsx)
├── data/           # Static game databases (events, venues, songs)
├── hooks/          # Custom React hooks (useRhythmGameLogic)
├── scenes/         # Full-screen game states (MainMenu, Gig, Overworld)
├── ui/             # UI component library (GlitchButton, HUD, EventModal)
└── utils/          # Game engines and utilities (eventEngine, economyEngine)
```

## 🔒 Critical Constraints

### Version Pinning

**DO NOT upgrade these dependencies** - they are pinned for compatibility:

- `react@^18.2.0` (not v19)
- `vite@^5.0.0` (not alpha/beta)
- `tailwindcss@^4.0.0` (v4 syntax required)

### Tailwind v4 Syntax

```css
/* ✅ CORRECT - Tailwind v4 */
@import 'tailwindcss';

/* ❌ WRONG - Tailwind v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### State Safety

- Always check `player.money >= 0` before deductions (Game Over trigger)
- Validate `band.harmony > 0` before gigs
- Use `Math.max(0, value)` to prevent negative stats

## 🧪 Testing & Validation

### Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Preview production build
npm run preview
```

### Verification Strategy

- **Manual testing** via browser (http://localhost:5173)
- **Focus on game loop continuity** (Menu → Overworld → Gig → PostGig)
- **Test aesthetic integrity** (CRT overlay, color palette, glitch effects)

## 📋 Common Tasks Checklist

### Adding a New Scene

1. Create file in `src/scenes/`
2. Import and add route in `src/App.jsx`
3. Use `useGameState()` for navigation
4. Apply brutalist styling with CSS variables
5. Add CRT overlay if needed

### Creating a UI Component

1. Place in `src/ui/` for generic components
2. Use `GlitchButton` as style reference
3. Accept `className` prop for extensibility
4. Use Framer Motion for animations
5. Document props with JSDoc

### Implementing Game Logic

1. Create utility in `src/utils/` for pure logic
2. Use `src/context/GameState.jsx` for state mutations
3. Dispatch actions via `dispatch({ type, payload })`
4. Add events to `src/data/events/` categorically

### Working with Pixi.js

1. Always use the Pixi integration pattern from `Gig.jsx`
2. Store refs in `useRef` for canvas access
3. Clean up in `useEffect` return function
4. Use 60 FPS ticker for game loop

## 🤖 Sub-Agent Architecture

This repository uses specialized sub-agents for complex modules. Before making changes to these areas, consult the relevant agent documentation:

- **`/src/scenes/*.agent.md`** - Scene-specific game flow logic
- **`/src/utils/*.agent.md`** - Game engine mechanics
- **`/src/components/*.agent.md`** - Complex reusable components
- **`/src/data/*.agent.md`** - Game database structure

Each sub-agent file contains domain-specific expertise and conventions.

## 🎯 Quality Standards

### Before Committing

- [ ] Code builds without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Uses CSS variables (no hardcoded colors)
- [ ] Follows existing naming conventions
- [ ] Pixi.js cleanup properly implemented
- [ ] State mutations use dispatch actions
- [ ] UI matches brutalist aesthetic

### Code Review Focus

- **Aesthetic integrity** - Does it look/feel like the rest of the game?
- **Performance** - Is Pixi.js cleanup correct? Any memory leaks?
- **State consistency** - Are state changes atomic and safe?
- **Accessibility** - Keyboard navigation, clear feedback

## 📚 Additional Resources

- **Main Documentation**: `/AGENTS.md`
- **Asset Wishlist**: `/ASSET_REQUEST_LIST.md`
- **Feature Analysis**: `/FEATURES_AND_ANALYSIS.md`
- **Gap Analysis**: `/GAP_ANALYSIS.md`

---

**Remember**: This project values aesthetic coherence and functional stability over feature bloat. Every addition should enhance the brutalist, death-metal-infused experience without compromising the core game loop.
