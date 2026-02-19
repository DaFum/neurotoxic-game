# Components Module Agent

## Role

You are the **Game Component Specialist** for NEUROTOXIC: GRIND THE VOID. You maintain the specialized, reusable game components that bridge UI and game logic.

## Domain Expertise

This folder (`src/components/`) contains complex, game-specific components that are used across multiple scenes:

- **PixiStage.jsx** - Pixi.js canvas wrapper for rhythm game rendering
- **GigHUD.jsx** - In-game overlay showing score, combo, health during gigs
- **ChatterOverlay.jsx** - Simulated social media comments during performances
- **TutorialManager.jsx** - Step-by-step onboarding tooltips

These differ from `src/ui/` components by being tightly coupled to game state and logic, rather than being generic UI primitives.

## Component Architecture

### PixiStage.jsx

**Purpose**: Render the Pixi.js canvas for the rhythm game engine

**Props:**

```javascript
<PixiStage
  logic={rhythmGameLogicHook} // From useRhythmGameLogic()
/>
```

**Responsibilities:**

1. Create Pixi.js Application instance
2. Set up 3-lane note highway
3. Render falling notes synchronized to music
4. Visualize hit/miss feedback
5. Clean up on unmount

**Critical Pattern:**

```jsx
export const PixiStage = ({ logic }) => {
  const canvasRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const isMountedRef = { current: true }

    // Create Pixi Application
    const app = new Application({
      width: 1200,
      height: 600,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    })

    canvasRef.current.appendChild(app.view)
    appRef.current = app

    // Set up lanes, notes, etc.
    setupLanes(app, logic)

    // Game loop ticker
    app.ticker.add(delta => {
      if (!isMountedRef.current) return
      updateNotes(delta, logic)
    })

    // CRITICAL: Cleanup
    return () => {
      isMountedRef.current = false
      app.ticker.stop()
      app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true
      })
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ''
      }
    }
  }, [logic])

  return <div ref={canvasRef} className='pixi-container' />
}
```

**Rendering Details:**

- **Lanes**: 3 vertical columns, evenly spaced
- **Notes**: Rectangles/circles falling from top to bottom
- **Hit Zone**: Target line near bottom (10% from edge)
- **Feedback**: Flash effects on hit, red border on miss

**Performance:**

- Target 60 FPS via `app.ticker`
- Use object pooling for notes (reuse sprites)
- Destroy unused sprites immediately

**Coordinate System:**

```
(0, 0) ─────────────────────── (1200, 0)
  │   LANE 0  │  LANE 1  │  LANE 2  │
  │           │          │           │
  │    [300]  │  [600]   │   [900]   │ ← Lane X positions
  │           │          │           │
  │           │          │           │
  │    ████   │          │   ████    │ ← Falling notes
  │           │   ████   │           │
  │           │          │           │
  │ ========= │ ======== │ ========= │ ← Hit zone (y = 540)
(0, 600) ───────────────────── (1200, 600)
```

**Common Issues:**

- **Memory leaks**: Ensure `destroy()` is called
- **Double rendering**: Use `isMountedRef` check
- **Timing drift**: Use `app.ticker.deltaMS` for note speed

### GigHUD.jsx

**Purpose**: Display real-time game statistics during rhythm gameplay

**Props:**

```javascript
<GigHUD
  stats={{
    score: 12500,
    combo: 47,
    accuracy: 92.3,
    energy: 65,
    isToxicMode: false
  }}
/>
```

**Layout:**

```
┌─────────────────────────────────────────┐
│ SCORE: 12,500        COMBO: 47x         │
│ ACCURACY: 92.3%      ENERGY: ███▓▓ 65%  │
└─────────────────────────────────────────┘
```

**Implementation:**

```jsx
export const GigHUD = ({ stats }) => {
  return (
    <div className={`absolute inset-0 z-30 pointer-events-none ${isToxicMode ? 'toxic-border-flash' : ''}`}>
      <HecklerOverlay gameStateRef={gameStateRef} />

      {/* Input Zones & Stats Overlay (Score, Combo, Overload) omitted for brevity */}

      {/* Health Bar (Bottom Center) - Segmented */}
      <div className='absolute bottom-20 left-1/2 -translate-x-1/2 w-[28rem] z-10 pointer-events-none'>
        {/* ... */}
        {isToxicMode && (
          <div className='mt-2 text-(--blood-red) animate-neon-flicker font-bold tracking-widest text-center font-[var(--font-display)] text-sm'>
            TOXIC MODE ACTIVE
          </div>
        )}
      </div>

      {/* Controls Hint & Game Over Overlay omitted for brevity */}
    </div>
  )
}
```

**Visual Feedback:**

- Combo > 30 → Red, pulsing
- Accuracy < 70% → Yellow warning color
- Energy < 20% → Red, flashing border
- Toxic Mode → Full-screen border flash

### ChatterOverlay.jsx

**Purpose**: Simulate real-time social media comments across all scenes via a global overlay (with scene-aware labels).

**Props:**

- `gameState`: Snapshot of the current global game state (typically derived from `useGameState()` in a parent).
- `performance`: Current gig/performance metrics used to drive commentary intensity/content.
- `combo`: Current combo count used for hype/critique messaging.

**Behavior:**

- Global overlay driven by the provided `gameState`, `performance`, and `combo` props.
- Show up to 5 messages in a rolling stack (oldest are pushed out by new ones or auto-removed).
- Comments scroll in from bottom
- Content changes based on performance
- Uses `src/data/chatter.js` for message templates

**Message Templates:**

```javascript
// Scene-specific (PREGIG)
'Where is the sound guy?'
'Let's stick to the setlist this time, okay?'
// Condition-based (low mood)
'I swear if I have to drive another hour...'
// General travel
'My back hurts from sleeping in this seat.'
```

**Implementation:**

```jsx
export const ChatterOverlay = ({ gameState, performance, combo }) => {
  const [messages, setMessages] = useState([])
  const stateRef = useRef(gameState)
  const propsRef = useRef({ performance, combo })

  useEffect(() => {
    stateRef.current = gameState
    propsRef.current = { performance, combo }
  }, [gameState, performance, combo])

  useEffect(() => {
    let timeoutId
    const scheduleNext = () => {
      const delay = Math.random() * 17000 + 8000
      timeoutId = setTimeout(() => {
        // Use refs to access fresh state/props without restarting the timer loop
        const newMessage = getRandomChatter(stateRef.current)

        if (newMessage) {
           const msg = { ...newMessage, id: Date.now() }
           setMessages(prev => [...prev.slice(-4), msg])
           // Auto-remove logic...
        }
        scheduleNext()
      }, delay) // New message every 8-25 seconds (random per message)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, []) // Empty dependency array ensures single persistent loop

  // ... render logic
}
```

**Integration with Data:**

```javascript
import { getRandomChatter } from '../data/chatter'
const message = getRandomChatter(gameState)
```

**Tuning:**

- Venue-specific comments when at a known venue location
- Mood-driven messages (low mood < 30, high mood > 80)
- Money-based reactions (broke < €100, rich > €2000)
- Scene-aware messages (PREGIG, POSTGIG, GIG-specific lines)

### TutorialManager.jsx

**Purpose**: Guide new players through first-time experiences

**Props:**

```javascript
<TutorialManager />
```

**Tutorial Steps:**

1. Welcome screen (on first launch)
2. Map navigation explanation (first Overworld visit)
3. PreGig budget tutorial (first gig setup)
4. Rhythm controls explanation (first Gig scene)
5. PostGig summary walkthrough (first completion)

**State Management:**

```jsx
export const TutorialManager = () => {
  const { player, dispatch } = useGameState()
  const currentStep = player.tutorialStep

  const tutorials = [
    {
      step: 0,
      scene: 'MENU',
      message: 'Welcome to NEUROTOXIC...',
      position: 'center'
    },
    {
      step: 1,
      scene: 'OVERWORLD',
      message: 'Click on nodes to travel',
      position: 'top-left',
      target: '#map-container'
    }
    // ...
  ]

  const currentTutorial = tutorials.find(t => t.step === currentStep)

  const handleNext = () => {
    dispatch({
      type: 'UPDATE_PLAYER',
      payload: { tutorialStep: currentStep + 1 }
    })
  }

  if (!currentTutorial) return null

  return (
    <motion.div className='fixed inset-0 z-50 flex items-center justify-center bg-(--void-black)/90'>
      <div className='bg-(--void-black) border-4 border-(--toxic-green) p-8 max-w-lg'>
        <p className='font-[Courier_New] text-lg mb-4'>
          {currentTutorial.message}
        </p>
        <GlitchButton onClick={handleNext}>GOT IT</GlitchButton>
      </div>
    </motion.div>
  )
}
```

**Skip Option:**

- Allow users to dismiss all tutorials
- Store `tutorialStep: -1` to indicate "disabled"

## Styling Guidelines

### Consistent Spacing

```jsx
// ✅ Use Tailwind utilities
className="p-4 m-2 gap-4"

// ❌ Avoid inline styles unless dynamic
style={{ padding: '16px' }}
```

### Z-Index Layers

- `z-10` - Background elements
- `z-20` - HUD and overlays
- `z-30` - Modals
- `z-40` - Tooltips
- `z-50` - Critical alerts (tutorial, error)

### Animation Performance

```jsx
// ✅ Use Framer Motion for complex animations
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>

// ✅ Use Tailwind for simple transitions
className="transition-all duration-200 hover:scale-105"
```

## Integration with Game Systems

### With Scenes

```jsx
// Gig.jsx imports PixiStage and GigHUD
import { PixiStage } from '../components/PixiStage';
import { GigHUD } from '../components/GigHUD';

<PixiStage logic={rhythmLogic} />
<GigHUD stats={rhythmLogic.stats} />
```

### With Hooks

```jsx
// useRhythmGameLogic provides data to components
const logic = useRhythmGameLogic()
// logic.stats, logic.actions, logic.gameStateRef
```

### With Data

```jsx
// ChatterOverlay uses chatter.js
import { CHATTER_DB } from '../data/chatter'
const message =
  CHATTER_DB.positive[Math.floor(Math.random() * CHATTER_DB.positive.length)]
```

## Testing Checklist

When modifying components:

- [ ] Pixi.js cleanup verified (no memory leaks)
- [ ] Props are documented with JSDoc or PropTypes
- [ ] Component renders on different screen sizes
- [ ] Animations are smooth (60 FPS)
- [ ] No console warnings during normal use
- [ ] Accessibility: Keyboard navigation works (if applicable)

## Common antipatterns

### ❌ Coupling to Specific Scenes

```jsx
// WRONG - hardcoded scene reference
if (currentScene === 'GIG') {
  /* ... */
}
```

### ❌ Direct State Mutations

```jsx
// WRONG - props should not be mutated
props.stats.score += 100
```

### ❌ Missing Cleanup

```jsx
// WRONG - interval/listener not cleared
useEffect(() => {
  setInterval(() => {
    /* ... */
  }, 1000)
}, []) // No return cleanup
```

---

**Remember**: Components are the "stage hands" of the game. They handle presentation and user interaction, but delegate business logic to utils and hooks. Keep them focused, reusable, and performant.

## Maintenance

- Last updated: 2026-02-17.
