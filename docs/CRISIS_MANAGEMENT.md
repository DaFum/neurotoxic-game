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
  activeDeals: [],
  reputationCooldown: 0 // ← Blocks reputation-gated posts, decays -1/day
}

// Also in player.stats:
consecutiveBadShows: 0, // ← Tracks bad show streaks for 'prove yourself' quest
proveYourselfMode: false // ← Restricts venue booking to ≤150 capacity

// Root state:
venueBlacklist: [] // ← Venue names banned from booking
activeQuests: [] // ← Active timed quests (apology tour, ego management, etc.)
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

## 2. CRITICAL GAPS & MISSING FEATURES (RESOLVED)

_Note: The features listed below have been resolved via updates to `crisis.js`, `simulationUtils.js`, `gameReducer.js`, and `useTravelLogic.js`._

### A. Explicit "Bad Review" or "Poor Performance" Events

**Missing:**

- No negative feedback event from venues after bad shows
- No cascading failure scenarios (e.g., "If you play badly 3 times, venues stop booking you")

**Implemented:**

- The `crisis_poor_performance` event triggers when your gig score drops below 30%.
- A poor gig instantly penalizes the band's regional `reputationByRegion` in that city by -10.
- `useTravelLogic` actively checks `reputationByRegion`. If it falls to -30 or below, the local venues completely block the band from booking entirely.
- **Consequence system**: 3 consecutive bad shows trigger `quest_prove_yourself`, restricting the band to venues with capacity ≤150 until they play 4 good shows.

### B. Controversy-Specific Events

**Missing crisis events:**

- No "bandmate caught doing something stupid" consequences
- No "apology tour" mechanic to recover
- No "cancel culture backlash" minigames or quests

**Implemented:**

- The `crisis_leaked_story` event triggers specifically from high controversy (>= 60).
- `crisis_online_backlash` and `crisis_bad_review` are specifically linked to high controversy/low harmony.
- These events provide choices that balance losing fans and money vs absorbing the hate.

### C. Recovery Events & "Redemption Arc"

**Missing:**

- No "comeback album" event
- No "leaked good-deed footage" counter-scandal
- No time-locked reputation repair quests

**Implemented:**

- The `crisis_redemption_charity` event acts as a reputation repair path that exchanges potential revenue for massive controversy reduction (-25).
- Some high-risk crisis options allow you to publicly apologize with a Charisma check (e.g. `crisis_shadowban_scare` 8+ Charisma check).
- **Consequence events** add 6 new narrative events in `consequences.js`: cancel culture quest, bandmate scandal, comeback album, and more. These set `story_flag` triggers that dispatch timed quests from PostGig.

### D. Follower Loss Events

**Implemented:**

- High controversy leads to event-driven follower loss situations, rather than just post penalties.
- `crisis_mass_unfollow` explicitly drops loyalty and harmony as a dedicated hate-campaign.
- Hitting 80+ controversy severely limits algorithmic growth and triggers the `crisis_notice_80` algorithmic shadowban penalty warning.

### E. Loyalty-Specific Crisis Mechanics

**Missing:**

- No "loyalty converts to merchandise sales during controversy"
- No "loyalty shields you from being dropped by venues" mechanics

**Implemented:**

- `crisis_leaked_story` specifically utilizes a _Loyalty Shield_ option, where you can let true fans defend you, exchanging `loyalty` to effectively drop `controversyLevel`.
- Loyalty buffers the mechanical performance drops as previously designed, but now carries event consequences.
- **Economy integration**: `calculateTicketIncome` now accepts a `context` object with `controversyLevel`, `regionRep`, `loyalty`, and `discountedTickets`. Loyalty over 20 generates a merch buy bonus during high controversy (via `calculateMerchIncome`).

### F. Ego Crisis Events

**Missing:**

- No "ego generates scandal" link
- No "manage egos to prevent breakup" quest

**Implemented:**

- `crisis_ego_clash` specifically requires an active `egoFocus` on a band member alongside low band `harmony` (<40).
- This event creates a screaming match that escalates to severe harmony damage unless passed via a Charisma check or ignored (causing online leaks).

### G. Financial Consequences of Crisis

**Missing:**

- No "ticket sales collapse" event when controversy is high
- Gig financials are determined only by score & capacity, NOT by band reputation

**Implemented:**

- `crisis_sponsor_ultimatum` triggers an automatic event when controversy surpasses 80, potentially costing massive cash or voiding deals entirely.
- Passive checks in `calculateDailyUpdates` now enforce a constant 20% risk per day of your active sponsor dropping the band if controversy hits >=80.
- `crisis_venue_cancels` costs the band cancellation fees if controversy is >65.

### H. Stage-Gated Crisis Recovery

**Missing:**

- No "prove yourself tour" where you must play small venues to rebuild
- No "reputation cooldown" between crisis posts

**Implemented:**

- "Limited bookings" mechanically implemented through the regional venue blacklisting. Falling to -30 in a region completely locks it out until time/events can recover the standing.
- **Prove Yourself Mode**: After 3 consecutive bad shows, the band enters `proveYourselfMode`, restricting venue access to ≤150 capacity until 4 good shows are completed.
- **Reputation Cooldown**: `reputationCooldown` blocks reputation-gated social posts and decays at -1/day.

### I. Crisis Interactions with Other Systems

**Missing:**

- Member departure risk
- Van breakdown chance
- HQ upgrade availability
- Setlist restrictions
- Minigame difficulty

**Implemented:**

- Crisis directly affects `band.harmony` and `band.members[0].mood`. Within `calculateDailyUpdates`, tipping the `controversyLevel` to 50 or above triggers an increased, faster daily decay on member morale and inter-band harmony.

### J. "Controversy Tipping Points" Events

**Missing:**

- No "point of no return" scenario

**Implemented:**

- Milestone warning events were introduced for key thresholds:
  - `crisis_notice_50`: Warning of backlash and faster harmony drift.
  - `crisis_notice_80`: Algorithmic slowdown begins and sponsors panic.
  - `crisis_notice_100`: Shadowbanned officially confirmed via event triggers.

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

## 6. RECOVERY MECHANICS SUMMARY

| Recovery Type                | Implemented | Status                                                           |
| ---------------------------- | ----------- | ---------------------------------------------------------------- |
| Passive daily decay          | ✅          | -1/day (very slow)                                               |
| PR Manager buyout            | ✅          | -200€ to reduce -25                                              |
| Loyalty shield               | ✅          | Event `crisis_leaked_story` burns loyalty to shield controversy  |
| Time-based reset             | ❌          | No "scandal expires" mechanic                                    |
| Event-driven redemption      | ✅          | `crisis_redemption_charity`, apologies via PR                    |
| Regional reputation repair   | ✅          | `reputationByRegion` tracks performance impacts                  |
| Band member apology          | ✅          | Events offer apology options (e.g. `crisis_bad_review`)          |
| Charity/good deed events     | ✅          | `crisis_redemption_charity` event lowers controversy             |
| Controversy-triggered quests | ✅          | Tipping point events at 50/80/100 (`crisis_notice_*`)            |
| Automatic sponsorship drop   | ✅          | 20% daily chance to drop sponsor when controversy >= 80          |
| Venue blacklist mechanic     | ✅          | Venues refuse bookings if regional reputation <= -30             |
| Follower refund mechanism    | ❌          | Lost followers stay lost                                         |
| Loyalty → merch bonus        | ✅          | `calculateMerchIncome` adds `loyaltyBuyBonus` during controversy |
| Prove Yourself quest         | ✅          | 3 bad shows → restricted to small venues until 4 good shows      |
| Reputation cooldown          | ✅          | Blocks reputation-gated posts, decays -1/day                     |
| Ego → scandal link           | ✅          | 12% daily chance `egoFocus` triggers bandmate scandal event      |

---

## KEY FINDINGS

**What Works:**

1. Controversy level tracking and shadowban penalty at 100+
2. Loyalty buffer mechanic
3. Post-gig social posts with variable outcomes
4. Passive -1/day decay
5. PR Manager expensive recovery option
6. Trend system influences post weighting

**Resolved Gaps (Implemented in `crisis.js` & `simulationUtils.js`):**

7. **Triggered crisis events** - New `crisis_bad_review`, `crisis_online_backlash`, `crisis_mass_unfollow` events.
8. **Recovery narrative** - `crisis_redemption_charity` and various apologies offer major controversy reduction.
9. **Venue/regional consequences** - `reputationByRegion` penalizes poor gigs (<30 score) and blocks venue bookings at <=-30.
10. **Band member drama** - `crisis_ego_clash` triggers escalating fights relying on Charisma to resolve.
11. **Financial consequences** - `crisis_venue_cancels`, `crisis_sponsor_ultimatum`, plus a daily risk of sponsors dropping at >=80 controversy.
12. **Progression tipping points** - Milestone warning events (`crisis_notice_50/80/100`) trigger at thresholds.
13. **Interdependencies** - High controversy (>=50) increases daily harmony and mood drains.

---

## ABSOLUTE FILE PATHS FOR REFERENCE

- `src/utils/socialEngine.js` - Crisis mechanics
- `src/context/initialState.js` - State schema
- `src/context/gameReducer.js` - Action types & handlers
- `src/data/postOptions.js` - Post resolution logic
- `src/scenes/PostGig.jsx` - Crisis UI & flow
- `src/components/postGig/CompletePhase.jsx` - Crisis display
- `src/utils/simulationUtils.js` - Daily decay logic
- `src/ui/bandhq/DetailedStatsTab.jsx` - Controversy display
- `src/data/brandDeals.js` - Brand penalties
