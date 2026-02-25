### 1. FULL EVENT OBJECT STRUCTURE

All events follow this schema (defined across multiple event files):

```javascript
{
  id: string,                              // Unique identifier (e.g., 'crisis_bad_review')
  category: string,                        // 'transport', 'band', 'gig', 'financial', 'special'
  tags: string[],                          // Optional: ['crisis', 'reputation', 'conflict']
  title: string,                           // Display title (UPPERCASE, 40-50 chars typical)
  description: string,                     // Narrative description (2-3 sentences)
  trigger: string,                         // 'random', 'travel', 'gig_intro', 'gig_mid', 'post_gig', 'special_location'
  chance: number,                          // 0.0-1.0 probability (1.0 = guaranteed if condition met)
  condition?: (gameState) => boolean,      // Optional filter function (evaluated at trigger point)
  requiredFlag?: string,                   // Optional: story flag requirement (multiplies chance by 5x if present)
  options: Array[{
    label: string,                         // Player-facing button text
    effect?: {                             // For direct effects
      type: string,                        // 'stat', 'resource', 'item', 'unlock', 'chain', 'flag', 'game_over', 'composite'
      [field]: any                         // Type-specific fields
    },
    skillCheck?: {                         // For checked outcomes
      stat: string,                        // Band stat ('harmony'), member stat ('charisma'), or 'luck'
      threshold: number,                   // 1-10 scale for skill roll + bonus
      success: { type, stat|resource, value, description },
      failure: { type, stat|resource, value, description }
    },
    outcomeText: string,                   // Short narrative outcome line
    nextEventId?: string                   // Chain to next event
  }]
}
```

**Effect Types:**

- `'stat'`: Modifies `band.harmony`, `player.fame`, member `mood`/`stamina`, `controversyLevel`, `loyalty`, `viral`, `score`, `luck`, `van_condition`, `hype`
- `'resource'`: Modifies `money` or `fuel` (auto-clamped to valid ranges)
- `'item'`: Adds/removes inventory items
- `'stat_increment'`: Increments tracked stats like `conflictsResolved`, `stageDives`
- `'composite'`: Array of multiple effects applied together
- `'flag'`: Adds story flag to `activeStoryFlags`
- `'unlock'`: Unlocks UI features
- `'chain'`: Queues next event to `pendingEvents`
- `'game_over'`: Ends game

---

### 2. STATE FIELDS RELATED TO REPUTATION, SOCIAL, HARMONY & CONTROVERSY

**Social Media State** (`src/context/initialState.js` - `DEFAULT_SOCIAL_STATE`):

```javascript
{
  instagram: 228,                          // Follower count
  tiktok: 64,                              // Follower count
  youtube: 14,                             // Follower count
  newsletter: 0,                           // Subscriber count
  viral: 0,                                // Viral token counter (used in trait unlocks)
  lastGigDay: null,                        // Day of last gig (for decay calculation)
  controversyLevel: 0,                     // 0-100+ (CORE CRISIS METRIC)
  loyalty: 0,                              // 0+ (fan buffer/shield against penalties)
  egoFocus: null,                          // Member name or null (tracks ego drama)
  sponsorActive: false,                    // Forces specific post in rotation
  trend: 'NEUTRAL',                        // 'NEUTRAL'|'DRAMA'|'TECH'|'MUSIC'|'WHOLESOME'
  activeDeals: [],                         // [{ id, remainingGigs, type, ... }]
  reputationCooldown: 0                    // Blocks reputation-gated posts, decays -1/day
}
```

**Player Stats** (`DEFAULT_PLAYER_STATE.stats`):

```javascript
{
  consecutiveBadShows: 0,                  // Bad show streak counter (triggers quest at 3)
  proveYourselfMode: false                 // Restricts travel to venues ≤150 capacity
}
```

**Root State (new fields)**:

```javascript
{
  venueBlacklist: [],                      // Venue names blocked from booking
  activeQuests: []                         // Timed quests: [{ id, label, deadline, progress, required, rewardFlag, failurePenalty }]
}
```

**Player State** (`DEFAULT_PLAYER_STATE`):

```javascript
{
  money: 500,                              // Cash (clamped to 0+)
  day: 1,                                  // Current day
  location: 'Stendal',                     // Current city
  fame: 0,                                 // Fame accumulation
  fameLevel: 0,                            // Fame tier
  stats: { totalDistance, conflictsResolved, stageDives }  // Tracked metrics
}
```

**Band State** (`DEFAULT_BAND_STATE`):

```javascript
{
  members: [                               // 3 band members
    { name, mood: 0-100, stamina: 0-100, traits: [] }
  ],
  harmony: 80,                             // 1-100 (band cohesion)
  harmonyRegenTravel: false,               // Travel healing flag
  inventory: {                             // Equipment
    shirts, hoodies, patches, cds, vinyl, strings, cables, drum_parts, golden_pick, spare_tire
  },
  luck: 0,                                 // Luck stat (used in skill checks)
  performance: {                           // Gig modifiers
    guitarDifficulty: 1.0,
    drumMultiplier: 1.0,
    crowdDecay: 1.0
  }
}
```

**Regional Reputation** (`reputationByRegion` in root state):

```javascript
{
  'Berlin': -10,                           // Numerical reputation per location
  'München': 15,
  // ...
}
```

---

### 3. CRISIS SYSTEM CURRENTLY IMPLEMENTED

**Crisis Event Pool** (13 crisis events in `/src/data/events/crisis.js`):

1. **`crisis_bad_review`** (band) - Negative review triggers at `controversyLevel >= 20` + low harmony
2. **`crisis_online_backlash`** (band) - Thread hit 10k at `controversyLevel >= 50`
3. **`crisis_shadowban_scare`** (band) - Algorithmic death at `controversyLevel >= 80`
4. **`crisis_venue_cancels`** (financial) - Booking pulled at `controversyLevel >= 65`
5. **`crisis_redemption_charity`** (special) - Free gig opportunity at `controversyLevel >= 40`
6. **`crisis_sponsor_ultimatum`** (financial) - Sponsor threat at `controversyLevel >= 80` + active deals
7. **`crisis_poor_performance`** (band) - Bad gig (<30 score) auto-triggers, penalizes regional reputation
8. **`crisis_leaked_story`** (band) - Scandal at `controversyLevel >= 60`
9. **`crisis_mass_unfollow`** (band) - Hate campaign at `controversyLevel >= 75`
10. **`crisis_ego_clash`** (band) - Screaming match when `egoFocus !== null` + `harmony < 40`
11. **`crisis_notice_50`** (band) - Warning at `>=50` (story flag: `saw_crisis_50`)
12. **`crisis_notice_80`** (band) - Algorithm penalty warning at `>=80` (story flag: `saw_crisis_80`)
13. **`crisis_notice_100`** (band) - Full shadowban confirmation at `>=100` (story flag: `saw_crisis_100`)

**Consequence Event Pool** (6 consequence events in `/src/data/events/consequences.js`):

14. **`consequences_cancel_culture_quest`** (band) - Triggers at `controversyLevel >= 70` + `instagram >= 5000`
15. **`consequences_bandmate_scandal`** (band) - Queued via `pendingFlags.scandal` from ego system
16. **`consequences_comeback_album`** (special) - Queued when apology tour complete + controversy < 30
17. **`consequences_prove_yourself_start`** (band) - Triggered inline by 3 consecutive bad shows
18. **`consequences_reputation_freeze`** (band) - Triggers at `controversyLevel >= 50`
19. **`consequences_discounted_tickets`** (financial) - Available at low regional reputation
    **Crisis Mechanics:**

- **Controversy Decay**: Passive -1 per day (very slow)
- **Shadowban Penalty**: At `controversyLevel >= 80`, follower growth applies `penaltyFactor = (level - 70) * 0.05`
  - Level 80 → 50% negative growth
  - Level 100 → 150% penalty (followers lost)
- **Loyalty Shield**: Reduces performance penalty: `effectivePerf = Math.min(100, performance + (loyalty * 0.5))`
- **Regional Reputation**: Poor gigs (<30 score) penalize by -10; venues block if `reputation <= -30`
- **Sponsor Dropout**: 20% daily chance to drop if `controversy >= 80`
- **PR Manager Recovery** (HQ upgrade): -200€ → -25 controversy

---

### 4. ACTION TYPES IN REDUCER

All available action types from `src/context/gameReducer.js`:

```javascript
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  UPDATE_BAND: 'UPDATE_BAND',
  UPDATE_SOCIAL: 'UPDATE_SOCIAL', // ← Crisis-relevant
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_MAP: 'SET_MAP',
  SET_GIG: 'SET_GIG',
  START_GIG: 'START_GIG',
  SET_SETLIST: 'SET_SETLIST',
  SET_LAST_GIG_STATS: 'SET_LAST_GIG_STATS', // ← Triggers regional rep loss + bad show tracking
  SET_ACTIVE_EVENT: 'SET_ACTIVE_EVENT',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_GIG_MODIFIERS: 'SET_GIG_MODIFIERS',
  LOAD_GAME: 'LOAD_GAME',
  RESET_STATE: 'RESET_STATE',
  APPLY_EVENT_DELTA: 'APPLY_EVENT_DELTA', // ← Applies event consequences
  POP_PENDING_EVENT: 'POP_PENDING_EVENT',
  CONSUME_ITEM: 'CONSUME_ITEM',
  ADVANCE_DAY: 'ADVANCE_DAY', // ← Triggers daily decay + quest expiry
  ADD_COOLDOWN: 'ADD_COOLDOWN',
  START_TRAVEL_MINIGAME: 'START_TRAVEL_MINIGAME',
  COMPLETE_TRAVEL_MINIGAME: 'COMPLETE_TRAVEL_MINIGAME',
  START_ROADIE_MINIGAME: 'START_ROADIE_MINIGAME',
  COMPLETE_ROADIE_MINIGAME: 'COMPLETE_ROADIE_MINIGAME',
  UNLOCK_TRAIT: 'UNLOCK_TRAIT',
  RECORD_BAD_SHOW: 'RECORD_BAD_SHOW', // ← Increments bad show streak
  RECORD_GOOD_SHOW: 'RECORD_GOOD_SHOW', // ← Resets bad show streak
  ADD_VENUE_BLACKLIST: 'ADD_VENUE_BLACKLIST', // ← Blacklists venue
  ADD_QUEST: 'ADD_QUEST', // ← Adds timed quest
  ADVANCE_QUEST: 'ADVANCE_QUEST', // ← Increments quest progress
  COMPLETE_QUEST: 'COMPLETE_QUEST', // ← Completes quest + rewards
  FAIL_QUESTS: 'FAIL_QUESTS' // ← Expires overdue quests + penalties
}
```

**Crisis-Specific Handlers:**

- `UPDATE_SOCIAL` - Validates and updates `controversyLevel`, `loyalty`, `trend`, `activeDeals`
- `APPLY_EVENT_DELTA` - Processes effect objects, applying all state mutations
- `ADVANCE_DAY` - Calls `calculateDailyUpdates()` which decrements controversy by 1, decays `reputationCooldown`, and returns `pendingFlags` (ego→scandal trigger)
- `SET_LAST_GIG_STATS` - Tracks bad show streaks, triggers venue blacklisting, advances quests on good shows
- `ADD_QUEST` / `ADVANCE_QUEST` / `COMPLETE_QUEST` / `FAIL_QUESTS` - Full quest lifecycle management

---

### 5. REPUTATION CONCEPT IN CODEBASE

**There is NO global "reputation" stat.** Instead, reputation exists as:

1. **Regional Reputation** (`reputationByRegion` in root state)
   - Penalized by -10 when gig score < 30
   - Venues refuse booking if `reputation <= -30` (checked in `useTravelLogic`)
   - Used in economy: `calculateTicketIncome` applies up to -20% fill rate penalty based on `regionRep`
2. **Social Reputation** (represented by `controversyLevel` + `loyalty`)
   - `controversyLevel` is the "damage" metric
   - `loyalty` is the "fan buffer" metric
   - Together they control algorithmic growth penalties
   - Controversy also affects ticket fill rate (up to -30% at high levels)
3. **Follower Growth** (calculated via `calculateSocialGrowth()`)
   - Base: `Math.max(0, performance - 50) * 0.5`
   - Loyalty shield: Adds `loyalty * 0.5` to effective performance
   - Controversy penalty: At 80+, applies `-(level - 70) * 0.05` multiplier

---

### 6. SOCIAL ENGINE MECHANICS

**Post Options** (26 available posts in `src/data/postOptions.js`):
Each post has:

- `condition()`: Function to determine if post is available
- `resolve()`: Function returning:
  ```javascript
  {
    success: boolean,
    followers: number,           // Can be negative
    platform: 'instagram'|'tiktok'|'youtube'|'newsletter',
    message: string,
    moneyChange?: number,
    harmonyChange?: number,
    moodChange?: number,
    staminaChange?: number,
    controversyChange?: number,  // ← Crisis impact
    loyaltyChange?: number,      // ← Fan buffer impact
    targetMember?: string,
    egoDrop?: string,            // Ego tracking
    unlockTrait?: { memberId, traitId }
  }
  ```
  **High-Risk Posts:**
- `drama_drunk_stream`: 70% success (+3k followers), 30% disaster (-2k, +30 controversy)
- `drama_leaked_dms`: 60% success (+4k, +20 controversy), 40% fail (-1k, +40 controversy)
- `perf_sound_guy_rant`: +1500 followers, +10 controversy
- `drama_manufactured`: +5000 followers, -15 harmony, +25 controversy
  **Loyalty-Building Posts:**
- `drama_political_take`: -1000 followers (lose casuals), +20 loyalty
- `drama_van_breakdown`: +1500 followers, +10 loyalty
  **Daily Trend System:**
- Random trend generated daily: 'NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME'
- Posts matching trend get +10x weight in selection
- Example: DRAMA trend boosts drama posts, MUSIC boosts performance posts
  **Virality Check:**
- Triggers if accuracy > 95% OR maxCombo > 50 OR random roll passes threshold
- Trait bonuses: Social Manager (+15%), Showman (+20%)
- Viral posts grant follower bonus: `(currentFollowers * 0.1) + 100`

---

### 7. POST-GIG SOCIAL FLOW

After a gig, the game:

1. Selects 3 random post options (weighted by trend + eligibility)
2. Player chooses one to post
3. `resolvePost()` executes and returns follower changes + side effects
4. Side effects apply via `APPLY_EVENT_DELTA`
5. Crisis events check trigger (`crisis_*` filters activate based on controversy level)
   **Post Options Schema** (also in `src/data/postOptions.js`):

```javascript
{
  id: string,
  name: string,
  platform: string,
  category: 'Performance'|'Drama'|'Commercial'|'Lifestyle',
  badges: ['⚠️', '🔥', '🛡️', '💰', '📖'],
  condition: (gameState) => boolean,
  resolve: (gameState) => resultObject
}
```

---

### 8. KEY FILES & ABSOLUTE PATHS

| Purpose           | File Path                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| Event definitions | `/home/user/neurotoxic-game/src/data/events/crisis.js` (crisis events) |
| Event engine      | `/home/user/neurotoxic-game/src/utils/eventEngine.js`                  |
| Event index       | `/home/user/neurotoxic-game/src/data/events/index.js`                  |
| State schema      | `/home/user/neurotoxic-game/src/context/initialState.js`               |
| Reducer & actions | `/home/user/neurotoxic-game/src/context/gameReducer.js`                |
| Action creators   | `/home/user/neurotoxic-game/src/context/actionCreators.js`             |
| Social mechanics  | `/home/user/neurotoxic-game/src/utils/socialEngine.js`                 |
| Post options      | `/home/user/neurotoxic-game/src/data/postOptions.js`                   |
| Daily updates     | `/home/user/neurotoxic-game/src/utils/simulationUtils.js`              |
| Crisis docs       | `/home/user/neurotoxic-game/docs/CRISIS_MANAGEMENT.md`                 |

---

### 9. SUMMARY TABLE

| Concept              | Current Implementation                  | Status         |
| -------------------- | --------------------------------------- | -------------- |
| Controversy tracking | `controversyLevel` (0-100+)             | ✅ Full        |
| Shadowban penalty    | 50-150% negative growth at 80+          | ✅ Full        |
| Loyalty shield       | Fan buffer reducing performance penalty | ✅ Full        |
| Passive decay        | -1 per day                              | ✅ Implemented |
| Crisis events        | 13 dedicated events                     | ✅ Full        |
| Regional reputation  | Penalized on poor gigs, blocks venues   | ✅ Full        |
| Viral posts          | RNG-based with trait bonuses            | ✅ Full        |
| Trend system         | Daily random trending category          | ✅ Full        |
| Recovery mechanics   | PR manager, events, loyalty             | ✅ Partial     |
| Reputation concept   | NO global stat (regional + social)      | ❌ N/A         |

This completes the comprehensive exploration of the NEUROTOXIC event and crisis system!
