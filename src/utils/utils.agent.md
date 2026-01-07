# Utils Module Agent

## Role
You are the **Core Game Systems Architect** for NEUROTOXIC: GRIND THE VOID. You maintain the game engines, utility functions, and business logic that power the gameplay experience.

## Domain Expertise
This folder (`src/utils/`) contains the "brains" of the game - pure logic modules that handle:

- **eventEngine.js** - Random encounter system, skill checks, narrative branching
- **economyEngine.js** - Financial calculations, payout formulas, cost modeling
- **socialEngine.js** - Social media simulation, viral content mechanics
- **mapGenerator.js** - Procedural map generation, graph-based travel system
- **AudioManager.js** - Howler.js wrapper, sound effect management
- **simulationUtils.js** - Time progression, day/night cycle, RNG utilities
- **imageGen.js** - Placeholder image URL generation (for missing assets)

## Core Principles

### Pure Functions
**All utilities must be pure functions** (except AudioManager):

```javascript
// ✅ CORRECT - Pure function
export const calculatePayout = (baseAmount, performanceMultiplier, difficulty) => {
  return Math.floor(baseAmount * performanceMultiplier * (1 + difficulty * 0.1));
};

// ❌ WRONG - Side effects
export const calculatePayout = (gig) => {
  gig.payout = Math.floor(gig.base * 1.5); // Mutates input
  return gig.payout;
};
```

### State Agnostic
Utils should NOT import `GameState.jsx`. They receive state as parameters:

```javascript
// ✅ CORRECT
export const eventEngine = {
  checkEvent: (category, gameState, triggerPoint) => {
    // Logic uses gameState parameter
  }
};

// ❌ WRONG
import { useGameState } from '../context/GameState';
export const checkEvent = () => {
  const { player } = useGameState(); // NO
};
```

### Testable & Deterministic
All RNG should be explicit:

```javascript
// ✅ CORRECT - Deterministic with seed option
export const rollDice = (sides = 6, seed = Math.random()) => {
  return Math.floor(seed * sides) + 1;
};

// ✅ CORRECT - Explicit probability
export const checkChance = (probability) => {
  return Math.random() < probability;
};
```

## File-Specific Guidelines

### eventEngine.js
**Purpose**: Trigger and resolve random narrative events (band conflicts, vehicle issues, lucky breaks)

**Key Functions:**
- `checkEvent(category, gameState, triggerPoint)` - Returns event or null
- `resolveChoice(choice, gameState)` - Processes player's decision

**Event Categories:**
- `'travel'` - Triggered during map navigation
- `'pregig'` - Before gig preparation
- `'postgig'` - After gig results
- `'financial'` - Money-related events
- `'band'` - Band member interactions

**Event Structure:**
```javascript
{
  id: 'event_van_breakdown',
  title: 'VAN BREAKDOWN',
  description: 'Your van sputters to a halt...',
  trigger: 'travel', // When to check for this event
  chance: 0.15, // 15% probability
  condition: (state) => state.player.van.condition < 50, // Optional
  choices: [
    {
      text: 'Pay for mechanic (€200)',
      cost: { money: 200 },
      outcome: { vanCondition: +50 }
    },
    {
      text: 'DIY Repair',
      skillCheck: {
        stat: 'technical', // Check a band member's stat
        threshold: 6,
        success: { vanCondition: +30 },
        failure: { vanCondition: -10, time: +2 }
      }
    }
  ]
}
```

**Critical Logic:**
1. **Pending Events** - Prioritize queued events from previous choices
2. **Cooldowns** - Check `gameState.eventCooldowns` to prevent spam
3. **Story Flags** - Boost chance if `activeStoryFlags` match event tags
4. **Skill Checks** - Roll against band member stats or luck

**Skill Check Algorithm:**
```javascript
const skillValue = Math.max(...gameState.band.members.map(m => m[stat] || 0));
const roll = Math.random() * 10;
const critBonus = roll > 8 ? 2 : 0;
const total = skillValue + critBonus;

if (total >= threshold) {
  // Success outcome
} else {
  // Failure outcome
}
```

### economyEngine.js
**Purpose**: Calculate money flows, validate transactions, prevent exploits

**Key Functions:**
- `calculateGigPayout(baseAmount, performance, modifiers)` - Earnings formula
- `calculateMerchRevenue(inventory, attendance, hype)` - Merch sales
- `calculateTravelCost(distance, fuelPrice, vanCondition)` - Trip expenses
- `validateTransaction(currentMoney, cost)` - Prevent negative balances

**Economic Balance:**
- Base gig payout: €150-€600 depending on venue difficulty
- Travel costs: ~€30-€80 per node
- Merch markup: 200-400% profit margin
- Upgrades cost: €100-€500

**Formulas:**
```javascript
// Gig Payout
const basePayout = venue.basePay;
const performanceMultiplier = (accuracy / 100) * (1 + comboBonus);
const difficultyBonus = 1 + (venue.difficulty * 0.15);
const promoBonus = modifiers.promo ? 1.3 : 1.0;
const finalPayout = basePayout * performanceMultiplier * difficultyBonus * promoBonus;

// Merch Revenue
const baseAttendance = venue.capacity * (performance / 100);
const merchBuyRate = modifiers.merchTable ? 0.4 : 0.2; // 20-40% of crowd
const avgItemPrice = 15;
const revenue = baseAttendance * merchBuyRate * avgItemPrice;
```

**Anti-Cheat:**
- Always use `Math.floor()` for final currency values
- Validate `currentMoney >= cost` before deductions
- Cap earnings to prevent overflow exploits

### socialEngine.js
**Purpose**: Simulate social media growth, viral mechanics, audience building

**Key Functions:**
- `calculateSocialGrowth(platform, performance, currentFollowers)` - Follower delta
- `checkViralEvent(performance, randomness)` - Rare viral boost
- `applyReputationDecay(followers, daysSinceLastPost)` - Organic decline

**Platform Mechanics:**
- **Instagram**: Steady linear growth, good for merch sales
- **TikTok**: High variance, potential for viral spikes
- **YouTube**: Slow build, best for long-term fame
- **Newsletter**: Direct fan connection, low churn

**Growth Formula:**
```javascript
const baseGrowth = Math.floor(performance / 10); // 0-10 followers per gig
const platformMultiplier = {
  instagram: 1.2,
  tiktok: 1.5, // More volatile
  youtube: 0.8,
  newsletter: 0.5
}[platform];
const viralBonus = checkViralEvent() ? 100 : 0;
const finalGrowth = baseGrowth * platformMultiplier + viralBonus;
```

**Viral Triggers:**
- Performance accuracy > 95%
- Combo multiplier > 2.5x
- Random chance (1% base, boosted by modifiers)

### mapGenerator.js
**Purpose**: Create procedural travel graph of German cities

**Key Functions:**
- `generateMap(startCity, depth, branchFactor)` - Creates node graph
- `getAdjacentNodes(nodeId, mapGraph)` - Find neighbors
- `calculateDistance(nodeA, nodeB)` - For fuel costs

**Map Structure:**
```javascript
{
  nodes: [
    {
      id: 'node_0_0',
      city: 'Stendal',
      region: 'Sachsen-Anhalt',
      type: 'START',
      venue: null,
      connections: ['node_1_0', 'node_1_1']
    },
    {
      id: 'node_1_0',
      city: 'Leipzig',
      region: 'Sachsen',
      type: 'VENUE',
      venue: { name: 'UT Connewitz', difficulty: 3, basePay: 300 },
      connections: ['node_0_0', 'node_2_0']
    }
  ]
}
```

**Generation Rules:**
- Start node always in Stendal (band's hometown)
- ~70% of nodes are venues (drawn from `venues.js`)
- ~20% are rest stops (no gig, just events)
- ~10% are special nodes (festivals, secret locations)
- Graph must be connected (no isolated nodes)

### AudioManager.js
**Purpose**: Wrap Howler.js for game audio

**Key Functions:**
- `playSound(soundId, options)` - Play SFX
- `playMusic(trackId, loop, volume)` - Background music
- `stopAll()` - Emergency stop
- `setMasterVolume(level)` - Global volume control

**Sound Categories:**
- **SFX**: Button clicks, note hits, crowd reactions
- **Music**: Menu theme, gig tracks (when assets exist)
- **Ambience**: Van engine, venue chatter

**Howler.js Pattern:**
```javascript
const soundLibrary = {
  click: new Howl({ src: ['/sounds/click.mp3'], volume: 0.5 }),
  hit_perfect: new Howl({ src: ['/sounds/hit.mp3'], volume: 0.8 })
};

export const AudioManager = {
  playSound: (id, options = {}) => {
    const sound = soundLibrary[id];
    if (!sound) {
      console.warn(`[Audio] Sound "${id}" not found`);
      return;
    }
    sound.volume(options.volume ?? sound._volume);
    sound.play();
  }
};
```

**Current Status**: Placeholder implementation (no assets yet)

### simulationUtils.js
**Purpose**: Utility helpers for game simulation

**Key Functions:**
- `advanceTime(currentTime, hours)` - Move clock forward
- `getTimeOfDay(hour)` - Return 'MORNING', 'AFTERNOON', 'NIGHT'
- `randomInt(min, max)` - Inclusive integer random
- `weightedChoice(items, weights)` - Probability selection

**Time System:**
- Game operates on 24-hour clock
- Gigs typically happen at night (19:00-23:00)
- Travel takes 2-4 hours depending on distance
- Events can modify time (delays, fast-forwards)

### imageGen.js
**Purpose**: Generate placeholder image URLs for missing assets

**Key Constants:**
```javascript
export const IMG_PROMPTS = {
  VENUE_CLUB: 'dark-underground-club',
  VENUE_FESTIVAL: 'outdoor-metal-festival',
  MATZE_PLAYING: 'death-metal-guitarist',
  // ... etc
};

export const getGenImageUrl = (prompt) => {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`;
};
```

**Note**: These are temporary. Replace with real assets when available.

## Testing Guidelines

### Unit Test Structure
```javascript
// Example test for economyEngine
describe('calculateGigPayout', () => {
  it('applies performance multiplier correctly', () => {
    const result = calculateGigPayout(300, 0.85, {});
    expect(result).toBe(255); // 300 * 0.85
  });
  
  it('caps payout at maximum threshold', () => {
    const result = calculateGigPayout(1000, 2.0, {});
    expect(result).toBeLessThanOrEqual(1500); // Anti-exploit cap
  });
});
```

### Manual Testing
- Run functions in browser console
- Verify outputs with different game states
- Check edge cases (negative values, null inputs)

## Integration Points

- **Scenes**: Import and call utility functions
- **Context**: GameState dispatches actions based on utility results
- **Data**: Utilities reference static databases (events.js, venues.js)
- **Hooks**: `useRhythmGameLogic` uses simulationUtils for timing

## Common Anti-Patterns

### ❌ Mutating State
```javascript
// WRONG
export const deductMoney = (gameState, amount) => {
  gameState.player.money -= amount; // Direct mutation
};
```

### ❌ Hidden Side Effects
```javascript
// WRONG
export const checkEvent = () => {
  localStorage.setItem('lastEvent', Date.now()); // Side effect
};
```

### ❌ Tight Coupling
```javascript
// WRONG
import { EVENTS_DB } from '../data/events';
export const getEvent = () => EVENTS_DB.travel[0]; // Hardcoded index
```

---

**Remember**: Utils are the "engine room" of the game. Keep them stateless, testable, and focused on single responsibilities. Complex orchestration belongs in scenes or the global context.
