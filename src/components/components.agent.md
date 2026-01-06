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
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const isMountedRef = { current: true };
    
    // Create Pixi Application
    const app = new Application({
      width: 1200,
      height: 600,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    canvasRef.current.appendChild(app.view);
    appRef.current = app;
    
    // Set up lanes, notes, etc.
    setupLanes(app, logic);
    
    // Game loop ticker
    app.ticker.add((delta) => {
      if (!isMountedRef.current) return;
      updateNotes(delta, logic);
    });
    
    // CRITICAL: Cleanup
    return () => {
      isMountedRef.current = false;
      app.ticker.stop();
      app.destroy(true, { 
        children: true, 
        texture: true, 
        baseTexture: true 
      });
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
      }
    };
  }, [logic]);
  
  return <div ref={canvasRef} className="pixi-container" />;
};
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
    <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
      <div className="flex justify-between items-start">
        {/* Left: Score & Accuracy */}
        <div className="font-[Courier_New] text-[var(--toxic-green)]">
          <div className="text-2xl font-bold">
            SCORE: {stats.score.toLocaleString()}
          </div>
          <div className="text-lg">
            ACC: {stats.accuracy.toFixed(1)}%
          </div>
        </div>
        
        {/* Right: Combo & Energy */}
        <div className="text-right">
          <div className={`text-3xl font-bold ${
            stats.combo > 30 ? 'text-[var(--blood-red)] animate-pulse' : ''
          }`}>
            {stats.combo}x
          </div>
          <div className="w-32 h-4 bg-[var(--shadow-black)] border border-[var(--toxic-green)]">
            <div 
              className="h-full bg-[var(--toxic-green)] transition-all duration-200"
              style={{ width: `${stats.energy}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Toxic Mode Indicator */}
      {stats.isToxicMode && (
        <div className="mt-4 text-center text-2xl text-[var(--blood-red)] animate-pulse font-[Metal_Mania]">
          ⚠ TOXIC MODE ACTIVE ⚠
        </div>
      )}
    </div>
  );
};
```

**Visual Feedback:**
- Combo > 30 → Red, pulsing
- Accuracy < 70% → Yellow warning color
- Energy < 20% → Red, flashing border
- Toxic Mode → Full-screen border flash

### ChatterOverlay.jsx
**Purpose**: Simulate real-time social media comments during gigs

**Props:**
```javascript
<ChatterOverlay 
  performance={75} // 0-100
  combo={32}
  venue="UT Connewitz"
/>
```

**Behavior:**
- Show 3-5 comments at a time
- Comments scroll in from bottom
- Content changes based on performance
- Uses `src/data/chatter.js` for message templates

**Message Templates:**
```javascript
// Good performance (>80%)
"🔥 THIS IS SICK!!!"
"BEST SHOW EVER @NEUROTOXIC"
"vocals on point 🤘"

// Medium performance (50-80%)
"not bad tbh"
"drummer is carrying"
"sound mix is kinda off"

// Poor performance (<50%)
"yikes... rough night"
"they're falling apart 😬"
"should've stayed home"
```

**Implementation:**
```jsx
export const ChatterOverlay = ({ performance, combo, venue }) => {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newMessage = getRandomChatter(performance, combo);
      setMessages(prev => [...prev.slice(-4), newMessage]);
    }, 3000); // New message every 3 seconds
    
    return () => clearInterval(interval);
  }, [performance, combo]);
  
  return (
    <div className="absolute bottom-4 left-4 max-w-md z-20 pointer-events-none">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-[var(--shadow-black)] bg-opacity-80 border border-[var(--toxic-green)] p-2 mb-2 font-[Courier_New] text-sm"
        >
          {msg}
        </motion.div>
      ))}
    </div>
  );
};
```

**Tuning:**
- Positive messages when combo > 20
- Critical messages when accuracy < 60%
- Venue-specific comments (e.g., "Leipzig crowd goes hard!")

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
  const { player, dispatch } = useGameState();
  const currentStep = player.tutorialStep;
  
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
  ];
  
  const currentTutorial = tutorials.find(t => t.step === currentStep);
  
  const handleNext = () => {
    dispatch({ 
      type: 'UPDATE_PLAYER', 
      payload: { tutorialStep: currentStep + 1 } 
    });
  };
  
  if (!currentTutorial) return null;
  
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="bg-[var(--void-black)] border-4 border-[var(--toxic-green)] p-8 max-w-lg">
        <p className="font-[Courier_New] text-lg mb-4">
          {currentTutorial.message}
        </p>
        <GlitchButton onClick={handleNext}>
          GOT IT
        </GlitchButton>
      </div>
    </motion.div>
  );
};
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
const logic = useRhythmGameLogic();
// logic.stats, logic.actions, logic.gameStateRef
```

### With Data
```jsx
// ChatterOverlay uses chatter.js
import { CHATTER_DB } from '../data/chatter';
const message = CHATTER_DB.positive[Math.floor(Math.random() * CHATTER_DB.positive.length)];
```

## Testing Checklist

When modifying components:
- [ ] Pixi.js cleanup verified (no memory leaks)
- [ ] Props are documented with JSDoc or PropTypes
- [ ] Component renders on different screen sizes
- [ ] Animations are smooth (60 FPS)
- [ ] No console warnings during normal use
- [ ] Accessibility: Keyboard navigation works (if applicable)

## Common Anti-Patterns

### ❌ Coupling to Specific Scenes
```jsx
// WRONG - hardcoded scene reference
if (currentScene === 'GIG') { /* ... */ }
```

### ❌ Direct State Mutations
```jsx
// WRONG - props should not be mutated
props.stats.score += 100;
```

### ❌ Missing Cleanup
```jsx
// WRONG - interval/listener not cleared
useEffect(() => {
  setInterval(() => { /* ... */ }, 1000);
}, []); // No return cleanup
```

---

**Remember**: Components are the "stage hands" of the game. They handle presentation and user interaction, but delegate business logic to utils and hooks. Keep them focused, reusable, and performant.
