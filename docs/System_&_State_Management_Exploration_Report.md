## NEUROTOXIC Scene System & State Management Exploration Report

> [!NOTE]
> This is a **point-in-time exploration archive**. Scene flows and state machine transitions (e.g., direct Travel->PreGig flow) have evolved since this discovery phase. Refer to [STATE_TRANSITIONS.md](file:///c:/Users/andre.oswald/Code/Neuro/neurotoxic-game/docs/STATE_TRANSITIONS.md) for the authoritative state machine.

---

### **1. App.jsx Scene Switch (Main Router)**

**File:** `/home/user/neurotoxic-game/src/App.jsx`
The `GameContent` component uses a switch statement to route scenes based on `currentScene` state:

```jsx
const renderScene = () => {
  switch (currentScene) {
    case 'INTRO':
      return <IntroVideo />
    case 'MENU':
      return <MainMenu />
    case 'SETTINGS':
      return <Settings />
    case 'CREDITS':
      return <Credits />
    case 'GAMEOVER':
      return <GameOver />
    case 'OVERWORLD':
      return <Overworld />
    case 'PREGIG':
      return <PreGig />
    case 'GIG':
      return <Gig />
    case 'POSTGIG':
      return <PostGig />
    default:
      return <MainMenu />
  }
}
```

## All scenes are lazy-loaded via `createNamedLazyLoader()` for code splitting. Scenes without HUD (INTRO, MENU, SETTINGS, CREDITS, GAMEOVER) hide the HUD component. Scene transitions use Framer Motion fade animations with `AnimatePresence mode='wait'` for smooth transitions.

### **2. ActionTypes Enum (All Possible Actions)**

**File:** `/home/user/neurotoxic-game/src/context/gameReducer.js`

```javascript
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  UPDATE_BAND: 'UPDATE_BAND',
  UPDATE_SOCIAL: 'UPDATE_SOCIAL',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_MAP: 'SET_MAP',
  SET_GIG: 'SET_GIG',
  START_GIG: 'START_GIG',
  SET_SETLIST: 'SET_SETLIST',
  SET_LAST_GIG_STATS: 'SET_LAST_GIG_STATS',
  SET_ACTIVE_EVENT: 'SET_ACTIVE_EVENT',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_GIG_MODIFIERS: 'SET_GIG_MODIFIERS',
  LOAD_GAME: 'LOAD_GAME',
  RESET_STATE: 'RESET_STATE',
  APPLY_EVENT_DELTA: 'APPLY_EVENT_DELTA',
  POP_PENDING_EVENT: 'POP_PENDING_EVENT',
  CONSUME_ITEM: 'CONSUME_ITEM',
  ADVANCE_DAY: 'ADVANCE_DAY',
  ADD_COOLDOWN: 'ADD_COOLDOWN'
}
```

Key scene-related actions:

- **CHANGE_SCENE**: Transitions between scenes
- **START_GIG**: Automatically sets scene to PREGIG and resets `gigModifiers`
- **RESET_STATE**: Returns game to initial state (debug)

---

### **3. Action Creators (Factory Functions)**

**File:** `/home/user/neurotoxic-game/src/context/actionCreators.js`

```javascript
export const createChangeSceneAction = scene => ({
  type: ActionTypes.CHANGE_SCENE,
  payload: scene
})
export const createStartGigAction = venue => ({
  type: ActionTypes.START_GIG,
  payload: venue
})
export const createUpdatePlayerAction = updates => ({
  type: ActionTypes.UPDATE_PLAYER,
  payload: updates
})
export const createUpdateBandAction = updates => ({
  type: ActionTypes.UPDATE_BAND,
  payload: updates
})
export const createSetLastGigStatsAction = stats => ({
  type: ActionTypes.SET_LAST_GIG_STATS,
  payload: stats
})
export const createAddToastAction = (message, type = 'info') => ({
  type: ActionTypes.ADD_TOAST,
  payload: { id: `${Date.now()}-${++toastIdCounter}`, message, type }
})
// ... and many more factory functions for type-safe dispatch
```

## All action creators are pure functions that return action objects. This ensures type safety and prevents typos in action types.

### **4. Initial State Configuration**

**File:** `/home/user/neurotoxic-game/src/context/initialState.js`

```javascript
export const initialState = {
  currentScene: 'INTRO', // ← Starting scene
  player: { ...DEFAULT_PLAYER_STATE },
  band: { ...DEFAULT_BAND_STATE },
  social: { ...DEFAULT_SOCIAL_STATE },
  gameMap: null,
  currentGig: null,
  setlist: [],
  lastGigStats: null,
  activeEvent: null,
  toasts: [],
  activeStoryFlags: [],
  eventCooldowns: [],
  pendingEvents: [],
  reputationByRegion: {},
  settings: { ...DEFAULT_SETTINGS },
  npcs: {},
  gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
}
```

**Default Player State:**

- money: 500
- day: 1
- location: 'Stendal' (starting city)
- currentNodeId: 'node_0_0'
- van: { fuel: 100, condition: 100, upgrades: [], breakdownChance: 0.05 }
- tutorialStep: 0, score: 0, fame: 0
  **Default Band State:**
- 3 members (Matze, Marius, Lars)
- harmony: 80
- inventory: shirts, hoodies, patches, CDs, vinyl, strings, cables, drum_parts, golden_pick
- performance: guitarDifficulty (1.0), drumMultiplier (1.0), crowdDecay (1.0)
  **Default Gig Modifiers:**

```javascript
{
  promo: false,
  soundcheck: false,
  merch: false,
  catering: false,
  guestlist: false
}
```

---

### **5. State Machine Flow: INTRO → MENU → OVERWORLD → GIG SEQUENCE**

Based on reducer logic and scene files:

```
INTRO (initial)
  ↓ (click/auto-play)
MENU
  ├→ SETTINGS (from menu)
  ├→ CREDITS (from menu)
  └→ OVERWORLD (new game or loaded game)
OVERWORLD (main map navigation)
  ├→ PREGIG (when venue selected)
  ├→ POSTGIG (after gig completes)
  ├→ HQ (base upgrades - not fully shown)
  └→ GAMEOVER (if bankruptcy)
PREGIG (gig preparation)
  ├→ Setlist selection (1-3 songs)
  ├→ Budget allocation (modifiers)
  └→ START SHOW → GIG
GIG (rhythm game)
  └→ Performance → POSTGIG
POSTGIG (results phase)
  ├→ REPORT phase (income/expenses)
  ├→ SOCIAL phase (social media posting)
  ├→ COMPLETE phase (results)
  └→ Back to Tour → OVERWORLD
GAMEOVER
  └→ MENU (restart)
```

---

### **6. PreGig.jsx - Full Structure & Scene Transitions**

**File:** `/home/user/neurotoxic-game/src/scenes/PreGig.jsx`
**Key State:**

```javascript
const {
  currentGig,
  changeScene,
  setSetlist,
  setlist,
  gigModifiers,
  setGigModifiers,
  player,
  updatePlayer,
  triggerEvent,
  activeEvent,
  band,
  updateBand,
  addToast
} = useGameState()
const [isStarting, setIsStarting] = useState(false)
```

**Safety Check:** If no gig is set, returns to OVERWORLD:

```javascript
useEffect(() => {
  if (!currentGig) {
    addToast('No gig active! Returning to map.', 'error')
    changeScene('OVERWORLD')
  }
}, [currentGig, changeScene, addToast])
```

**Event System Integration:**

```javascript
useEffect(() => {
  // Trigger Pre-Gig events (Band or Gig category)
  if (!activeEvent) {
    const bandEvent = triggerEvent('band', 'pre_gig')
    if (!bandEvent) {
      triggerEvent('gig', 'pre_gig')
    }
  }
}, [])
```

**Core Interactions:**

1. **Setlist Toggle** - Select 1-3 songs, displays energy curve
2. **Budget Allocation** - Toggle modifiers (soundcheck, promo, merch, catering, guestlist)
3. **Band Meeting** - Spend 50€ to boost harmony by 15
4. **Active Modifiers Display** - Shows current effects
   **CRITICAL SCENE TRANSITION - START SHOW Button:**

```javascript
<motion.button
  disabled={setlist.length === 0 || isStarting}
  onClick={async () => {
    if (band.harmony < 10) {
      addToast('Band harmony too low to perform!', 'error')
      return
    }
    setIsStarting(true)
    try {
      await audioManager.ensureAudioContext()
      changeScene('GIG') // ← Transition to rhythm game
    } catch (err) {
      setIsStarting(false)
      handleError(err, {
        addToast,
        fallbackMessage: 'Audio initialization failed.'
      })
    }
  }}
>
  {isStarting ? 'INITIALIZING...' : 'START SHOW'}
</motion.button>
```

**Validation:**

- ✓ Setlist must have 1-3 songs
- ✓ Band harmony must be ≥ 10
- ✓ Audio context must initialize before GIG

---

### **7. PostGig.jsx - Full Structure & Scene Transitions**

**File:** `/home/user/neurotoxic-game/src/scenes/PostGig.jsx`
**Key State:**

```javascript
const {
  currentGig,
  player,
  updatePlayer,
  gigModifiers,
  triggerEvent,
  activeEvent,
  band,
  updateSocial,
  social,
  lastGigStats,
  addToast,
  changeScene
} = useGameState()
const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, COMPLETE
const [financials, setFinancials] = useState(null)
const [postOptions, setPostOptions] = useState([])
const [postResult, setPostResult] = useState(null)
```

**Event Triggers (Post-Gig):**

```javascript
useEffect(() => {
  if (!currentGig) return

  if (!activeEvent) {
    const financialEvent = triggerEvent('financial', 'post_gig')
    if (!financialEvent) {
      const specialEvent = triggerEvent('special', 'post_gig')
      if (!specialEvent) {
        triggerEvent('band', 'post_gig')
      }
    }
  }
}, [currentGig, activeEvent, triggerEvent])
```

**Three-Phase Flow:**

#### **Phase 1: REPORT (Income/Expenses)**

```javascript
{
  phase === 'REPORT' && (
    <ReportPhase financials={financials} onNext={() => setPhase('SOCIAL')} />
  )
}
```

- Displays income breakdown (ticket sales, merch, VIP)
- Displays expenses (modifiers, etc.)
- Shows net profit/loss
- Button to continue

#### **Phase 2: SOCIAL (Platform Selection)**

```javascript
{
  phase === 'SOCIAL' && (
    <SocialPhase options={postOptions} onSelect={handlePostSelection} />
  )
}
```

```javascript
const handlePostSelection = option => {
  const result = resolvePost(option, Math.random())
  const isGigViral = lastGigStats && checkViralEvent(lastGigStats)
  const organicGrowth = calculateSocialGrowth(
    result.platform,
    perfScore,
    social[result.platform] || 0,
    isGigViral
  )
  const totalFollowers = result.followers + organicGrowth
  const finalResult = { ...result, totalFollowers }
  setPostResult(finalResult)

  updateSocial({
    [result.platform]: (social[result.platform] || 0) + totalFollowers,
    viral: social.viral + (result.success ? 1 : 0) + gigViralBonus,
    lastGigDay: player.day
  })

  setPhase('COMPLETE')
}
```

#### **Phase 3: COMPLETE (Results & Return)**

```javascript
{
  phase === 'COMPLETE' && (
    <CompletePhase result={postResult} onContinue={handleContinue} />
  )
}
```

**CRITICAL SCENE TRANSITION - Back to Tour Button:**

```javascript
const handleContinue = () => {
  if (!financials) return

  const fameGain = 50 + Math.floor(perfScore * 1.5)
  const newMoney = Math.max(0, player.money + financials.net)

  updatePlayer({
    money: newMoney,
    fame: player.fame + fameGain
  })

  if (shouldTriggerBankruptcy(newMoney, financials.net)) {
    addToast('GAME OVER: BANKRUPT! The tour is over.', 'error')
    changeScene('GAMEOVER') // ← Bankruptcy → GAMEOVER
  } else {
    changeScene('OVERWORLD') // ← Success → Back to map
  }
}
```

---

### **8. State Reducer - Key Handlers**

**File:** `/home/user/neurotoxic-game/src/context/gameReducer.js`
**CHANGE_SCENE Handler:**

```javascript
const handleChangeScene = (state, payload) => {
  logger.info('GameState', `Scene Change: ${state.currentScene} -> ${payload}`)
  return { ...state, currentScene: payload }
}
```

**START_GIG Handler (Auto-transitions to PREGIG):**

```javascript
case ActionTypes.START_GIG:
  logger.info('GameState', 'Starting Gig Sequence', action.payload?.name)
  return {
    ...state,
    currentGig: action.payload,
    currentScene: 'PREGIG',  // ← Automatic scene change
    gigModifiers: { ...DEFAULT_GIG_MODIFIERS }  // ← Reset modifiers
  }
```

**Key Safety Features:**

- Money clamped to ≥0: `mergedPlayer.money = clampPlayerMoney(mergedPlayer.money)`
- Harmony clamped to 1-100: `mergedBand.harmony = clampBandHarmony(mergedBand.harmony)`
- Game state loaded from localStorage is whitelisted:
  ```javascript
  const ALLOWED_SCENES = [
    'OVERWORLD',
    'PREGIG',
    'GIG',
    'POSTGIG',
    'HQ',
    'BAND_HQ'
  ]
  ```

---

### **9. State Management Hook - useGameState()**

**File:** `/home/user/neurotoxic-game/src/context/GameState.jsx` (lines 518-534)

```javascript
export const useGameState = () => {
  const state = useContext(GameStateContext)
  const dispatch = useContext(GameDispatchContext)

  const hasUpgrade = useCallback(
    upgradeId => checkUpgrade(state.player.van.upgrades, upgradeId),
    [state.player.van.upgrades]
  )

  return { ...state, ...dispatch, hasUpgrade }
}
```

Returns merged object with:

- **State:** currentScene, player, band, social, gameMap, currentGig, setlist, lastGigStats, activeEvent, toasts, gigModifiers, settings
- **Dispatch Actions:** changeScene, updatePlayer, updateBand, updateSocial, triggerEvent, resolveEvent, startGig, setSetlist, saveGame, loadGame, resetState, addToast, setGigModifiers, etc.

---

### **10. Complete State Machine Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEUROTOXIC STATE MACHINE                     │
└─────────────────────────────────────────────────────────────────┘
               START
                 │
                 ▼
            ┌────────┐
            │ INTRO  │ (initialState.currentScene)
            │ Video  │
            └────┬───┘
                 │ click/auto-play
                 ▼
            ┌────────────┐
      ┌────→│   MENU     │◄───────┐
      │     └────┬───────┘        │
      │          │                │
      │     ┌────▼─────────┐      │
      │     │   SETTINGS   │      │
      │     └──────────────┘      │
      │                           │
      │     ┌──────────────┐      │
      │     │   CREDITS    │      │
      │     └──────────────┘      │
      │                           │
      │     ┌──────────────┐      │
      │     │  GAMEOVER    │──────┘
      │     │ (bankruptcy  │
      │     │  or failure) │
      │     └──────────────┘
      │
      │ new game / load
      │
      ▼
    ┌──────────────────────────────────────────────────┐
    │           MAIN GAMEPLAY LOOP                     │
    │                                                  │
    │  ┌────────────────────────────────────────────┐ │
    │  │          OVERWORLD (map)                   │ │
    │  │  - Travel between venues                   │ │
    │  │  - Rest at HQ                              │ │
    │  │  - Events (travel, camp)                   │ │
    │  └─────────┬──────────────────────────────────┘ │
    │            │                                     │
    │            │ select venue                        │
    │            ▼                                     │
    │  ┌────────────────────────────────────────────┐ │
    │  │           PREGIG                           │ │
    │  │  - Select 1-3 songs (setlist)              │ │
    │  │  - Allocate budget (5 modifiers)           │ │
    │  │  - Band meeting (harmony boost)            │ │
    │  │  - Pre-gig events                          │ │
    │  │  - Validate: harmony ≥ 10                  │ │
    │  │  - START SHOW button                       │ │
    │  └─────────┬──────────────────────────────────┘ │
    │            │                                     │
    │            │ changeScene('GIG')                  │
    │            │ (with audio init)                   │
    │            ▼                                     │
    │  ┌────────────────────────────────────────────┐ │
    │  │        GIG (rhythm game)                   │ │
    │  │  - 3-lane note falling                     │ │
    │  │  - Performance score                       │ │
    │  │  - Peak hype calculation                   │ │
    │  │  - Crowd engagement                        │ │
    │  └─────────┬──────────────────────────────────┘ │
    │            │                                     │
    │            │ gig completes                       │
    │            │ setLastGigStats()                   │
    │            ▼                                     │
    │  ┌────────────────────────────────────────────┐ │
    │  │         POSTGIG (3 phases)                 │ │
    │  │                                            │ │
    │  │  Phase 1: REPORT                          │ │
    │  │  - Income breakdown                        │ │
    │  │  - Expenses breakdown                      │ │
    │  │  - Net profit/loss                         │ │
    │  │  - Post-gig events (band/special)          │ │
    │  │  - Continue → SOCIAL phase                 │ │
    │  │                                            │ │
    │  │  Phase 2: SOCIAL                          │ │
    │  │  - Select platform (Instagram/TikTok/YT)  │ │
    │  │  - Viral chance calculation                │ │
    │  │  - Social metrics update                   │ │
    │  │  - Continue → COMPLETE phase               │ │
    │  │                                            │ │
    │  │  Phase 3: COMPLETE                        │ │
    │  │  - Show result (VIRAL HIT / FLOPOCALYPSE) │ │
    │  │  - Show follower gains                     │ │
    │  │  - Back to Tour button                     │ │
    │  └─────────┬──────────────────────────────────┘ │
    │            │                                     │
    │            │ handleContinue()                    │
    │            │ - Update money/fame                 │
    │            │ - Check bankruptcy                  │
    │            └─────────┬──────────────────────────┤
    │                      │                           │
    │                      ├─► GAMEOVER (bankrupt)    │
    │                      │                           │
    │                      └─► OVERWORLD (loop)       │
    │                                                  │
    └──────────────────────────────────────────────────┘
```

---

### **Summary Table: Scene Transitions**

| From Scene | To Scene  | Trigger         | Action Used                | Validation                   |
| ---------- | --------- | --------------- | -------------------------- | ---------------------------- |
| INTRO      | MENU      | Click/auto      | (implicit)                 | -                            |
| MENU       | OVERWORLD | New Game / Load | `changeScene('OVERWORLD')` | -                            |
| MENU       | SETTINGS  | Settings Click  | `changeScene('SETTINGS')`  | -                            |
| OVERWORLD  | PREGIG    | Select Venue    | `startGig(venue)` (auto)   | `currentGig` set             |
| PREGIG     | GIG       | "START SHOW"    | `changeScene('GIG')`       | harmony ≥ 10, setlist filled |
| GIG        | POSTGIG   | Gig Ends        | (implicit)                 | `setLastGigStats()`          |
| POSTGIG    | OVERWORLD | "Back to Tour"  | `changeScene('OVERWORLD')` | money computed               |
| POSTGIG    | GAMEOVER  | Bankruptcy      | `changeScene('GAMEOVER')`  | `shouldTriggerBankruptcy()`  |
| GAMEOVER   | MENU      | Restart         | `changeScene('MENU')`      | -                            |
| Any        | GAMEOVER  | Game Over Event | `changeScene('GAMEOVER')`  | Event delta                  |

---

This is the complete scene system and state management architecture for NEUROTOXIC v3.0!
