### 1. FULL ECONOMY CALCULATION CHAIN (Input → Output)

**File:** `/home/user/neurotoxic-game/src/utils/economyEngine.js`
The gig financials calculation is driven by `calculateGigFinancials()` which processes:

#### **INPUTS:**

- `gigData` - Venue object with: `capacity`, `price` (ticket price), `pay` (guarantee), `diff` (difficulty 1-5)
- `performanceScore` - 0-100 (converted from raw gig score via formula: `Math.min(100, Math.max(30, score / 500))`)
- `modifiers` - Boolean flags for: `promo`, `soundcheck`, `merch`, `catering`, `guestlist`
- `bandInventory` - Merch stock: shirts, hoodies, cds, patches, vinyl
- `playerState` - Player object for fame reading
- `gigStats` - Performance stats: misses, perfectHits, peakHype, maxCombo

#### **INCOME STREAMS:**

1. **Ticket Sales**
   - Base fill: 30% of capacity
   - Fame scaling: Fame ÷ (capacity × 10) factors in
   - Modifiers: +15% promo boost, +10% soundcheck boost
   - Price sensitivity: -2% per Euro above €15 (mitigated by fame)
   - **Formula:** `fillRate = baseDrawRatio + fameRatio × 0.7`
   - **Clamped:** 10% - 100% of capacity
   - **Revenue:** ticketsSold × ticket price
2. **Venue Split / Promoter Cut** (deducted as expense)
   - Difficulty 3: 20% of door
   - Difficulty 4: 40% of door
   - Difficulty 5+: 70% of door
3. **Guarantee** (fixed fee from venue)
   - Direct income based on venue's `pay` field
4. **Merch Sales**
   - Base buy rate: 15% + (performanceScore/100 × 20%) = **15-35%** of attendees
   - Performance bonuses:
     - **S-Rank (≥95):** 1.5× multiplier
     - **Bad Show (<40):** 0.5× multiplier
   - Miss penalty: -1.5% per miss (capped at 50% of buyRate)
   - Merch modifier: +10% boost
   - **Limited by inventory:** Only sells what's in stock
   - **Costs:** €10 COGS per unit, €25 avg selling price
   - **Net margin:** €15 per sale
5. **Bar Cut**
   - 15% of (ticketsSold × €5) base bar revenue
6. **Sponsorship Bonuses**
   - **Perfect Set Bonus:** +€200 (0 misses)
   - **Max Hype Bonus:** +€150 (peakHype ≥ 100)

#### **EXPENSES:**

1. **Modifier Costs** (from MODIFIER_COSTS)
   - Catering: €20
   - Promo: €30
   - Merch: €30
   - Soundcheck: €50
   - Guestlist: €60
2. **Merch Restock Cost**
   - €10 × units sold (COGS)

#### **NET OUTPUT:**

- `report.net = report.income.total - report.expenses.total`
- Money is **clamped to ≥0** after application
- **Bankruptcy trigger:** If money ≤ 0 AND netIncome < 0

---

### 2. VENUE DATA STRUCTURE

**File:** `/home/user/neurotoxic-game/src/data/venues.js`
Contains 47 venues across Germany. Each venue object:

```javascript
{
  id: string,              // Unique identifier (e.g., 'leipzig_arena')
  name: string,            // Display name (e.g., 'QB Arena')
  x: number,              // X coordinate (0-100, map space)
  y: number,              // Y coordinate (0-100, map space)
  type: 'HOME' | 'VENUE', // Type identifier
  capacity: number,       // 0 (home) to 6500 (arena)
  pay?: number,           // Guarantee in euros (0 for home, 300-16000 range)
  diff?: number,          // Difficulty 1-5 (1=easy, 5=hard)
  price?: number          // Ticket price in euros (0-50 range)
}
```

**Key Venues:**

- **Home:** Stendal Proberaum (capacity 0)
- **Tier 1 (Easy, diff 2):** Goldgrube (€500), Distille (€300), MTC (€400)
- **Tier 2 (Medium, diff 3):** Most clubs (€550-€1600)
- **Tier 3 (Hard, diff 4):** Larger venues (€1250-€2000)
- **Tier 4 (Very Hard, diff 5):** Arena/Festival venues (€2500-€16000)
- **Festival Assignment:** Auto-assigned to venues with capacity ≥1000 (8 venues)

---

### 3. "BAD SHOW" DETECTION

**Location 1:** `/home/user/neurotoxic-game/src/utils/economyEngine.js` (line 120)

```javascript
if (performanceScore < 40) {
  buyRate *= 0.5 // Merch sales cut in half
}
```

**Location 2:** `/home/user/neurotoxic-game/src/context/gameReducer.js` (line 560-562)

```javascript
if (score < 30) {
  nextReputation[location] = (nextReputation[location] || 0) - 10
  logger.warn('Regional reputation loss due to poor gig performance (-10)')
}
```

**Thresholds:**

- **Score < 30:** Regional reputation penalty (-10)
- **Score < 40:** Merch sales halved
- **Score ≥ 95:** Merch sales boosted 1.5×
  **How Performance Score is Calculated:**
- Raw `score` from rhythm game (accumulated points)
- PostGig converts: `perfScore = Math.min(100, Math.max(30, rawScore / 500))`
- So score range 0→15000 maps to perfScore 30→100
  **Key Metrics Affecting Performance:**
- **Accuracy:** `(perfectHits / (perfectHits + misses)) × 100%`
- **Misses:** Penalize merch sales directly
- **Combo/Hype:** Bonus sponsorship at peakHype ≥ 100

---

### 4. REPUTATION SYSTEM

**File:** `/home/user/neurotoxic-game/src/context/gameReducer.js`

- **Storage:** `state.reputationByRegion` (object with region/city keys)
- **Trigger:** When setting `lastGigStats` after gig completion
- **Rule:** If `score < 30` → reputation[location] -= 10
- **Usage:** (Not currently visible in economy calculations, likely for future features like venue access, NPC reactions)

---

### 5. OVERWORLD VENUE DISPLAY & BOOKING FLOW

**File:** `/home/user/neurotoxic-game/src/scenes/Overworld.jsx`

#### **Node Generation & Visibility:**

- **Map Generator** (`mapGenerator.js`): Creates procedural 10-layer DAG
- Nodes spawn **1-2 layers ahead** of player's current position
- **Visibility States** (`mapUtils.js`):
  - `visible` - Current layer + 1
  - `dimmed` - Current layer + 2
  - `hidden` - Beyond layer + 2

#### **Node Types & Unlocking:**

- **START:** Home base (Stendal) - always accessible
- **GIG:** Regular venues
- **FESTIVAL:** Venues with capacity ≥1000
- **REST_STOP:** Healing stops
- **SPECIAL:** Random encounters
- **FINALE:** Leipzig Arena (layer 10)

#### **Booking/Travel Flow:**

1. Player clicks a **visible, connected node**
2. Node must satisfy: `isConnected(currentNodeId, targetNodeId)` (DAG connection)
3. **handleTravel()** validates:
   - Sufficient fuel for travel (via `calculateTravelExpenses()`)
   - Sufficient money for food/gas
   - Band harmony > 0
4. If REST_STOP: Band stamina/mood restored (+20 stamina, +10 mood)
5. If GIG/FESTIVAL/FINALE: Auto-calls `startGig(venue)` → scene change to PREGIG

#### **Travel Costs:**

- **Fuel:** 12 liters per 100km (plus 20km base)
- **Distance:** `sqrt((x1-x2)² + (y1-y2)²) × 5 + 20` km
- **Food:** €24 for band of 3
- **Total cost:** Food only (fuel is optional refuel action)

---

### 6. POSTGIG SCENE SEQUENCE

**File:** `/home/user/neurotoxic-game/src/scenes/PostGig.jsx`
**Flow:**

1. **REPORT Phase** - Display financials breakdown (income/expenses/net)
2. **SOCIAL Phase** - Select social media post + platform
3. **DEALS Phase** - Accept/reject brand sponsorship offers (up to 3 per gig)
4. **COMPLETE Phase** - Summary; money updated, fame gained, return to OVERWORLD
   **Fame Gain Formula:**

```javascript
fameGain = 50 + Math.floor(perfScore × 1.5)
// So perfScore 30→100 = fame +95→+200
```

**Viral Bonuses:**

- Gig stats (high hype, perfect accuracy) trigger virality
- Social platform growth applied organically
- Brand deals offer upfront money + loyalty penalties

---

### 7. MAP GENERATOR VENUE ASSIGNMENT

**File:** `/home/user/neurotoxic-game/src/utils/mapGenerator.js`
**Assignment Logic:**

- **Layers 1-2:** Easy venues (diff ≤2)
- **Layers 3-6:** Medium venues (diff 3)
- **Layers 7+:** Hard venues (diff 4-5)
- **Fallback strategy:** If pool exhausted, step up difficulty
- **Special handling:** Leipzig Arena reserved for final node (layer 10)
  **Node Type Distribution:**
- ~70% GIG
- ~20% REST_STOP
- ~10% SPECIAL
- Festival type auto-assigned if capacity ≥1000

---

### 8. KEY STATE FLOWS

**Gig Initiation:**

```
MapNode click → isConnected? → enoughFuel? → handleTravel()
→ onTravelComplete() → handleNodeArrival(GIG)
→ startGig(venue) → PREGIG scene
```

**Performance Impact:**

```
Rhythm Game (score accumulation)
→ PostGig (score→perfScore)
→ Financials (perfScore→merch buyrate, income modifiers)
→ Reputation (if score<30, -10 regional rep)
→ Fame (gained post-gig)
```

**Economy Loop:**

```
Travel costs (fuel + food)
→ Gig income (tickets + guarantee + merch + bar + bonuses - venue split)
→ Player money updated (clamped ≥0)
→ Bankruptcy check (if ≤0 and netIncome<0)
```

---

### Summary Table: Ticket Sales Calculation

| Factor                  | Base                       | Bonus                 | Penalty        |
| ----------------------- | -------------------------- | --------------------- | -------------- |
| **Base Draw**           | 30% capacity               | —                     | —              |
| **Fame Scaling**        | Fame/(cap×10) weighted 70% | +100% at fame=cap×10+ | —              |
| **Promo Modifier**      | —                          | +15%                  | —              |
| **Soundcheck Modifier** | —                          | +10%                  | —              |
| **Price Sensitivity**   | —                          | Mitigation×fame       | -2% per €>15   |
| **Final Range**         | —                          | —                     | **10% - 100%** |

The economy is **tightly coupled** to gig performance, encouraging players to manage band morale, stamina, and composition while balancing pre-gig investments for better attendance and income multipliers.
