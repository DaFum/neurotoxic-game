## NEUROTOXIC Game Codebase Exploration Report

> [!NOTE]
> This is a **point-in-time exploration archive**. Some code excerpts or logic descriptions (e.g., economy fuel vs food) may have been refactored since this report was generated. For current system truths, always consult [AGENTS.md](file:///c:/Users/andre.oswald/Code/Neuro/neurotoxic-game/AGENTS.md) or [ARCHITECTURE.md](file:///c:/Users/andre.oswald/Code/Neuro/neurotoxic-game/docs/ARCHITECTURE.md).

## I've completed a thorough exploration of the NEUROTOXIC game codebase, focusing on the stage system, rhythm game hooks, and economy engine. Here's the full analysis:

### 1. **LaneManager.js** — Complete Code Excerpt

**Location:** `/home/user/neurotoxic-game/src/components/stage/LaneManager.js`

```javascript
import * as PIXI from 'pixi.js'
import { buildRhythmLayout, getPixiColorFromToken } from './utils.js'
const LANE_GAP = 20
const LANE_BASE_FILL = getPixiColorFromToken('--void-black')
const LANE_BASE_ALPHA = 0.7
const LANE_BORDER_COLOR = getPixiColorFromToken('--toxic-green')
const LANE_BORDER_ALPHA = 0.35
const HIT_BAR_INACTIVE_ALPHA = 0.45
const HIT_BAR_ACTIVE_ALPHA = 0.95
const HIT_BAR_BORDER_COLOR = getPixiColorFromToken('--star-white')
const LANE_GUIDE_ALPHA = 0.16
export class LaneManager {
  /**
   * @param {PIXI.Application} app
   * @param {PIXI.Container} stageContainer
   * @param {object} gameStateRef
   */
  constructor(app, stageContainer, gameStateRef) {
    this.app = app
    this.stageContainer = stageContainer
    this.gameStateRef = gameStateRef
    this.rhythmContainer = null
    this.laneLayout = null
    this.laneGraphics = [] // { static: Graphics, active: Graphics, inactive: Graphics }
    this.lastLaneActive = []
    this.lastScreenWidth = -1
    this.lastScreenHeight = -1
  }
  init() {
    this.rhythmContainer = new PIXI.Container()
    const width = this.app.screen.width
    const height = this.app.screen.height
    this.laneLayout = buildRhythmLayout({
      screenWidth: width,
      screenHeight: height
    })
    this.lastScreenWidth = width
    this.lastScreenHeight = height
    this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    this.stageContainer.addChild(this.rhythmContainer)
    const startX = this.laneLayout.startX
    const laneWidth = this.laneLayout.laneWidth
    const laneHeight = this.laneLayout.laneHeight
    const laneStrokeWidth = this.laneLayout.laneStrokeWidth
    // Initial hit line geometry
    const hitLineY = this.laneLayout.hitLineY
    const hitLineHeight = this.laneLayout.hitLineHeight
    const hitLineStrokeWidth = this.laneLayout.hitLineStrokeWidth
    this.gameStateRef.current.lanes.forEach((lane, index) => {
      const laneX = startX + index * (laneWidth + LANE_GAP)
      // Side-effect: Mutating gameState lanes with render position for NoteManager
      lane.renderX = laneX
      // Create separate graphics for static background and dynamic elements
      const staticGraphics = new PIXI.Graphics()
      staticGraphics.__laneIndex = index
      staticGraphics.__layer = 'static'
      const activeGraphics = new PIXI.Graphics()
      activeGraphics.__laneIndex = index
      activeGraphics.__layer = 'active'
      activeGraphics.visible = false
      const inactiveGraphics = new PIXI.Graphics()
      inactiveGraphics.__laneIndex = index
      inactiveGraphics.__layer = 'inactive'
      inactiveGraphics.visible = true
      // Draw static background once
      staticGraphics.rect(laneX, 0, laneWidth, laneHeight)
      staticGraphics.fill({ color: LANE_BASE_FILL, alpha: LANE_BASE_ALPHA })
      staticGraphics.rect(
        laneX + laneWidth * 0.35,
        0,
        laneWidth * 0.3,
        laneHeight
      )
      staticGraphics.fill({ color: lane.color, alpha: LANE_GUIDE_ALPHA })
      staticGraphics.stroke({
        width: laneStrokeWidth,
        color: LANE_BORDER_COLOR,
        alpha: LANE_BORDER_ALPHA
      })
      // Draw active/inactive states initially
      activeGraphics.rect(laneX, hitLineY, laneWidth, hitLineHeight)
      activeGraphics.fill({ color: lane.color, alpha: HIT_BAR_ACTIVE_ALPHA })
      activeGraphics.stroke({
        width: hitLineStrokeWidth,
        color: HIT_BAR_BORDER_COLOR
      })
      inactiveGraphics.rect(laneX, hitLineY, laneWidth, hitLineHeight)
      inactiveGraphics.fill({
        color: lane.color,
        alpha: HIT_BAR_INACTIVE_ALPHA
      })
      inactiveGraphics.stroke({
        width: hitLineStrokeWidth,
        color: lane.color
      })
      this.rhythmContainer.addChild(staticGraphics)
      this.rhythmContainer.addChild(inactiveGraphics)
      this.rhythmContainer.addChild(activeGraphics)
      this.laneGraphics[index] = {
        static: staticGraphics,
        active: activeGraphics,
        inactive: inactiveGraphics
      }
    })
  }
  update(state) {
    const layoutUpdated = this.updateLaneLayout()
    const layout = this.laneLayout
    state.lanes.forEach((lane, index) => {
      const graphicsSet = this.laneGraphics[index]
      if (!graphicsSet) {
        return
      }
      const {
        static: staticGraphics,
        active: activeGraphics,
        inactive: inactiveGraphics
      } = graphicsSet
      // Redraw graphics only if layout updated
      if (layoutUpdated) {
        staticGraphics.clear()
        staticGraphics.rect(
          lane.renderX,
          0,
          layout.laneWidth,
          layout.laneHeight
        )
        staticGraphics.fill({ color: LANE_BASE_FILL, alpha: LANE_BASE_ALPHA })
        staticGraphics.rect(
          lane.renderX + layout.laneWidth * 0.35,
          0,
          layout.laneWidth * 0.3,
          layout.laneHeight
        )
        staticGraphics.fill({ color: lane.color, alpha: LANE_GUIDE_ALPHA })
        staticGraphics.stroke({
          width: layout.laneStrokeWidth,
          color: LANE_BORDER_COLOR,
          alpha: LANE_BORDER_ALPHA
        })
        activeGraphics.clear()
        activeGraphics.rect(
          lane.renderX,
          layout.hitLineY,
          layout.laneWidth,
          layout.hitLineHeight
        )
        activeGraphics.fill({ color: lane.color, alpha: HIT_BAR_ACTIVE_ALPHA })
        activeGraphics.stroke({
          width: layout.hitLineStrokeWidth,
          color: HIT_BAR_BORDER_COLOR
        })
        inactiveGraphics.clear()
        inactiveGraphics.rect(
          lane.renderX,
          layout.hitLineY,
          layout.laneWidth,
          layout.hitLineHeight
        )
        inactiveGraphics.fill({
          color: lane.color,
          alpha: HIT_BAR_INACTIVE_ALPHA
        })
        inactiveGraphics.stroke({
          width: layout.hitLineStrokeWidth,
          color: lane.color
        })
      }
      const wasActive = this.lastLaneActive[index]
      // Update visibility if layout changed OR activity changed
      if (layoutUpdated || wasActive !== lane.active) {
        this.lastLaneActive[index] = lane.active
        activeGraphics.visible = !!lane.active
        inactiveGraphics.visible = !lane.active
      }
    })
  }
  updateLaneLayout() {
    const width = this.app.screen.width
    const height = this.app.screen.height
    if (width === this.lastScreenWidth && height === this.lastScreenHeight) {
      return false
    }
    this.lastScreenWidth = width
    this.lastScreenHeight = height
    this.laneLayout = buildRhythmLayout({
      screenWidth: width,
      screenHeight: height
    })
    if (this.rhythmContainer) {
      this.rhythmContainer.y = this.laneLayout.rhythmOffsetY
    }
    const startX = this.laneLayout.startX
    this.gameStateRef.current.lanes.forEach((lane, index) => {
      lane.renderX = startX + index * (this.laneLayout.laneWidth + LANE_GAP)
    })
    return true
  }
  dispose() {
    this.laneGraphics = []
    if (this.rhythmContainer) {
      this.rhythmContainer.destroy({ children: true })
      this.rhythmContainer = null
    }
  }
  get container() {
    return this.rhythmContainer
  }
  get layout() {
    return this.laneLayout
  }
}
```

**LaneManager API Summary:**

- **Constructor:** `(app, stageContainer, gameStateRef)` — Receives Pixi app, stage container, and mutable game state ref
- **Methods:**
  - `init()` — Initializes rhythm container and draws 3 lanes with static/active/inactive graphics for each
  - `update(state)` — Updates lane visibility and redraws on screen resize
  - `updateLaneLayout()` — Detects layout changes and recalculates positions
  - `dispose()` — Cleans up all Pixi objects
- **Getters:**
  - `container` — Returns the rhythm container
  - `layout` — Returns current lane layout metrics

---

### 2. **PixiStage.jsx Props Interface** — Complete Code

**Location:** `/home/user/neurotoxic-game/src/components/PixiStage.jsx`

```javascript
import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { createPixiStageController } from './PixiStageController'
import { logger } from '../utils/logger'
/**
 * Renders the Pixi.js stage for the rhythm game.
 * @param {{ logic: { gameStateRef: object, stats: object, update: Function } }} props - Component props.
 * @returns {JSX.Element} Pixi canvas wrapper.
 */
export const PixiStage = ({ logic }) => {
  const containerRef = useRef(null)
  const { gameStateRef, update } = logic
  const updateRef = useRef(update)
  const statsRef = useRef(logic.stats)
  const controllerRef = useRef(null)
  useEffect(() => {
    updateRef.current = update
  }, [update])
  useEffect(() => {
    statsRef.current = logic.stats
  }, [logic.stats])
  useEffect(() => {
    controllerRef.current = createPixiStageController({
      containerRef,
      gameStateRef,
      updateRef,
      statsRef
    })
    controllerRef.current.init().catch(err => {
      logger.error('PixiStage', 'Pixi Stage Init Failed', err)
    })
    return () => {
      if (controllerRef.current) {
        controllerRef.current.dispose()
        controllerRef.current = null
      }
    }
    // gameStateRef is a stable useRef – dependency is constant
  }, [gameStateRef])
  return (
    <div
      className='absolute inset-0 z-20 pointer-events-none'
      ref={containerRef}
    />
  )
}
PixiStage.propTypes = {
  logic: PropTypes.shape({
    gameStateRef: PropTypes.object.isRequired,
    update: PropTypes.func.isRequired,
    stats: PropTypes.shape({
      score: PropTypes.number,
      combo: PropTypes.number,
      health: PropTypes.number,
      overload: PropTypes.number,
      isToxicMode: PropTypes.bool,
      isGameOver: PropTypes.bool,
      isAudioReady: PropTypes.bool
    }).isRequired
  }).isRequired
}
```

**PixiStage Props Interface:**

```typescript
props: {
  logic: {
    gameStateRef: React.MutableRefObject<{
      notes: object[],
      lanes: Lane[],
      speed: number,
      modifiers: object,
      stats: { perfectHits, misses, maxCombo, peakHype },
      combo: number,
      health: number,
      score: number,
      progress: number,
      isToxicMode: boolean,
      isGameOver: boolean,
      overload: number,
      totalDuration: number,
      setlistCompleted: boolean,
      notesVersion: number,
      ...
    }>,
    update: (deltaMS: number) => void,
    stats: {
      score: number,
      combo: number,
      health: number,
      overload: number,
      isToxicMode: boolean,
      isGameOver: boolean,
      isAudioReady: boolean,
      accuracy: number
    }
  }
}
```

---

### 3. **PixiStageController.js** — Lifecycle and API Overview

**Location:** `/home/user/neurotoxic-game/src/components/PixiStageController.js`
**Key Architecture:**

- **Constructor:** Takes containerRef, gameStateRef, updateRef, statsRef
- **Initialization Flow:**
  1. Create Pixi Application with `backgroundAlpha: 0`, responsive sizing, device pixel ratio
  2. Create stage container and color matrix filter
  3. Initialize 4 managers in parallel:
     - CrowdManager (loads crowd idle/mosh textures)
     - LaneManager (builds 3-lane rhythm display)
     - EffectManager (loads blood/toxic hit effects)
     - NoteManager (loads skull/lightning note sprites)
  4. All asset loads wrapped in `withTimeout(promise, 10000ms)` for graceful fallback
  5. Start Pixi ticker with `handleTicker` callback
     **Key Methods:**
- `async init()` — Initializes app and all managers; returns promise
- `handleTicker(ticker)` — Frame update: calls updateRef, applies toxic hue filter, updates all managers
- `manualUpdate(deltaMS)` — Testing helper to run frame without ticker
- `dispose()` — Full cleanup: stops ticker, disposes all managers, destroys color matrix, clears DOM
  **Color Matrix Filter for Toxic Mode:**

```javascript
if (stats?.isToxicMode) {
  this.colorMatrix.hue(Math.sin(elapsed / 100) * 180, false)
  this.stageContainer.filters = this.toxicFilters
}
```

---

### 4. **src/hooks/rhythmGame/** — Sub-Hook Structure

**Location:** `/home/user/neurotoxic-game/src/hooks/rhythmGame/`
**Hook Dependency Graph:**

```
useRhythmGameLogic (main orchestrator)
├── useRhythmGameState (React state + Ref)
├── useRhythmGameScoring (hits/misses/toxic mode)
├── useRhythmGameAudio (audio init + playback)
├── useRhythmGameLoop (frame update)
└── useRhythmGameInput (keyboard mapping)
```

**Hook Contracts:**
**useRhythmGameState** returns:

```javascript
{
  gameStateRef: MutableRefObject<{
    notes: [],
    nextMissCheckIndex: 0,
    lanes: [
      { id: 'guitar', key: 'ArrowLeft', color: 0xff0041, hitWindow: 150, active: false },
      { id: 'drums', key: 'ArrowDown', color: 0x00ff41, hitWindow: 150, active: false },
      { id: 'bass', key: 'ArrowRight', color: 0x0041ff, hitWindow: 150, active: false }
    ],
    speed: 500,
    modifiers: {},
    stats: { perfectHits, misses, maxCombo, peakHype },
    combo: 0,
    health: 100,
    score: 0,
    isToxicMode: false,
    overload: 0,
    notesVersion: 0,
    setlistCompleted: false
  }>,
  state: { score, combo, health, overload, isToxicMode, isGameOver, isAudioReady, accuracy },
  setters: { setScore, setCombo, setHealth, setOverload, setIsToxicMode, setIsGameOver, setIsAudioReady, setAccuracy }
}
```

**useRhythmGameScoring** contract:

- Reads `state.modifiers.drumMultiplier` (set by audio hook) for band-trait bonuses
- Calls `setAccuracy(calculateAccuracy(...))` after every hit/miss
- Exports `activateToxicMode()` action
- Handles miss penalties and combo tracking
  **useRhythmGameAudio** contract:
- **Critical:** Merges `calculateGigPhysics()` result into `gameStateRef.current.modifiers`:
  ```javascript
  const mergedModifiers = {
    ...activeModifiers,
    drumMultiplier: physics.multipliers.drums,
    guitarScoreMult:
      physics.multipliers.guitar * (activeModifiers.guitarScoreMult ?? 1.0)
  }
  gameStateRef.current.modifiers = mergedModifiers
  ```
- Caps audio duration to `maxNoteTime + NOTE_TAIL_MS` (1000ms) for JSON-based songs
- Returns `{ retryAudioInitialization }` only
  **useRhythmGameLoop** — Frame update orchestrator
  **useRhythmGameInput** — Keyboard event handling

---

### 5. **economyEngine.js** — Complete Exports

**Location:** `/home/user/neurotoxic-game/src/utils/economyEngine.js`
**Exported Constants:**

```javascript
export const MODIFIER_COSTS = {
  catering: 20,
  promo: 30,
  merch: 30,
  soundcheck: 50,
  guestlist: 60
}
export const EXPENSE_CONSTANTS = {
  DAILY: { BASE_COST: 25 },
  TRANSPORT: {
    FUEL_PER_100KM: 12, // Liters
    FUEL_PRICE: 1.75, // Euro per Liter
    MAX_FUEL: 100, // Liters
    REPAIR_COST_PER_UNIT: 3, // Per 1% condition
    INSURANCE_MONTHLY: 80,
    MAINTENANCE_30DAYS: 200
  },
  FOOD: {
    FAST_FOOD: 8, // Per person per day
    RESTAURANT: 15, // Per person per day
    ENERGY_DRINK: 3,
    ALCOHOL: 15
  },
  ACCOMMODATION: {
    HOSTEL: 25, // Per person
    HOTEL: 60 // Per person
  },
  EQUIPMENT: {
    STRINGS: 15,
    STICKS: 12,
    CABLE: 25,
    TUBES: 80
  },
  ADMIN: {
    PROBERAUM: 180, // Monthly
    INSURANCE_EQUIP: 150 // Monthly
  }
}
```

**Exported Functions:**

```javascript
/**
 * Calculates fuel cost for a given distance with van_tuning upgrade support.
 */
export const calculateFuelCost = (dist, playerState = null) => {
  // Returns { fuelLiters, fuelCost }
  // Applies 0.8x multiplier if playerState.van.upgrades includes 'van_tuning'
}
/**
 * Calculates travel expenses including fuel + food.
 */
export const calculateTravelExpenses = (
  node,
  fromNode = null,
  playerState = null
) => {
  // Returns { dist, fuelLiters, totalCost }
}
/**
 * Calculates cost to refuel van from current to MAX_FUEL.
 */
export const calculateRefuelCost = currentFuel => {
  // Returns cost in euros
  // Cost = Math.ceil((MAX_FUEL - currentFuel) * FUEL_PRICE)
}
/**
 * Calculates cost to repair van from current condition to 100%.
 */
export const calculateRepairCost = currentCondition => {
  // Returns cost in euros
  // Cost = Math.ceil((100 - currentCondition) * REPAIR_COST_PER_UNIT)
  // Example: 50% condition → 50 * 3 = 150 euros
}
/**
 * Main gig financials calculator with income/expense breakdown.
 */
export const calculateGigFinancials = ({
  gigData, // { capacity, price, pay, dist, diff, name }
  performanceScore, // 0-100
  crowdStats, // { hype: 0-100 }
  modifiers, // { merch, promo, catering, soundcheck, guestlist }
  bandInventory, // { shirts, hoodies, cds, patches, vinyl }
  playerState, // { fame, van, ... }
  gigStats // { misses, peakHype }
}) => {
  // Returns {
  //   income: { total, breakdown: [{ label, value, detail }] },
  //   expenses: { total, breakdown: [...] },
  //   net: number
  // }
  // Income sources:
  //   - Ticket Sales (fame scales attendance)
  //   - Guarantee (fixed fee)
  //   - Merch Sales (15-35% buy rate, performance-dependent)
  //   - Bar Cut (15% of door)
  //   - Sponsorship bonuses (perfect set, max hype)
  // Expenses:
  //   - Venue Split (20-70% of door based on difficulty)
  //   - Fuel (distance-aware, van_tuning upgrade support)
  //   - Food (band of 3)
  //   - Modifier costs (catering/promo/merch/soundcheck/guestlist)
  //   - Merch restock (COGS)
}
/**
 * Determines bankruptcy when money <= 0 AND losing money.
 */
export const shouldTriggerBankruptcy = (newMoney, netIncome) => {
  // Returns boolean
  // True if: money < 0 OR (money === 0 AND netIncome < 0)
  // False if: money > 0 (survive even at break-even)
}
```

**Van Damage/Repair Mechanics:**

- **Repair cost formula:** `Math.ceil(missingCondition * REPAIR_COST_PER_UNIT)`
- **Example:** Van at 50% condition → 50% missing → 50 \* 3 = 150 euros to full repair
- **Fuel cost:** Clamped between 0–MAX_FUEL (100L), reduced 20% with van_tuning upgrade

---

### 6. **gameStateUtils.js** — Utility Functions

**Location:** `/home/user/neurotoxic-game/src/utils/gameStateUtils.js`

```javascript
/**
 * Clamps player money to safe [0, ∞) integer.
 */
export const clampPlayerMoney = money => {
  if (!Number.isFinite(money)) return 0
  return Math.floor(Math.max(0, money))
}
/**
 * Clamps band harmony to [1, 100] range.
 */
export const clampBandHarmony = harmony => {
  if (!Number.isFinite(harmony)) return 1
  const safeHarmony = Math.floor(harmony)
  return Math.max(1, Math.min(100, safeHarmony))
}
/**
 * Applies delta to a single inventory item (boolean or numeric).
 */
export const applyInventoryItemDelta = (currentValue, deltaValue) => {
  if (deltaValue === true || deltaValue === false) return deltaValue
  if (typeof deltaValue === 'number') {
    const currentCount = typeof currentValue === 'number' ? currentValue : 0
    return Math.max(0, currentCount + deltaValue)
  }
  return currentValue
}
/**
 * Applies event delta to game state (player, band, social, flags).
 */
export const applyEventDelta = (state, delta) => {
  // Merges delta.player (money, time, fame, van.fuel, van.condition, location, day)
  // Merges delta.band (harmony, members mood/stamina, inventory, luck)
  // Merges delta.social (follower counts)
  // Merges delta.flags (activeStoryFlags, pendingEvents)
  // Returns updated state with all clamping applied
}
```

---

### 7. **Stage Managers Overview**

**src/components/stage/** contains 4 parallel managers:
| Manager | Purpose | Key Methods |
|---------|---------|-------------|
| **LaneManager** | Draws 3-lane rhythm grid with active/inactive states | `init()`, `update(state)`, `dispose()`, `get container/layout` |
| **NoteManager** | Spawns/animates note sprites, pools for GC efficiency | `update(state, elapsed, laneLayout)`, `dispose()` |
| **CrowdManager** | Renders 50 crowd members, animates on combo/hype | `update(combo, isToxicMode, elapsed)`, `dispose()` |
| **EffectManager** | Spawns hit/blood effect particles, pools sprites | `spawnHitEffect(x, y, color)`, `update(deltaMS)`, `dispose()` |
**utils.js exports:**

```javascript
export const getPixiColorFromToken(tokenName) // Resolves CSS var to Pixi hex
export const calculateNoteY({ elapsed, noteTime, targetY, speed }) // Note Y position
export const calculateCrowdOffset({ combo, timeMs }) // Crowd bounce amount
export const buildRhythmLayout({ screenWidth, screenHeight }) // Lane metrics
export const RHYTHM_LAYOUT // Constants for layout
export const CROWD_LAYOUT // Constants for crowd rendering
```

---

### 8. **Key Integration Points**

**PixiStageController initialization flow:**

1. PixiStage (React) → creates controller via `createPixiStageController({ containerRef, gameStateRef, updateRef, statsRef })`
2. Controller calls `init()` → initializes all 4 managers in parallel
3. LaneManager calls `buildRhythmLayout()` to calculate screen positions
4. NoteManager stores reference to LaneManager's rhythm container
5. Every frame, `handleTicker()` calls:
   - `updateRef.current(ticker.deltaMS)` — from useRhythmGameLoop
   - `laneManager.update(state)` — lane visibility/resize
   - `noteManager.update(state, elapsed, laneManager.layout)` — note animation
   - `crowdManager.update(combo, isToxicMode, elapsed)` — crowd animation
   - `effectManager.update(deltaMS)` — particle fade-out
     **Audio hook merges modifiers:**

```javascript
gameStateRef.current.modifiers = {
  drumMultiplier: physics.multipliers.drums, // Set by audio hook
  guitarScoreMult: physics.multipliers.guitar // Set by audio hook
}
// Scoring hook reads these for band-trait bonuses
```

---

### 9. **Critical Design Patterns**

1. **Mutable Ref for High-Frequency Loop** — gameStateRef is NOT React state; it's a ref for unfiltered per-frame updates
2. **Triple Graphics Layer in LaneManager** — static (background), inactive (default bar), active (when key is down)
3. **Sprite Pooling** — NoteManager and EffectManager reuse sprites instead of destroying/creating
4. **Timeout-Guarded Loads** — All asset loads in PixiStageController wrapped in 10s timeout for fallback
5. **Deterministic Scene Transition** — setlistCompleted flag (not audioPlaybackEnded) signals gig completion
6. **notesVersion Counter** — Detects song transitions in NoteManager to reset render index without relying on elapsed time

---

This architecture separates concerns cleanly: **PixiStageController** manages Pixi lifecycle, **LaneManager** owns rhythm geometry, **NoteManager** handles note sprites, **useRhythmGameLoop** orchestrates frame timing, and **economyEngine** is completely decoupled for financial calculations.
