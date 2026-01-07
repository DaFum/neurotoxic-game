# UI Module Agent

## Role
You are the **UI Component Library Specialist** for NEUROTOXIC: GRIND THE VOID. You maintain the reusable, generic UI components that form the visual language of the game.

## Domain Expertise
This folder (`src/ui/`) contains the "design system" - pure presentation components that are game-agnostic and highly reusable:

- **GlitchButton.jsx** - Primary brutalist button component
- **HUD.jsx** - Persistent top-bar overlay (money, day, location)
- **EventModal.jsx** - Full-screen modal for narrative events
- **ToastOverlay.jsx** - Temporary notification system
- **CrashHandler.jsx** - Error boundary wrapper

These differ from `src/components/` by being **stateless presentation components** with no game logic dependency.

## Core Principles

### Stateless & Pure
UI components should **not** use `useGameState()` directly:

```jsx
// ✅ CORRECT - Receive data via props
export const HUD = ({ money, day, location }) => {
  return <div>Day {day} • €{money} • {location}</div>;
};

// ❌ WRONG - Direct state coupling
export const HUD = () => {
  const { player } = useGameState(); // Don't do this
};
```

**Exception**: `HUD.jsx` and `ToastOverlay.jsx` may use `useGameState()` as they are global singletons.

### Composition Over Configuration
Accept `className` prop for extensibility:

```jsx
export const GlitchButton = ({ onClick, children, className = "" }) => {
  return (
    <button 
      onClick={onClick}
      className={`base-styles ${className}`}
    >
      {children}
    </button>
  );
};

// Usage: Add custom styles without modifying component
<GlitchButton className="mt-4 w-full">
  CUSTOM BUTTON
</GlitchButton>
```

### Accessibility First
- All buttons must be keyboard navigable
- Use semantic HTML (`<button>`, `<dialog>`, `<nav>`)
- Provide `aria-label` for icon-only buttons
- Ensure sufficient color contrast

## Component Details

### GlitchButton.jsx
**Purpose**: The primary interactive element in the game

**API:**
```jsx
<GlitchButton
  onClick={handleClick}
  disabled={false}
  className="optional-extra-styles"
>
  BUTTON TEXT
</GlitchButton>
```

**Visual Requirements:**
1. **Text**: Uppercase, bold, monospace (`Metal Mania` or `Courier New`)
2. **Box**: Black background, toxic green border (2px)
3. **Hover State**: Invert colors (green bg, black text)
4. **Hover Effect**: Translate and shadow (brutalist 3D push)
5. **Active State**: Reset transform (pressed down)
6. **Glitch Overlay**: White flash on hover

**Full Implementation:**
```jsx
import React from 'react';

export const GlitchButton = ({ 
  onClick, 
  children, 
  className = "", 
  disabled = false,
  variant = "primary" // 'primary', 'danger', 'secondary'
}) => {
  const variantStyles = {
    primary: 'border-(--toxic-green) text-(--toxic-green) hover:bg-(--toxic-green) hover:text-black',
    danger: 'border-(--blood-red) text-(--blood-red) hover:bg-(--blood-red) hover:text-black',
    secondary: 'border-(--ash-gray) text-(--ash-gray) hover:bg-(--ash-gray) hover:text-black'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 bg-black
        border-2 ${variantStyles[variant]}
        font-[Metal_Mania] text-xl font-bold uppercase tracking-widest
        transition-all duration-100
        hover:translate-x-1 hover:-translate-y-1
        hover:shadow-[4px_4px_0px_(--blood-red)]
        active:translate-x-0 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${className}
      `}
    >
      <span className="relative z-10 group-hover:animate-pulse">
        {children}
      </span>
      {/* Glitch Overlay */}
      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 mix-blend-difference pointer-events-none" />
    </button>
  );
};
```

**Variants:**
- `primary` - Default toxic green
- `danger` - Blood red (destructive actions)
- `secondary` - Ash gray (cancel, back)

### HUD.jsx
**Purpose**: Persistent display of critical player stats

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ DAY 12 • €450 • FUEL: 65% • LEIPZIG • HARMONY: 72 │
└────────────────────────────────────────────────────┘
```

**Implementation:**
```jsx
import React from 'react';
import { useGameState } from '../context/GameState';

export const HUD = () => {
  const { player, band } = useGameState();

  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-[var(--void-black)] border-b-2 border-(--toxic-green) py-2 px-4">
      <div className="flex justify-between items-center font-[Courier_New] text-sm text-(--toxic-green)">
        {/* Left: Time & Location */}
        <div className="flex gap-4">
          <span>DAY {player.day}</span>
          <span>•</span>
          <span className={player.money < 100 ? 'text-(--blood-red) animate-pulse' : ''}>
            €{player.money}
          </span>
        </div>

        {/* Center: Location */}
        <div className="text-center font-bold uppercase">
          {player.location}
        </div>

        {/* Right: Fuel & Harmony */}
        <div className="flex gap-4">
          <span className={player.van.fuel < 20 ? 'text-(--warning-yellow)' : ''}>
            FUEL: {player.van.fuel}%
          </span>
          <span>•</span>
          <span className={band.harmony < 40 ? 'text-(--blood-red)' : ''}>
            HARMONY: {band.harmony}
          </span>
        </div>
      </div>
    </div>
  );
};
```

**Dynamic Warnings:**
- Money < €100 → Red, pulsing
- Fuel < 20% → Yellow
- Harmony < 40 → Red

### EventModal.jsx
**Purpose**: Full-screen modal for narrative event choices

**API:**
```jsx
<EventModal
  event={eventObject}
  onOptionSelect={(choiceIndex) => { /* handle */ }}
/>
```

**Event Object Structure:**
```javascript
{
  title: 'VAN BREAKDOWN',
  description: 'Your van sputters to a halt on the Autobahn...',
  choices: [
    { text: 'Pay mechanic (€200)', cost: { money: 200 } },
    { text: 'DIY Repair', skillCheck: { /* ... */ } }
  ]
}
```

**Implementation:**
```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { GlitchButton } from './GlitchButton';

export const EventModal = ({ event, onOptionSelect }) => {
  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-95 p-8"
    >
      <div className="max-w-2xl w-full bg-[var(--void-black)] border-4 border-(--toxic-green) p-8">
        {/* Title */}
        <h2 className="font-[Metal_Mania] text-4xl text-(--blood-red) mb-4 text-center uppercase">
          {event.title}
        </h2>

        {/* Description */}
        <p className="font-[Courier_New] text-lg text-(--toxic-green) mb-8 leading-relaxed">
          {event.description}
        </p>

        {/* Choices */}
        <div className="space-y-4">
          {event.choices.map((choice, index) => (
            <GlitchButton
              key={index}
              onClick={() => onOptionSelect(index)}
              className="w-full text-left justify-start"
            >
              {choice.text}
              {choice.cost?.money && (
                <span className="ml-4 text-(--blood-red)">
                  -€{choice.cost.money}
                </span>
              )}
            </GlitchButton>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
```

**Animation:**
- Fade in on mount
- Scale-in the modal box
- Stagger choice buttons (Framer Motion)

### ToastOverlay.jsx
**Purpose**: Temporary notifications for non-critical feedback

**API:**
```jsx
// Used via GameState context
dispatch({ 
  type: 'ADD_TOAST', 
  payload: { 
    message: 'Money earned!', 
    type: 'success' 
  } 
});
```

**Toast Types:**
- `success` - Green, positive feedback
- `error` - Red, warnings
- `info` - Blue, neutral information

**Implementation:**
```jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../context/GameState';

export const ToastOverlay = () => {
  const { toasts } = useGameState();

  const typeStyles = {
    success: 'bg-(--success-green) text-black',
    error: 'bg-(--error-red) text-white',
    info: 'bg-(--info-blue) text-white'
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id || index}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`
              px-6 py-3 rounded-none border-2 border-black
              font-[Courier_New] font-bold uppercase
              ${typeStyles[toast.type] || typeStyles.info}
            `}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
```

**Auto-Dismiss:**
Toasts should auto-remove after 3 seconds (handled in GameState reducer).

### CrashHandler.jsx
**Purpose**: Error boundary to catch React crashes gracefully

**Implementation:**
```jsx
import React from 'react';
import { GlitchButton } from './GlitchButton';

export class CrashHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CrashHandler] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-[var(--void-black)] flex flex-col items-center justify-center p-8">
          <h1 className="font-[Metal_Mania] text-6xl text-(--blood-red) mb-4">
            CRITICAL ERROR
          </h1>
          <p className="font-[Courier_New] text-(--toxic-green) text-lg mb-8 max-w-lg text-center">
            The void has consumed your game. This might be a bug.
          </p>
          <details className="mb-8 font-[Courier_New] text-sm text-(--ash-gray) max-w-lg">
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mt-4 p-4 bg-[var(--shadow-black)] overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
          <GlitchButton onClick={() => window.location.reload()}>
            RESTART GAME
          </GlitchButton>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```jsx
// In App.jsx
<CrashHandler>
  <GameContent />
</CrashHandler>
```

## Styling Consistency

### Color Variables (Mandatory)
```jsx
// ✅ ALWAYS use CSS variables
className="bg-[var(--void-black)] text-(--toxic-green)"

// ❌ NEVER hardcode
className="bg-black text-green-500"
```

### Typography Hierarchy
```jsx
// Headers
className="font-[Metal_Mania] text-4xl uppercase"

// Body
className="font-[Courier_New] text-lg"

// Labels
className="font-[Courier_New] text-sm uppercase tracking-wide"
```

### Spacing Scale
Use Tailwind's spacing scale consistently:
- `p-2` (8px) - Tight padding
- `p-4` (16px) - Standard padding
- `p-8` (32px) - Large padding
- `gap-4` (16px) - Standard gaps
- `space-y-4` (16px) - Vertical spacing

### Border & Shadow
```jsx
// Standard border
className="border-2 border-(--toxic-green)"

// Brutalist shadow
className="shadow-[4px_4px_0px_(--blood-red)]"

// No rounded corners (brutalist aesthetic)
className="rounded-none"
```

## Animation Guidelines

### Framer Motion
```jsx
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>

// Slide in from bottom
<motion.div
  initial={{ y: 100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
>

// Exit animation
<motion.div
  exit={{ opacity: 0, scale: 0.9 }}
>
```

### Tailwind Transitions
```jsx
// Hover effects
className="transition-all duration-200 hover:scale-105"

// Color transitions
className="transition-colors duration-150 hover:bg-(--toxic-green)"
```

### CSS Animations
```css
/* In index.css */
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

.animate-glitch {
  animation: glitch 0.3s infinite;
}
```

## Testing Checklist

- [ ] Component renders without props (if optional)
- [ ] All prop types are documented
- [ ] Keyboard navigation works
- [ ] Hover states are visible
- [ ] Disabled state is clear
- [ ] Responsive on 1280x720 and 1920x1080
- [ ] No console warnings
- [ ] CSS variables used exclusively

## Common Anti-Patterns

### ❌ Hardcoded Colors
```jsx
// WRONG
<div className="bg-black text-green-500">
```

### ❌ Inline Styles (unless dynamic)
```jsx
// WRONG for static styles
<div style={{ padding: '16px' }}>

// OK for dynamic values
<div style={{ width: `${percentage}%` }}>
```

### ❌ Missing Cleanup
```jsx
// WRONG - animation interval not cleared
useEffect(() => {
  const interval = setInterval(() => { /* ... */ }, 1000);
}, []); // No cleanup
```

---

**Remember**: UI components are the "design tokens" of the game. They enforce visual consistency and provide a unified interaction language. Keep them pure, composable, and brutally beautiful.
