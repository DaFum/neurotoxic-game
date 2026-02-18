# Data Module Agent

## Role

You are the **Game Database Architect** for NEUROTOXIC: GRIND THE VOID. You maintain the static data structures that define the game's content, balance, and narrative.

## Domain Expertise

This folder (`src/data/`) contains the "content database" - static JavaScript objects and arrays that define:

- **events.js** - Main event database aggregator
- **events/** - Categorized event files (band.js, financial.js, gig.js, special.js, transport.js)
- **venues.js** - All playable locations across Germany (~45 venues)
- **songs.js** - Band's setlist tracks with metadata
- **characters.js** - Band member profiles and stats
- **chatter.js** - Social media comment templates
- **upgrades.js** - Van and equipment upgrade options

## Core Principles

### Data as Code

All data is exported as JavaScript objects for type safety and autocomplete:

```javascript
// ✅ CORRECT - Named export
export const VENUES = [
  { id: 'venue_1', name: 'UT Connewitz', city: 'Leipzig', ... }
];

// ❌ WRONG - JSON files (harder to maintain)
// venues.json
```

### Immutability

Data files should be **read-only** during runtime:

```javascript
// ✅ CORRECT - Clone before modifying
const selectedVenues = [...VENUES].filter(v => v.region === 'Sachsen')

// ❌ WRONG - Direct mutation
VENUES[0].basePay = 500 // Modifies source data
```

### Referential Integrity

Use IDs to link related data:

```javascript
// ✅ CORRECT - Reference by ID
event.requiredVenue = 'venue_ut_connewitz'

// ❌ WRONG - Nested objects (hard to update)
event.requiredVenue = { name: 'UT Connewitz', city: 'Leipzig' }
```

## File-Specific Guidelines

### venues.js

**Purpose**: Define all gig locations and their properties

**Structure:**

```javascript
export const VENUES = [
  {
    id: 'venue_ut_connewitz',
    name: 'UT Connewitz',
    city: 'Leipzig',
    region: 'Sachsen',
    type: 'CLUB', // CLUB, FESTIVAL, DIY, SQUAT, ARENA
    capacity: 200,
    basePay: 300,
    difficulty: 3, // 1-7 scale
    prestige: 6, // Fame gained from playing here
    description: 'Legendary Leipzig underground venue',
    requirements: {
      minFame: 0, // Unlocked from start
      story_flag: null
    }
  }
  // ... ~44 more venues
]
```

**Balance Guidelines:**

- Difficulty 1-2: Small DIY venues (€150-€250)
- Difficulty 3-5: Established clubs (€300-€500)
- Difficulty 6-7: Festivals & large venues (€600-€1000)
- Capacity correlates with base pay (200 cap ≈ €300)

**Regional Distribution:**

- Sachsen (Leipzig, Dresden): 8 venues
- Berlin: 10 venues
- NRW (Köln, Düsseldorf): 7 venues
- Bayern (München): 5 venues
- Other regions: 2-3 each

### songs.js

**Purpose**: Define the band's repertoire

**Structure:**

```javascript
export const SONGS = [
  {
    id: 'song_cosmic_abyss',
    title: 'COSMIC ABYSS',
    bpm: 180,
    duration: 210, // seconds
    difficulty: 4, // 1-7 scale
    intensity: 'HIGH', // LOW, MEDIUM, HIGH, EXTREME
    tags: ['cosmic', 'blast-beats', 'technical'],
    notePattern: 'dense_chaos', // Pattern ID for rhythm engine
    crowdAppeal: 7, // How much the crowd loves it
    staminaDrain: 15 // Energy cost to perform
  }
]
```

**Setlist Strategy:**

- Players select 5-8 songs for a gig
- Mix difficulty to manage stamina
- High crowd appeal = better tips
- Pattern IDs link to note generation in rhythm engine

### characters.js

**Purpose**: Band member profiles

**Structure:**

```javascript
export const CHARACTERS = {
  MATZE: {
    id: 'matze',
    name: 'Matze',
    instrument: 'Guitar',
    bio: 'The riff architect. Heavy as fuck.',
    stats: {
      technical: 7, // Skill at instrument
      charisma: 5, // Stage presence
      endurance: 6, // Stamina
      creativity: 8 // For skill checks
    },
    traits: ['PERFECTIONIST', 'NIGHT_OWL'],
    startingMood: 80,
    startingStamina: 100
  },
  LARS: {
    /* ... */
  },
  MARIUS: {
    /* ... */
  }
}
```

**Trait Effects:**

- `PERFECTIONIST` - Bonus to accuracy, penalty to mood if mistakes made
- `NIGHT_OWL` - Less stamina drain on late-night gigs
- `SOCIAL_BUTTERFLY` - Faster social media growth

### events.js (Main Aggregator)

**Purpose**: Re-export all event categories

```javascript
import { BAND_EVENTS } from './events/band.js'
import { FINANCIAL_EVENTS } from './events/financial.js'
import { GIG_EVENTS } from './events/gig.js'
import { SPECIAL_EVENTS } from './events/special.js'
import { TRANSPORT_EVENTS } from './events/transport.js'

export const EVENTS_DB = {
  band: BAND_EVENTS,
  financial: FINANCIAL_EVENTS,
  gig: GIG_EVENTS,
  special: SPECIAL_EVENTS,
  transport: TRANSPORT_EVENTS,
  travel: TRANSPORT_EVENTS // Alias for compatibility
}
```

### events/band.js

**Purpose**: Band member interactions, conflict, bonding

**Example:**

```javascript
export const BAND_EVENTS = [
  {
    id: 'event_band_argument',
    title: 'CREATIVE DIFFERENCES',
    description: 'Matze and Lars are fighting about the setlist again.',
    trigger: 'postgig', // When this can fire
    chance: 0.2, // 20% probability
    condition: state => state.band.harmony < 60, // Only when morale low
    choices: [
      {
        text: 'Side with Matze',
        outcome: {
          harmony: -5,
          bandMemberMood: { matze: +10, lars: -15 }
        }
      },
      {
        text: 'Side with Lars',
        outcome: {
          harmony: -5,
          bandMemberMood: { matze: -15, lars: +10 }
        }
      },
      {
        text: 'Suggest a compromise',
        skillCheck: {
          stat: 'charisma',
          threshold: 6,
          success: { harmony: +10, bandMemberMood: { matze: +5, lars: +5 } },
          failure: { harmony: -10 }
        }
      }
    ],
    cooldown: 5 // Days before this can trigger again
  }
]
```

### events/financial.js

**Purpose**: Money-related events (windfalls, robberies, debts)

**Examples:**

- Merch bootleggers stealing sales
- Unexpected tax bill
- Sponsorship offer
- Winning small lottery

### events/gig.js

**Purpose**: Events during or around performances

**Examples:**

- Equipment malfunction mid-show
- Famous musician in the crowd
- Stage diver injury
- Venue doesn't pay

### events/special.js

**Purpose**: Rare, story-defining moments

**Examples:**

- Record label scout appearance
- Invitation to international tour
- Rival band challenge
- Cosmic entity contact (lore-heavy)

### events/transport.js

**Purpose**: Travel-related incidents

**Examples:**

- Van breakdown
- Traffic jam (time delay)
- Police checkpoint
- Hitchhiker encounter

**Event Anatomy:**

```javascript
{
  id: 'unique_identifier',
  title: 'DISPLAY NAME',
  description: 'Narrative text',
  trigger: 'travel' | 'pregig' | 'postgig' | 'random',
  chance: 0.0 - 1.0, // Probability
  condition: (state) => boolean, // Optional gate
  requiredFlag: 'story_flag_name', // Optional prerequisite
  choices: [
    {
      text: 'Option description',
      cost: { money: 100, fuel: 10 }, // Optional
      outcome: { money: -100, harmony: +10 }, // Direct effects
      skillCheck: { /* ... */ }, // Optional
      nextEvent: 'event_id', // Chain to another event
      setFlag: 'story_flag' // Unlock future events
    }
  ],
  cooldown: 3, // Days before re-triggering
  tags: ['urgent', 'humorous'] // For filtering
}
```

### chatter.js

**Purpose**: Social media comment templates

**Structure:**

```javascript
export const CHATTER_DB = {
  positive: [
    '🔥🔥🔥 INSANE SHOW',
    'vocals are BRUTAL',
    'drummer is a machine omg'
    // ... 20+ more
  ],
  neutral: [
    'not bad',
    'crowd is kinda dead tho'
    // ...
  ],
  negative: [
    "yikes... they're off tonight",
    'sound guy is sleeping or what'
    // ...
  ],
  venue_specific: {
    leipzig: ['Leipzig crowd best crowd', 'UT Connewitz never disappoints']
    // ...
  }
}
```

**Usage:**
ChatterOverlay component randomly selects based on performance.

### upgrades.js

**Purpose**: Van and equipment improvements used by the unified BandHQ upgrade selector (`upgradeCatalog.js`)

**Structure:**

```javascript
export const UPGRADES = [
  {
    id: 'upgrade_van_engine',
    name: 'New Engine',
    category: 'VAN',
    description: 'Reduces fuel consumption by 20%',
    cost: 400,
    requirements: { minFame: 10 },
    effects: [
      { type: 'stat_modifier', stat: 'fuelEfficiency', value: 1.2 },
      { type: 'stat_modifier', stat: 'vanCondition', value: 10 }
    ],
    oneTime: true // Can only buy once
  },
  {
    id: 'upgrade_better_strings',
    name: 'Premium Strings',
    category: 'GEAR',
    cost: 50,
    effects: [
      { type: 'stat_modifier', stat: 'accuracyBonus', value: 2 }
    ],
    oneTime: false // Consumable, repeatable
  }
]
```

**Categories:**

- `VAN` - Transport improvements
- `GEAR` - Instrument/audio equipment
- `MERCH` - Better merchandise quality
- `PROMO` - Marketing tools

## Data Validation Rules

### Required Fields

All data objects must have:

- `id` - Unique string identifier
- `name` or `title` - Display name
- Type-specific fields (see structures above)

### ID Conventions

```javascript
// ✅ CORRECT - Descriptive, namespaced
id: 'venue_ut_connewitz'
id: 'event_van_breakdown'
id: 'song_cosmic_abyss'

// ❌ WRONG - Ambiguous
id: 'v1'
id: 'event123'
```

### Balance Constraints

- Difficulty: 1-7 scale
- Costs: Multiples of 10 (for clean UI)
- Probabilities: 0.0-1.0 (not percentages)
- Stats: 1-10 scale

## Integration with Game Systems

### With Utils

```javascript
// eventEngine.js uses EVENTS_DB
import { EVENTS_DB } from '../data/events'
const event = EVENTS_DB.travel.find(e => e.id === 'event_van_breakdown')
```

### With Scenes

```javascript
// Overworld.jsx uses VENUES
import { VENUES } from '../data/venues'
const venue = VENUES.find(v => v.city === currentCity)
```

### With Context

```javascript
// GameState.jsx initializes with CHARACTERS
import { CHARACTERS } from '../data/characters'
const initialState = {
  band: {
    members: [
      { ...CHARACTERS.MATZE, mood: 80 }
      // ...
    ]
  }
}
```

## Adding New Content

### New Venue

1. Add object to `VENUES` array
2. Choose unique ID (`venue_city_name`)
3. Set balanced stats (refer to similar difficulty venues)
4. Add to map generation pool (automatic)
5. Test accessibility in Overworld

### New Event

1. Determine category (band, financial, gig, transport, special)
2. Add to appropriate `events/*.js` file
3. Set trigger point and probability
4. Write 2-3 meaningful choices
5. Test via `eventEngine.checkEvent()` in console

### New Song

1. Add to `SONGS` array
2. Set BPM and duration (affects note generation)
3. Assign note pattern ID
4. Balance stamina drain vs crowd appeal
5. Test in rhythm game

## Common Anti-Patterns

### ❌ Magic Numbers

```javascript
// WRONG
basePay: 300,
difficulty: 3,
capacity: 200,

// BETTER - Add context
basePay: 300, // €300 base (medium club rate)
difficulty: 3, // 1-7 scale, medium challenge
capacity: 200, // Max crowd size
```

### ❌ Inconsistent Formatting

```javascript
// WRONG - Mixed quote styles, inconsistent spacing
const VENUES = [{ id: 'v1', name: 'Club' }]

// CORRECT
export const VENUES = [{ id: 'venue_1', name: 'Club Name' }]
```

### ❌ Circular References

```javascript
// WRONG
const eventA = { nextEvent: 'eventB' }
const eventB = { nextEvent: 'eventA' } // Infinite loop
```

## Testing Data Changes

```javascript
// In browser console or test file
import { VENUES } from './src/data/venues.js'

// Validate structure
VENUES.forEach(v => {
  if (!v.id || !v.name || !v.city) {
    console.error('Invalid venue:', v)
  }
  if (v.basePay < 100 || v.basePay > 2000) {
    console.warn('Unusual payout:', v.name, v.basePay)
  }
})

// Check balance
const avgPay = VENUES.reduce((sum, v) => sum + v.basePay, 0) / VENUES.length
console.log('Average venue payout:', avgPay) // Should be ~€400
```

---

**Remember**: Data files are the "source of truth" for game balance. Changes here ripple through the entire experience. Keep data clean, well-structured, and documented. Every number tells a story.

## Maintenance

- Last updated: 2026-02-17.
