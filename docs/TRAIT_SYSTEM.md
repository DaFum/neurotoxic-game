## TRAIT SYSTEM EXPLORATION REPORT

Based on my thorough analysis of the trait system across the codebase, here are the complete findings:

### 1. COMPLETE LIST OF ALL TRAIT IDs, NAMES, AND EFFECTS

**MATZE (Guitar)**

- **virtuoso** → "Virtuoso"
  - Effect: `hit_window_bonus` (+10% hit window)
  - Description: +10% Hit Window
  - Unlock Hint: Complete a solo without missing a note (100% accuracy = 0 misses in gig)
- **perfektionist** → "Perfektionist"
  - Effect: `score_bonus_high_acc` (+15% score if >85% hit rate)
  - Description: +15% Score if >85% Hit Rate
  - Unlock Hint: Hit 100% Accuracy in a single gig
  - Implementation: Applied in `useRhythmGameScoring.js` line 238 when accuracy > 85%
- **gear_nerd** → "Gear Nerd"
  - Effect: `discount_equip` (-20% equipment costs)
  - Description: -20% Equipment Costs
  - Unlock Hint: Purchase 5 different gear items
  - Implementation: Applied in `usePurchaseLogic.js` to reduce GEAR category costs by 20%
- **tech_wizard** → "Tech Wizard"
  - Effect: `score_bonus_tech` (+10% score on technical songs)
  - Description: +10% Score on Technical Songs
  - Unlock Hint: Get 100% Accuracy on a Technical song
  - Implementation: Applied in `simulationUtils.js` (calculateGigPhysics) when difficulty > 3; multipliers.guitar \*= 1.15
    **LARS (Drums)**
- **blast_machine** → "Blast Beat Machine"
  - Effect: `score_bonus_fast` (+25% score on fast sections)
  - Description: +25% Score on fast sections
  - Unlock Hint: Maintain a 50+ combo during a fast section (>160 BPM)
  - Implementation: Applied in `simulationUtils.js` when BPM > 160; multipliers.drums \*= 1.5
- **party_animal** → "Party Animal"
  - Effect: `hangover_risk` (Random hangover -Stamina but +Mood when drinking)
  - Description: Random hangover (-Stamina) but +Mood when drinking
  - Unlock Hint: Buy the beer fridge and drain it
  - Implementation: Applied in `simulationUtils.js` line 128; multipliers.drums \*= 1.1 (crowd loves energy)
- **showman** → "Showman"
  - Effect: `viral_bonus_show` (+20% virality bonus)
  - Description: +20% Virality Bonus
  - Unlock Hint: Perform 3 Stage Dives successfully
  - Implementation: Applied in `socialEngine.js` (calculateViralityScore); baseChance \*= 1.20
    **MARIUS (Bass/Vocals)**
- **bandleader** → "Bandleader"
  - Effect: `conflict_solver` (+50% chance to solve conflicts)
  - Description: +50% chance to solve conflicts
  - Unlock Hint: Successfully resolve 3 band conflicts
  - Implementation: Applied in `eventEngine.js` when conflict event check fails; 50% chance to save event as success
- **social_manager** → "Social Nerd"
  - Effect: `viral_bonus` (+15% viral chance)
  - Description: +15% Viral Chance
  - Unlock Hint: Reach 1000 followers on any platform
  - Implementation: Applied in `socialEngine.js` (calculateViralityScore); baseChance \*= 1.15
- **road_warrior** → "Road Warrior"
  - Effect: `fuel_discount` (-15% fuel consumption)
  - Description: -15% Fuel Consumption
  - Unlock Hint: Travel 5000km in total
  - Implementation: Applied in `economyEngine.js` (calculateFuelCost); fuelLiters \*= 0.85
- **melodic_genius** → "Melodic Genius"
  - Effect: `combo_bonus_slow` (+10% max combo on slow songs)
  - Description: +10% Max Combo on Slow Songs
  - Unlock Hint: Maintain a 30+ combo in a slow song (<120 BPM)
  - Implementation: Applied in `simulationUtils.js` when BPM < 120; hitWindows.bass \*= 1.15

---

### 2. HOW TRAITS ARE UNLOCKED (CONDITIONS/TRIGGERS)

**Unlock Pipeline: checkTraitUnlocks → applyTraitUnlocks → UNLOCK_TRAIT reducer**
Traits are unlocked through the following context types defined in `src/utils/unlockCheck.js`:
**A. GIG_COMPLETE (Post-Gig Performance)**

- `virtuoso` (Matze): `misses === 0` (0 misses in entire gig)
- `perfektionist` (Matze): `accuracy === 100` (exact 100% accuracy)
- `tech_wizard` (Matze): Technical song (`difficulty > 3`) + `accuracy === 100`
- `blast_machine` (Lars): Fast song (`bpm > 160`) + `maxCombo > 50`
- `melodic_genius` (Marius): Slow song (`bpm < 120`) + `maxCombo > 30`
  **B. TRAVEL_COMPLETE (After Travel Minigame)**
- `road_warrior` (Marius): `player.stats.totalDistance >= 5000`
  **C. PURCHASE (When Buying from HQ Shop)**
- `party_animal` (Lars): Purchase `hq_room_cheap_beer_fridge` OR item already in `player.hqUpgrades`
- `gear_nerd` (Matze): Own 5+ GEAR/INSTRUMENT category items (counted via `context.gearCount >= 5`)
  **D. SOCIAL_UPDATE (Daily Social Media Check)**
- `social_manager` (Marius): `Math.max(instagram, tiktok, youtube) >= 1000`
  **E. EVENT_RESOLVED (When Events Are Resolved)**
- `bandleader` (Marius): `player.stats.conflictsResolved >= 3`
- `showman` (Lars): `player.stats.stageDives >= 3`
  **Unlock Detection:**
- Checked via `hasTrait(member, traitId)` - returns false if member doesn't have trait
- Prevents duplicate unlocks by checking `member.traits.some(t => t.id === traitId)` before adding

---

### 3. HOW TRAITS AFFECT GAMEPLAY (WHERE bandHasTrait IS CHECKED AND WHAT IT DOES)

**A. SCORE & HIT WINDOW BONUSES (During Gig Performance)**
| Trait | Where Checked | Effect | Multiplier |
|-------|---------------|--------|-----------|
| `virtuoso` | `simulationUtils.js:calculateGigPhysics()` | Increases hit window | +10% wider window |
| `perfektionist` | `useRhythmGameScoring.js:238` | Bonus score if accuracy > 85% | +15% score multiplier |
| `gear_nerd` | `simulationUtils.js:calculateGigPhysics()` | Guitar reliability | +10% to `multipliers.guitar` |
| `tech_wizard` | `simulationUtils.js:calculateGigPhysics()` | Tech song bonus (diff > 3) | +15% to `multipliers.guitar` |
| `blast_machine` | `simulationUtils.js:calculateGigPhysics()` | Fast song bonus (BPM > 160) | +50% to `multipliers.drums` (1.5x) |
| `melodic_genius` | `simulationUtils.js:calculateGigPhysics()` | Slow song bonus (BPM < 120) | +15% to `hitWindows.bass` |
| `party_animal` | `simulationUtils.js:calculateGigPhysics()` | Crowd energy | +10% to `multipliers.drums` |
| `social_manager` | `simulationUtils.js:calculateGigPhysics()` | Crowd engagement | +10% to `multipliers.bass` |
| `bandleader` | `simulationUtils.js:calculateGigPhysics()` | Coordination bonus | +5ms to all hit windows (guitar/drums/bass) |
**B. SOCIAL MEDIA & VIRALITY**
| Trait | Where Checked | Effect |
|-------|---------------|--------|
| `social_manager` | `socialEngine.js:calculateViralityScore()` | Increases base virality chance | +15% multiplier |
| `showman` | `socialEngine.js:calculateViralityScore()` | Increases base virality chance | +20% multiplier |
| `party_animal` | `postOptions.js` & `brandDeals.js` | Referenced in post options for prank posts; helps with brand deals |
**C. ECONOMY & RESOURCE MANAGEMENT**
| Trait | Where Checked | Effect |
|-------|---------------|--------|
| `gear_nerd` | `usePurchaseLogic.js:getAdjustedCost()` | Reduces GEAR category purchase costs | 20% discount (cost _ 0.8) |
| `road_warrior` | `economyEngine.js:calculateFuelCost()` | Reduces fuel consumption | 15% discount (fuelLiters _ 0.85) |
**D. EVENT RESOLUTION**
| Trait | Where Checked | Effect |
|-------|---------------|--------|
| `bandleader` | `eventEngine.js` (resolveEventChoice) | 50% chance to save failed conflict checks | Converts failure to success |
**E. STAT TRACKING (For Future Effects)**

- `party_animal` mentioned in `simulationUtils.js:337` for daily stamina calculation context but effect not currently implemented
- Stats tracked: `conflictsResolved`, `stageDives`, `totalDistance` (used to check trait unlock conditions)

---

### 4. DATA STRUCTURE FOR TRAITS ON BAND MEMBERS

**In initialState.js:**

```javascript
DEFAULT_BAND_STATE = {
  members: [
    { ...CHARACTERS.MATZE, mood: 80, stamina: 100, traits: [] },
    { ...CHARACTERS.LARS, mood: 80, stamina: 100, traits: [] },
    { ...CHARACTERS.MARIUS, mood: 80, stamina: 100, traits: [] }
  ]
}
```

**Trait Object Structure (from CHARACTERS.js):**

```javascript
{
  id: 'trait_id_string',           // e.g., 'virtuoso'
  name: 'Display Name',             // e.g., 'Virtuoso'
  desc: 'Short Description',        // e.g., '+10% Hit Window'
  effect: 'effect_type_string',    // e.g., 'hit_window_bonus'
  unlockHint: 'How to unlock'      // e.g., 'Complete a solo without missing a note'
}
```

**Member Object Structure:**

```javascript
{
  name: 'Matze',
  role: 'Guitar',
  baseStats: { skill: 8, stamina: 7, charisma: 5, technical: 9, improv: 6 },
  mood: 80,
  stamina: 100,
  traits: [ /* array of trait objects from CHARACTERS[NAME].traits */ ],
  equipment: { guitar: '...', amp: '...' }
}
```

**Trait Lookup:**

- Traits array contains full trait definition objects (not just IDs)
- `hasTrait(member, traitId)` searches `member.traits` for `t.id === traitId`
- Traits are added to array via `applyTraitUnlocks()` which finds trait definition from `CHARACTERS[charKey].traits`

---

### 5. END-TO-END UNLOCK PIPELINE

**Flow:**

1. **Event Trigger** (Post-Gig, Travel Complete, Purchase, Daily Check, or Event Resolution)
   - Game context emits event with `{ type: 'GIG_COMPLETE', gigStats: {...} }`
2. **checkTraitUnlocks** (`unlockCheck.js`)
   - Evaluates conditions for all traits
   - Returns array of `[{ memberId, traitId }, ...]` objects that should be unlocked
   - Checks `!hasTrait(member, traitId)` to prevent duplicates
3. **applyTraitUnlocks** (`traitUtils.js`)
   - Receives unlocks array and current state
   - For each unlock:
     - Finds member by ID or name
     - Looks up trait definition in `CHARACTERS[member.name].traits`
     - Adds trait to `member.traits` array
     - Creates success toast notification
   - Returns `{ band: updatedBand, toasts: [...] }`
4. **Reducer Integration** (`gameReducer.js` or direct dispatch)
   - `handleAdvanceDay()` calls `checkTraitUnlocks()` and `applyTraitUnlocks()` for social updates
   - `handleCompleteTravelMinigame()` calls both for travel unlocks
   - `handleUnlockTrait()` explicitly handles `ActionTypes.UNLOCK_TRAIT` action
   - Merges returned `band` and `toasts` into state
5. **GameState Context** (`GameState.jsx`)
   - `unlockTrait(memberId, traitId)` callback dispatches `createUnlockTraitAction(memberId, traitId)`
   - Action flows through reducer back to UI
     **Key File Interactions:**

```
checkTraitUnlocks (unlockCheck.js)
    ↓
applyTraitUnlocks (traitUtils.js)
    ↓
gameReducer (gameReducer.js)
    ↓
GameStateProvider (GameState.jsx)
    ↓
UI/Scene components can call unlockTrait() directly
```

---

### 6. GAPS & MISSING TRAIT EFFECTS IDENTIFIED

**A. PARTIALLY IMPLEMENTED TRAITS:**

1. **party_animal** (Lars)
   - ✅ Implemented: Drum multiplier +10% during gigs
   - ✅ Implemented: Unlocked by purchasing `hq_room_cheap_beer_fridge`
   - ❌ **NOT IMPLEMENTED**: "Random hangover (-Stamina)" daily effect
   - ❌ **NOT IMPLEMENTED**: "+Mood when drinking" mechanic
   - Status: Comments note "Partially Implemented (Fridge interaction)" in characters.js
     **B. TRAITS WITH NO GAMEPLAY EFFECTS:**
     None identified - all traits have at least some implementation in the gig physics or economy calculations.
     **C. UNUSED TRAIT FIELDS:**

- All traits define `unlockHint` field but it's only used in character definitions
- No UI currently displays unlock hints to players during gameplay
- Could be shown in a Trait Codex or Progress tracker
  **D. MISSING SYNERGIES:**
- No multi-trait combinations or synergies
- No "relationship mechanics" between traits (noted as TODO in characters.js)
- Party_animal's "hangover" mechanic not tied to daily stamina decay system
  **E. MISSING IMPLEMENTATIONS:**
- **Perfektionist** tooltip says "+15% Score if >85% Hit Rate" but actually only triggers at >85% accuracy (not "if >=85%")
- **Blast Machine** description says "+25% Score" but actually multiplies by 1.5 (50% bonus, not 25%)
- **Melodic Genius** description says "+10% Max Combo" but actually provides +15% to hit window (not combo bonus)
- **Bandleader** description says "+50% chance" but implementation is fixed 50% save rate, not probabilistic addition
- **Road Warrior** effect is -15% fuel but description says "-15% Fuel Consumption" (accurate)
- **Social Manager** / "Social Nerd" naming inconsistency
  **F. TODO ITEMS IN CODE:**
  From characters.js:

```javascript
// TODO: Relationship Mechanics
// - Add `relationships` object to each character: { [otherMemberId]: score }
// - Add dynamic events that trigger based on low/high relationship scores
// - Traits like 'Grudge Holder' or 'Peacemaker' could affect these scores
```

---

### 7. TRAIT IMPLEMENTATION COMPLETENESS MATRIX

| Trait          | Unlock Check | Apply Function | Gig Effect            | Economy Effect    | Event Effect       | Status       |
| -------------- | ------------ | -------------- | --------------------- | ----------------- | ------------------ | ------------ |
| virtuoso       | ✅           | ✅             | ✅ (hit window)       | —                 | —                  | **COMPLETE** |
| perfektionist  | ✅           | ✅             | ✅ (score bonus 85%+) | —                 | —                  | **COMPLETE** |
| gear_nerd      | ✅           | ✅             | ✅ (guitar mult)      | ✅ (20% discount) | —                  | **COMPLETE** |
| tech_wizard    | ✅           | ✅             | ✅ (tech songs)       | —                 | —                  | **COMPLETE** |
| blast_machine  | ✅           | ✅             | ✅ (fast songs)       | —                 | —                  | **COMPLETE** |
| party_animal   | ✅           | ✅             | ✅ (drum mult)        | —                 | ⚠️ (partial)       | **PARTIAL**  |
| showman        | ✅           | ✅             | —                     | —                 | ✅ (virality)      | **COMPLETE** |
| bandleader     | ✅           | ✅             | ✅ (hit window)       | —                 | ✅ (conflict save) | **COMPLETE** |
| social_manager | ✅           | ✅             | ✅ (bass mult)        | —                 | ✅ (virality)      | **COMPLETE** |
| road_warrior   | ✅           | ✅             | —                     | ✅ (fuel -15%)    | —                  | **COMPLETE** |
| melodic_genius | ✅           | ✅             | ✅ (hit window)       | —                 | —                  | **COMPLETE** |

---

This comprehensive trait system enables character progression and creates meaningful gameplay choices through unlockable passive bonuses tied to specific playstyle achievements.
