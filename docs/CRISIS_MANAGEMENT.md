## 1. CRISIS MANAGEMENT CURRENTLY IMPLEMENTED

### A. State Fields (in `initialState.js`)

```javascript
DEFAULT_SOCIAL_STATE = {
  instagram: 228,
  tiktok: 64,
  youtube: 14,
  newsletter: 0,
  viral: 0,
  lastGigDay: null,
  controversyLevel: 0, // ← CRISIS METRIC (0-100+, shadowban at 100)
  loyalty: 0, // ← LOYALTY BUFFER (shields against bad gigs)
  egoFocus: null, // ← EGO/DRAMA tracking
  sponsorActive: false,
  trend: 'NEUTRAL',
  activeDeals: []
}
```

### B. Crisis Mechanics in `socialEngine.js`

**Controversy System (Shadowban):**

- `controversyLevel` ranges from 0-100+
- At `controversyLevel >= 80`: 50% follower loss penalty triggers
- At `controversyLevel >= 100`: **-75% social growth penalty** (near total shadowban)
- Growth formula applies penalty: `baseGrowth * penaltyFactor = baseGrowth * (controversyLevel - 70) * 0.05`
  **Loyalty Buffer:**
- `loyalty` stat shields against poor performance impact
- Calculation: `effectivePerf = Math.min(100, performance + (loyalty * 0.5))`
- Loyalty reduces negative consequences of bad gigs
  **Post Resolution Effects:**

```javascript
resolvePost() returns:
- controversyChange: +/- controversy adjustment
- loyaltyChange: +/- loyalty adjustment
- followerChange: Can be negative (follower loss)
- harmonyChange, moodChange, staminaChange
```

### C. Crisis Events in Post-Gig Flow (`PostGig.jsx`)

**Post Selection Phase:**

- 3 random social media post options are generated
- Posts can have `controversyChange` (e.g., "Drunk Stream": +30 controversy on failure)
- Posts can have `loyaltyChange` (e.g., "Political Take": +20 loyalty, -1000 followers)
  **Crisis Recovery Mechanic:**

```javascript
// PR Manager Upgrade Recovery
if (hasPR && isHighControversy && onSpinStory) {
  onSpinStory() → -200€, -25 Controversy
}
```

- Only available if player has `pr_manager_contract` HQ upgrade
- Costs 200€ to reduce controversy by 25 points

### D. Daily Passive Recovery (`simulationUtils.js`)

```javascript
// Controversy/Shadowban Decay
if (nextSocial.controversyLevel > 0) {
  nextSocial.controversyLevel = Math.max(0, nextSocial.controversyLevel - 1)
}
```

- **Passive decay: -1 controversy per day** (very slow recovery, ~100 days for full recovery from 100)

### E. UI Crisis Display (`DetailedStatsTab.jsx`)

```javascript
<DetailRow
  label='Controversy'
  value={`${Math.min(100, social.controversyLevel || 0)}/100`}
  subtext={
    social.controversyLevel >= 100
      ? 'SHADOWBANNED (-75% Growth)'
      : 'Risk of Shadowban'
  }
/>
```

### F. Brand Deal Penalties (`brandDeals.js`, `PostGig.jsx`)

```javascript
if (deal.penalty) {
  if (deal.penalty.controversy) controversyLevel += deal.penalty.controversy
}
// Example: Energy drink sponsors add +5 controversy
```

---

## 2. CRITICAL GAPS & MISSING FEATURES

### A. No Explicit "Bad Review" or "Poor Performance" Events

**Missing:**

- No event triggered when gig score is critically low (e.g., < 30%)
- No negative feedback event from venues after bad shows
- No "tour reputation" tracking by region
- No local backlash that prevents re-booking at venues
- No cascading failure scenarios (e.g., "If you play badly 3 times, venues stop booking you")
  **What exists instead:**
- `reputationByRegion: {}` field in state (line 143 of `initialState.js`) is **UNUSED**
- Regional reputation is never updated or checked anywhere

### B. No Controversy-Specific Events

**Missing crisis events:**

- No "scandal" events that trigger from high controversy
- No "leaked story" events
- No "bandmate caught doing something stupid" consequences
- No "apology tour" mechanic to recover
- No "cancel culture backlash" minigames or quests
  **What does exist:**
- Post options can ADD controversy (e.g., "Drunk Stream" failure: +30)
- But no story-driven crisis events tied to controversy level itself

### C. No Recovery Events or "Redemption Arc"

**Missing:**

- No "comeback album" event
- No "charity concert" to repair reputation
- No "public apology" event
- No "leaked good-deed footage" counter-scandal
- No time-locked reputation repair quests
- Only mechanical recovery: -1/day passive + PR Manager (-25 for 200€)

### D. No Follower Loss Events (Except Posts)

**Missing:**

- No "mass unfollower" event when controversy spikes
- No "algorithmic shadowban begins" event
- No "brand drops band" automatic event when controversy hits threshold
- No notification system for hitting controversy milestones
  **What exists:**
- Posts can return negative follower change (e.g., "Crowdfunding": -500 followers)
- But no event-driven mass follower loss

### E. No Loyalty-Specific Crisis Mechanics

**Missing:**

- Loyalty is tracked but no events are tied to it
- No "true fans defend you during scandal" events
- No "loyalty converts to merchandise sales during controversy"
- No "loyalty shields you from being dropped by venues" mechanics
- Loyalty only mechanically shields gig performance (effectivePerf calculation)

### F. No Ego Crisis Events

**What exists:**

- `egoFocus` field tracks which member is focused on
- `egoFocus` decays harmony by -2 per day
- Posts can set `egoDrop` (focus on a member) or `egoClear` (resolve egos)
  **Missing:**
- No "ego clash escalates to physical fight" event
- No "vocalist demands solo career" event
- No "band member quits" mechanics
- No "ego generates scandal" link
- No "manage egos to prevent breakup" quest

### G. No Financial Consequences of Crisis

**Missing:**

- No "sponsorship drops due to scandal" automatic event
- No "venue cancels tour due to controversy" event
- No "ticket sales collapse" event when controversy is high
- Gig financials are determined only by score & capacity, NOT by band reputation

### H. No Stage-Gated Crisis Recovery

**Missing:**

- No "prove yourself tour" where you must play small venues to rebuild
- No "reputation cooldown" between crisis posts
- No "limited bookings" mechanic when controversial
- No "venues check your score before booking" logic

### I. No Crisis Interactions with Other Systems

**Missing:**

- Crisis doesn't affect:
  - Band member morale/mood (harmony decays, but moods aren't affected by scandal)
  - Member departure risk
  - Van breakdown chance
  - HQ upgrade availability
  - Setlist restrictions
  - Minigame difficulty

### J. No "Controversy Tipping Points" Events

**Missing:**

- No event at `controversyLevel = 50` ("Notice of backlash")
- No event at `controversyLevel = 80` ("Algorithmic slowdown begins")
- No event at `controversyLevel = 100` ("Full shadowban active")
- No "point of no return" scenario

---

## 3. EXACT SCHEMA OF KEY STRUCTURES

### A. Social State Schema

```javascript
{
  instagram: number,         // Followers
  tiktok: number,            // Followers
  youtube: number,           // Followers
  newsletter: number,        // Subscribers
  viral: number,             // Viral token counter
  lastGigDay: number|null,   // Day of last gig (for decay)
  controversyLevel: number,  // 0-100+ (shadowban at 100)
  loyalty: number,           // 0+ (shields, no upper bound defined)
  egoFocus: string|null,     // Member name or null
  sponsorActive: boolean,    // Sponsor forcing post
  trend: string,             // 'NEUTRAL'|'DRAMA'|'TECH'|'MUSIC'|'WHOLESOME'
  activeDeals: array         // [{ id, remainingGigs, ... }]
}
```

### B. Post Option Schema

```javascript
{
  id: string,
  name: string,
  platform: 'instagram'|'tiktok'|'youtube'|'newsletter',
  category: string,
  badges: array,
  condition: (gameState) => boolean,
  resolve: (gameState) => {
    success: boolean,
    followers: number,
    platform: string,
    message: string,
    moneyChange: number,
    moodChange: number,
    harmonyChange: number,
    staminaChange: number,
    controversyChange: number,    // ← Crisis metric
    loyaltyChange: number,         // ← Loyalty metric
    targetMember: string,
    allMembersMoodChange: boolean,
    allMembersStaminaChange: boolean,
    egoDrop: string|null,
    egoClear: boolean,
    unlockTrait: { memberId, traitId }
  }
}
```

### C. Event Schema (band/financial/gig events)

```javascript
{
  id: string,
  category: string,
  tags: array,
  title: string,
  description: string,
  trigger: string,           // 'random'|'gig_intro'|'gig_mid'|'post_gig'
  chance: number,            // 0.0-1.0
  options: array[{
    label: string,
    effect: { type, stat|resource, value },
    skillCheck: { stat, threshold, success{}, failure{} },
    outcomeText: string
  }]
}
```

**Note:** Events have NO built-in `controversyChange` or `loyaltyChange` fields. These are only in POST_OPTIONS.

### D. ActionTypes Relevant to Crisis

```javascript
UPDATE_SOCIAL: 'UPDATE_SOCIAL' // Updates social state (controversy, loyalty, etc)
APPLY_EVENT_DELTA: 'APPLY_EVENT_DELTA' // Applies event consequences
SET_LAST_GIG_STATS: 'SET_LAST_GIG_STATS' // Gig completion
ADVANCE_DAY: 'ADVANCE_DAY' // Triggers daily decay
```

---

## 4. POST OPTIONS STRUCTURE & MECHANICS

### Overview

- 26 post options in `postOptions.js`
- Categories: Performance, Drama, Commercial, Lifestyle
- Each has `condition()` and `resolve()` functions
- Resolution returns side effects including:
  - `controversyChange`: Direct crisis impact
  - `loyaltyChange`: Fan buffer impact
  - `followerChange`: Can be negative
  - `harmonyChange`: Band tension
  - `targetMember`: Named member affected

### High-Risk Posts (Controversy/Follower Loss)

```javascript
'drama_drunk_stream' // 70% success (+3000 followers), 30% disaster (-2000, +30 controversy)
'drama_leaked_dms' // 60% success (+4000 followers, +20 controversy), 40% fail (-1000, +40 controversy)
'perf_sound_guy_rant' // Fixed +1500 followers, +10 controversy
'drama_manufactured' // Fixed +5000 followers, -15 harmony, +25 controversy
'comm_crowdfund' // Fixed -500 followers, +5 controversy (desperation signal)
```

### Loyalty-Building Posts

```javascript
'drama_political_take' // -1000 followers (lose casuals), +20 loyalty (convert to hardcore)
'drama_van_breakdown' // +1500 followers, +10 loyalty (sympathy)
'drama_leak_demo' // +800 followers, +25 loyalty (massive hype)
```

---

## 5. CONTROVERSY MECHANICS DIAGRAM

```
Post Selection → Post Resolution → Controversy Change
                                 ↓
                        Current Controversy Level
                                 ↓
                    Daily Passive Decay (-1/day)
                                 ↓
                        Growth Calculation:

                        if controversyLevel >= 80:
                            baseGrowth *= (controversyLevel - 70) * 0.05
                            → At 80: 50% penalty
                            → At 100: 150% penalty (negative growth)
                                 ↓
                        Final Follower Count
                                 ↓
                    UI Display: "SHADOWBANNED" at 100+
                                 ↓
                    PR Manager Recovery (if unlocked):
                    -200€ → -25 Controversy
```

---

## 6. MISSING RECOVERY MECHANICS SUMMARY

| Recovery Type                | Implemented | Status                                |
| ---------------------------- | ----------- | ------------------------------------- |
| Passive daily decay          | ✅          | -1/day (very slow)                    |
| PR Manager buyout            | ✅          | -200€ to reduce -25                   |
| Loyalty shield               | ✅          | Reduces gig performance penalty       |
| Time-based reset             | ❌          | No "scandal expires" mechanic         |
| Event-driven redemption      | ❌          | No "comeback" events                  |
| Regional reputation repair   | ❌          | `reputationByRegion` unused           |
| Band member apology          | ❌          | No apology events                     |
| Charity/good deed events     | ❌          | Missing                               |
| Controversy-triggered quests | ❌          | No milestone events                   |
| Automatic sponsorship drop   | ❌          | Sponsors don't care about controversy |
| Venue blacklist mechanic     | ❌          | No booking restrictions               |
| Follower refund mechanism    | ❌          | Lost followers stay lost              |

---

## KEY FINDINGS

**What Works:**

1. Controversy level tracking and shadowban penalty at 100+
2. Loyalty buffer mechanic
3. Post-gig social posts with variable outcomes
4. Passive -1/day decay
5. PR Manager expensive recovery option
6. Trend system influences post weighting
   **Critical Gaps:**
7. **No triggered crisis events** - Only posts add controversy, no story events
8. **No recovery narrative** - No redemption arc, comeback tour, or apology mechanics
9. **No venue/regional consequences** - `reputationByRegion` exists but is never used
10. **No band member drama escalation** - Harmony decays but no "member quits" events
11. **No financial consequences** - Sponsorships/gigs unaffected by crisis
12. **No progression tipping points** - No milestone events at 50/80/100 controversy
13. **No interdependencies** - Crisis doesn't affect stamina, mood, van condition, etc.
14. **Slow recovery** - 100 days passive decay is punishing; no way to accelerate

---

## ABSOLUTE FILE PATHS FOR REFERENCE

- `/home/user/neurotoxic-game/src/utils/socialEngine.js` - Crisis mechanics
- `/home/user/neurotoxic-game/src/context/initialState.js` - State schema
- `/home/user/neurotoxic-game/src/context/gameReducer.js` - Action types & handlers
- `/home/user/neurotoxic-game/src/data/postOptions.js` - Post resolution logic
- `/home/user/neurotoxic-game/src/scenes/PostGig.jsx` - Crisis UI & flow
- `/home/user/neurotoxic-game/src/components/postGig/CompletePhase.jsx` - Crisis display
- `/home/user/neurotoxic-game/src/utils/simulationUtils.js` - Daily decay logic
- `/home/user/neurotoxic-game/src/ui/bandhq/DetailedStatsTab.jsx` - Controversy display
- `/home/user/neurotoxic-game/src/data/brandDeals.js` - Brand penalties
