## 1. SIMULATION UTILS (src/utils/simulationUtils.js)

### Daily Update System

The `calculateDailyUpdates()` function applies the following changes every day:
**Financial:**

- Base daily cost: 25€ + (5€ × band_size)
- **YouTube Passive Perk**: -10€ per 10k subscribers (gains money)
- **Newsletter Merch Perk**: 30% chance daily to gain -(newsletter/100 × 5)€
  **Harmony Decay:**
- **Neutral drift**: Moves 2 points toward 50 (equilibrium)
- **Ego System drain**: -2 harmony per day if `egoFocus` is active, 20% daily chance to clear ego
- **High controversy** (≥50): Additional -1 harmony per day
- **High harmony regen** (>60): Restores +3 stamina to band members
  **Stamina Decay:**
- Base loss: -5 per day (life on road is tiring)
- Recovery: +3 if harmony > 60 (band morale boost)
- **Instagram Gear Endorsement Perk**: +2 if followers ≥ 10k
  **Social Decay:**
- Viral countdown: -1 per day
- Controversy decay: -1 per day (passive cooldown)
- **Sponsor trigger**: Activates if Instagram ≥ 5k (10% chance), drops if falls below 5k or controversy ≥ 80
- **TikTok surge perk**: +1 viral token if TikTok ≥ 10k (5% chance)
- **Follower decay**: After 3+ days without activity, all platforms decay by 1% per day
  **Van Degradation:**
- Base condition loss: -2 per day
- Breakdown chance scales with condition:
  - Good (≥60): baseline multiplier 1.0x
  - Worn (30-60): 1.6x multiplier
  - Critical (<30): 3.0x multiplier
    **HQ Upgrades Active Effects:**
- **Coffee machine**: +2 mood daily
- **Beer fridge**: +1 mood, +2 for Lars if party_animal (30% stamina loss risk)
- **Sofa**: +3 stamina daily
- **Old couch**: +1 stamina daily
- **Soundproofing**: +1 harmony daily
- **Harmony regen travel**: +2 harmony daily

### Gig Physics Calculation

The `calculateGigPhysics()` function derives gameplay modifiers based on band state:
**Hit Windows** (base 150ms + skill × 5ms):

- **Virtuoso trait** (Matze): +10% to guitar hit window
- **Bandleader trait** (Marius): +5ms to all lanes
- **Melodic Genius trait** (Marius): +15% to bass hit window on slow songs (<120 BPM)
  **Speed Modifier:**
- Normal: 1.0x
- Low stamina (<30 avg): 0.8x drag effect
  **Score Multipliers:**
- **Blast Machine** (Lars, BPM >160): 1.5x drums
- **Tech Wizard** (Matze, difficulty >3): 1.15x guitar
- **Melodic Genius** (Marius, BPM <120): +15% bass hit window (simulates flow)
- **Party Animal** (Lars): 1.1x drums
- **Gear Nerd** (Matze): 1.1x guitar
- **Social Manager** (Marius): 1.1x bass

### Gig Modifiers

The `getGigModifiers()` function applies harmony and member-state effects during performance:
**Harmony Effects:**

- **High harmony (>80)**: +20ms hit window, enables "TELEPATHY" effect
- **Low harmony (<30)**: Enables note jitter, creates "DISCONNECT" effect
  **Member Status:**
- **Matze mood <20**: Guitar score ×0.5 (GRUMPY)
- **Lars stamina <20**: Drums speed ×1.2 faster (RUSHING TEMPO)

---

## 2. BAND MEMBER DATA (src/data/characters.js)

### Member Structure

Each member has:

```javascript
{
  name: string,
  role: 'Guitar' | 'Drums' | 'Bass/Vocals',
  baseStats: { skill, stamina, charisma, technical, improv, composition },
  traits: [ { id, name, desc, effect, unlockHint }, ... ],
  equipment: { instrument_type: string, ... },
  mood: 0-100,        // Currently drifts toward 50
  stamina: 0-100,     // Decays on tour
  egoFocus: null      // Only in social state
}
```

### Base Stats (Starting Values)

**Matze (Guitar):**

- skill: 8, stamina: 7, charisma: 5, technical: 9, improv: 6
  **Lars (Drums):**
- skill: 9, stamina: 8, charisma: 7, technical: 7, improv: 9
  **Marius (Bass/Vocals):**
- skill: 7, stamina: 6, charisma: 8, technical: 7, composition: 7

### Starting State

- mood: 80 (will drift toward 50)
- stamina: 100 (decays -5 daily)
- traits: [] (empty until unlocked)

---

## 3. TRAIT SYSTEM (docs/TRAIT_SYSTEM.md)

### All Traits (11 Total)

**Matze (Guitar) — 4 traits:**

1. **virtuoso** — +10% hit window (Unlock: 0 misses in gig)
2. **perfektionist** — +15% score if >85% accuracy (Unlock: 100% accuracy in gig)
3. **gear_nerd** — -20% equipment costs (Unlock: own 5+ gear items)
4. **tech_wizard** — +10% score on technical songs (Unlock: 100% accuracy on difficulty >3)
   **Lars (Drums) — 3 traits:**
5. **blast_machine** — +50% score on fast sections (BPM >160) (Unlock: 50+ combo in fast song)
6. **party_animal** — Risky drunk behavior (Unlock: purchase beer fridge)
   - ✅ Implemented: +10% drum multiplier, +2 mood/stamina risk interaction
   - ❌ Missing: "Random hangover" daily mechanic
7. **showman** — +20% virality bonus (Unlock: 3 stage dives)
   **Marius (Bass) — 4 traits:**
8. **bandleader** — +50% chance to solve conflicts (Unlock: resolve 3 conflicts)
9. **social_manager** (mislabeled "Social Nerd") — +15% viral chance (Unlock: 1000+ followers)
10. **road_warrior** — -15% fuel consumption (Unlock: 5000+ km traveled)
11. **melodic_genius** — +10% combo on slow songs (Unlock: 30+ combo in BPM <120)

### Trait Unlock Pipeline

1. Game event fires (post-gig, travel, purchase, daily, event)
2. `checkTraitUnlocks()` evaluates all conditions
3. `applyTraitUnlocks()` adds unlocked traits to member.traits array
4. Toast notification displays

### Integration Points

- **During gigs**: `simulationUtils.calculateGigPhysics()` checks traits
- **During shopping**: `usePurchaseLogic.js` applies gear_nerd discount
- **During travel**: `economyEngine.js` applies road_warrior fuel reduction
- **During events**: `eventEngine.js` applies bandleader conflict solving
- **During social**: `socialEngine.js` applies social_manager/showman virality

---

## 4. UPGRADE/HQ SYSTEM

### HQ Items (src/data/hqItems.js) — 20+ Items

**HQ Room Furniture** (Unlock passive daily buffs):

- **Coffee machine** (400€): +2 mood/day (effect: `unlock_hq`)
- **Sofa** (600€): +30 stamina on visit (effect: `unlock_hq`)
- **Old couch** (100€): +10 stamina on visit (effect: `unlock_hq`)
- **Beer fridge** (200€): +5 mood, triggers party_animal interaction (effect: `unlock_hq`)
- **Soundproofing** (100€): +1 harmony/day (effect: `unlock_hq`)
- **Cat "Satan"** (50€): +10 harmony (effect: `stat_modifier`)
- **Beer pipeline** (2000€): +20 harmony (effect: `stat_modifier`)
- **PR Manager contract** (500€): Unlocks "Spin story" crisis option (effect: `unlock_hq`)
  **Instruments** (Performance bonuses):
- **Custom 8-String guitar** (2500€): -15% guitar difficulty
- **Axis pedals** (2200€): +20% drum score
- **Flying V guitar** (1200€): -5% crowd decay
- **SansAmp bass** (1800€): -10% crowd decay
  **Van Upgrades** (Fame currency):
- **Suspension** (500 fame): -20% breakdown chance
- **Mobile studio** (1000 fame): Harmony regen while traveling
- **Storage** (800 fame): +10 inventory slots
- **Motor tuning** (1500 fame): -20% fuel consumption
  **Consumables & Gear**:
- Merch restocks (shirts, hoodies, patches, vinyl, CDs)
- Repair materials (strings, cables, drum parts)
- Food (canned food, bulk beer)
- Bizarre items (lucky rabbit foot, voodoo doll, theremin)

### Upgrades Database (src/data/upgrades.js) — 10 Legacy Upgrades

Mostly superseded by HQ_ITEMS but still relevant:

- **van_suspension** (500 fame): -20% breakdown chance
- **van_sound_system** (1000 fame): Band recovers harmony while traveling
- **van_storage** (800 fame): Inventory +2 slots
- **guitar_custom** (1500 fame): -15% guitar difficulty
- **drum_trigger** (1500 fame): +20% drum score
- **bass_sansamp** (1200 fame): -10% crowd decay
- **social_bot** (600 fame): Passive +5 followers/day (becomes `passiveFollowers` stat)
- **label_contact** (2000 fame): +1000 fame immediately

### Purchasing Logic (usePurchaseLogic.js)

- **Currency**: money or fame (hqItems use both)
- **Gear Nerd discount**: -20% on GEAR/INSTRUMENT categories
- **One-time purchases**: Most items can't be bought twice
- **Disabled items**: Some items disabled after purchase (e.g., upgrades)

---

## 5. SOCIAL MEDIA SYSTEM

### Social State Fields (DEFAULT_SOCIAL_STATE)

```javascript
{
  instagram: 228,         // Followers
  tiktok: 64,            // Followers
  youtube: 14,           // Followers
  newsletter: 0,         // Subscribers (high-value, low-volume)
  viral: 0,              // Viral token counter (decays -1/day)
  lastGigDay: null,      // Tracks activity for decay
  controversyLevel: 0,   // 0-100+, shadowban at ≥80
  loyalty: 0,            // Buffer against bad performance
  egoFocus: null,        // Member name spotlighted (harmony -2/day)
  sponsorActive: false,  // Brand deal active
  trend: 'NEUTRAL',      // 'NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME'
  activeDeals: []        // List of brand deals with remainingGigs
}
```

### Post Options (src/data/postOptions.js) — 30+ Options

**Performance & Stage Antics:**

- **Instrument Destruction Clip** (TikTok): +2500 followers, -300€ risk
- **Acoustic Cover** (YouTube): +500 followers, +5 harmony (clears ego)
- **Ego Flex** (Instagram): +1200 followers, vocalist +15 mood, harmony -5, triggers egoFocus
- **Sound Guy Rant** (TikTok): +1500 followers, -5 stamina all, +10 controversy
- **Moshpit Chaos** (TikTok): +2000 followers (conditional on stage_diver event)
- **Technical Playthrough** (YouTube): +800 followers (conditional on high score or virtuoso)
- **Band Selfie** (Instagram): +300 followers, clears ego
  **Drama Posts:**
- **Drunk Afterparty Stream** (TikTok): 70% success (+3000), 30% cancellation (-2000, -20 harmony, +30 controversy)
- **Political Hot Take** (Newsletter): -1000 mainstream, +20 loyalty (converts casuals to hardcore)
- **Van Breakdown Rant** (Instagram): +1500 followers, +10 loyalty
- **Leaked Demo** (Newsletter): +800 followers, +25 loyalty, -10 harmony (manager pissed)
- **Manufactured Drama** (TikTok): +5000 followers, -15 harmony, +25 controversy
- **Crowdsurfing Fail** (Instagram): 50/50 RNG, ±1000 followers
- **Leaked DMs** (TikTok): 60% viral (+4000, +20 controversy), 40% backlash (-1000, +40 controversy, -20 harmony)
  **Commercial:**
- **Shameless Sponsorship** (Instagram): +500€, -10 loyalty (requires 5k+ followers)
- **Tour Merch Drop** (Newsletter): +loyalty×10€ (max 1000€), burns 50% loyalty
- **Crowdfunding Begging** (YouTube): +300€, -500 followers, +5 controversy (if money <100)
- **Gear Review** (YouTube): +1500 followers, +100€, target mood +20 (requires golden_pick)

### Post Mechanics

**Generation** (`generatePostOptions()`):

- Filters POST_OPTIONS by condition function
- Assigns weights (forced sponsor posts, trend matching bonus)
- Selects 3 options via weighted RNG
  **Resolution** (`resolvePost()`):
- Executes post option's resolve function
- Returns: { success, followers, money, harmony, mood, stamina, controversy, loyalty, egoFocus changes, trait unlocks }
  **Virality Calculation** (`calculateViralityScore()`):
- Base: 5%
- Performance: ×2.0 if >90, ×1.5 if >75
- Venue: ×1.5 if Kaminstube (historical)
- Events: ×2.0 for stage_diver, ×3.0 for influencer_spotted
- **social_manager trait**: ×1.15
- **showman trait**: ×1.20
- Cap: 90%

### Follower Growth Formula

```javascript
effectivePerf = Math.min(100, performance + loyalty × 0.5)
baseGrowth = Math.max(0, effectivePerf - 50) × 0.5
if (controversy ≥ 80) baseGrowth *= -(controversy - 70) × 0.05  // Shadowban penalty
viralBonus = isViral ? (followers × 0.1) + 100 : 0
return floor((baseGrowth × platformMultiplier) + viralBonus)
```

**Platform Multipliers:**

- Instagram: 1.0x
- TikTok: 1.2x (fast growth)
- YouTube: 0.8x (slower but higher quality)
- Newsletter: Special (lower volume, higher value)

### Social Media Trends

Daily trend generation picks from:

- **NEUTRAL**: No modifiers
- **DRAMA**: Posts with Drama category get +10.0 weight
- **TECH**: Commercial/gear posts get +10.0 weight
- **MUSIC**: Performance posts get +10.0 weight
- **WHOLESOME**: Lifestyle/safe posts get +10.0 weight

---

## KEY CONCEPTS

### "EGO" System

**Not a member stat**, but a **social media mechanic**:

- `social.egoFocus` = member name (string) or null
- Triggered by: "Ego Flex" post option
- Effect: -2 harmony/day + increases drama potential
- Cleared by: Acoustic cover post, wholesome band dinner post, or passive 20% daily decay

### How Harmony Affects Gameplay

1. **Gig Performance**: >80 gives +20ms hit window (easier), <30 jitters notes (harder)
2. **Daily Decay**: Drifts toward 50 (equilibrium)
3. **Ego drain**: -2 per day when egoFocus active
4. **High controversy**: -1 additional per day
5. **Stamina recovery**: +3 if >60 (morale boost)
6. **HQ perks**: Multiple items grant +1 to +20 per day

### Controversy & Shadowban

- **Controversy Level** (0-100+):
  - <20: Safe zone
  - 20-50: Minor drama events trigger
  - 50-80: Major events trigger, sponsor drops possible
  - ≥80: Algorithmic shadowban active, negative follower growth
- **Passive decay**: -1 per day (slow recovery)
- **Sponsorships**: Automatically drop if controversy ≥80

---

## SUMMARY TABLE

| System            | Key Fields                             | Update Frequency                               | Integration                            |
| ----------------- | -------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| **Harmony**       | band.harmony (0-100)                   | Daily drift (-/+2 toward 50)                   | Gig hit windows, mood recovery         |
| **Stamina**       | member.stamina (0-100)                 | Daily decay (-5), recovery (+3 if harmony >60) | Gig scroll speed, member mood          |
| **Mood**          | member.mood (0-100)                    | Daily drift (-/+2 toward 50)                   | Gig score modifiers                    |
| **Ego**           | social.egoFocus (null\|name)           | Post-gig social mechanic                       | Harmony drain -2/day                   |
| **Controversy**   | social.controversyLevel (0-100+)       | Event triggers, passive decay (-1)             | Follower growth penalty, sponsor drops |
| **Followers**     | instagram, tiktok, youtube, newsletter | Per-gig social posts                           | Trends, perks, viral events            |
| **Traits**        | band.members[].traits[]                | Unlocked post-gig/travel/purchase              | Gig physics, economy, events           |
| **Van Condition** | player.van.condition (0-100)           | Daily decay (-2), breakdown risk               | Travel interruption events             |

This represents the complete simulation, character, and social ecosystem of NEUROTOXIC v3.0.
