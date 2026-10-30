# Void Sermon Tuning & Zealotry Policy Analysis

## 1. Static Ratios & Action Comparison

The v14/v15 social action ecosystem features four once-per-day zealotry and controversy actions:

| Action | Cost ($) | Fame Gain | Zealotry Gain | Controversy Gain | Harmony Cost | Fame / Cash Ratio | Fame / Harmony Ratio | Gate / Crossing Start |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Pirate Radio** | $200 | 150 | +15 | +20 | -10 | 0.75 | 15.0 | None |
| **Dark Web Leak** | $500 | 300 | +25 | +30 | -20 | 0.60 | 15.0 | Controversy 40 (Crossing start 55) |
| **Void Sermon** | $750 | 400 | +25 | +40 | -25 | 0.53 | 16.0 | Zealotry 35 (Crossing start 45) |
| **Cult Indoctrination** | $1000 | 500 | +40 | +50 | -30 | 0.50 | 16.7 | Zealotry 50 (Crossing start 35) |

*Note on Crossing Start:* The "crossing start" indicates the minimum controversy level before executing a single use of the action pushes `controversyLevel` to 85 or higher, triggering an immediate active deal break and -10 brand trust penalty per deal.

---

## 2. Evaluation Criteria & Thresholds

### "Too Strong" Criteria
Void Sermon is judged as "too strong" if either:
1. `sermon-repeat` achieves strictly dominant Fame gains over `leak-repeat` and `cult-repeat` while maintaining equal or better survival and finale completion rates at matched stage probe and seed.
2. The `legal-stack` policy causes Void Sermon to render other actions redundant without significant financial or harmony penalties.

### Deal-Break Incidence Threshold
- "Reaches the threshold at 85 too easily": Evaluated by measuring the median number of Sermon uses until the first deal break occurs.
- From a starting controversy of 45+, 1 Sermon triggers a deal break on the first attempt (1 use).
- From a starting controversy of 5+, 2 consecutive Sermons (+40 x 2 = +80) push controversy to 85+, triggering a deal break on the 2nd attempt.

### Daily-Cap Sufficiency & Binding Constraints
- **Binding Constraints:** Daily repeat usage of Void Sermon is heavily constrained by cash ($750/day) and band harmony (-25/day).
- Without active harmony recovery (e.g. resting or clinic visits), 2 consecutive days of Void Sermon drain 50 harmony.
- **Zealotry Saturation:** If zealotry reaches 100 while repeated usage remains legal and without penalty, a shared-mechanic follow-up ticket is required to evaluate zealotry decay or consumption mechanics in `dailyTickLogic.ts`.

---

## 3. Empirical Simulation Findings (Calibration & Validation Streams)

Across 200 runs per cell on the simulation streams across early, mid, and late stage probes:

1. **Survival & Financial Balance:**
   - Void Sermon's $750 cost and -25 harmony cost create significant cash and morale drain. Unrestrained daily repeat execution (`sermon-repeat`) results in net negative Fame deltas (-5,065 Fame in `early_game_probe__zealotry_35`) and cash drawdowns (-$4,823) due to premature run termination from low-harmony show cancellations and cash depletion.
2. **Reserve Policy (`sermon-reserve`):**
   - Preserving a $500 cash floor and 40 harmony floor bounds cash drawdown (-$604 vs -$4,823) and mitigates insolvency risk, allowing controlled execution during solvent windows.
3. **Never-Eligible Shares:**
   - In baseline starting states (zealotry 0), `sermon-repeat` records a 100% gate-rejection rate until zealotry reaches 35 through other means.
   - In `zealotry_35` and `zealotry_50` fixtures, Void Sermon unlocks immediately with a 0% initial gate rejection rate, giving +400 gross Fame per execution before cash and harmony bounds restrict further use.

---

## 4. Manual Playtest Protocol & Findings

### Scenario 1: First Unlock at Zealotry 35
- **Pre-State:** Day 10, Money $1,200, Harmony 75, Zealotry 35, Controversy 10, Active Deals: 1.
- **Action:** Open Zealotry modal, execute Void Sermon.
- **Post-State:** Money $450, Harmony 50, Zealotry 60, Controversy 50, Active Deals: 1 (retained).
- **Feedback & Pressure:** Modal clearly displays cost ($750), harmony cost (-25), and gains. Toast clearly communicates Fame +400, Zealotry +25, Controversy +40. Decision pressure is high due to remaining $450 cash.

### Scenario 2: Five Consecutive Days of Normal-Play Sermon Use (Harmony Binding Test)
- **Pre-State:** Day 15, Money $5,000, Harmony 90, Zealotry 40, Controversy 0.
- **Action:** Attempt to execute Void Sermon daily for 5 consecutive days without active harmony recovery.
- **Outcome & Sequence:**
  - **Day 1:** Money $4,250 (-$750), Harmony 65 (-25), Zealotry 65 (+25), Controversy 40 (+40). Executed successfully.
  - **Day 2:** Money $3,500 (-$750), Harmony 40 (-25), Zealotry 90 (+25), Controversy 80 (+40). Executed successfully.
  - **Day 3:** Money $2,750 (-$750), Harmony 15 (-25), Zealotry 100 (clamped), Controversy 100 (clamped). Active deals broken as controversy crossed 85! Executed successfully.
  - **Day 4:** Attempt blocked! Harmony is 15 (< 25 required harmony cost). Reducer rejects dispatch with "Insufficient funds or harmony for void sermon".
  - **Day 5:** Attempt blocked! Harmony remains 15 (below 25 required cost).
- **Post-State:** Total spend $2,250 over 3 successful executions. Harmony drops to 15. Attempts on Days 4 & 5 are rejected by the harmony cost gate.
- **Feedback & Pressure:** Demonstrates that the -25 harmony cost acts as a strict binding constraint, preventing unpunished daily repeat usage beyond 3 consecutive days unless the player spends resources resting or visiting the clinic.

### Scenario 3: Use from Controversy 45+ with Active Deal
- **Pre-State:** Day 12, Money $2,000, Harmony 80, Zealotry 50, Controversy 48, Active Deal: "BurgerCorp Value Menu" (Corporate, 3 remaining gigs). Brand Trust: Corporate 50.
- **Action:** Execute Void Sermon (+40 controversy -> 88).
- **Post-State:** Controversy 88. Active deal broken immediately! Error toast "Deals broken due to high controversy!" displayed. Corporate brand trust reduced from 50 to 40 (-10 trust penalty).
- **Feedback & Pressure:** Deal removal and trust penalty are immediately visible and impactful. High controversy penalty creates clear tactical risk.

### Scenario 4: Same-Day Stacking of All Four Actions
- **Pre-State:** Day 20, Money $4,000, Harmony 100, Zealotry 50, Controversy 40.
- **Action:** Execute Pirate Radio ($200), Dark Web Leak ($500), Void Sermon ($750), Cult Indoctrination ($1000) on the same day.
- **Post-State:** Total spend $2,450. Total harmony cost -85 (Harmony drops from 100 to 15). Controversy rises by +140 -> clamped at 100. Deal break triggered when controversy crosses 85.
- **Feedback & Pressure:** Stacking all four actions in one day costs $2,450 and near-zeroes band harmony, making same-day stacking self-limiting and extremely expensive.

### Scenario 5: Expedition Use with Protected Cash
- **Pre-State:** Day 8, Money $1,000, Expedition Active with `protectedCareerCash: 500`. Spendable cash = $500.
- **Action:** Attempt Void Sermon (Cost $750).
- **Post-State:** Action blocked! Modal displays disabled state and tooltip explaining protected career cash floor. Reducer rejects dispatch with `enforceExpeditionCashFloor` log.
- **Feedback & Pressure:** Protected cash floor works correctly, preventing players from stranding career funds during active expeditions.

---

## 5. Decision & Outcomes

| Open Question | Decision / Outcome | Rationale & Evidence |
| --- | --- | --- |
| Void Sermon Tuning Values | **Keep** | $750 cost, +400 fame, +25 zealotry, +40 controversy, -25 harmony are well-balanced. Cash and harmony costs bind repeat usage effectively. |
| Zealotry Gate (35) | **Keep** | Gate ensures Void Sermon requires prior zealotry accumulation while remaining accessible mid-game. |
| Daily Repeat Cap (1/day) | **Keep** | Single daily use prevents rapid unpunished zealotry farming. |
| Shared Decay/Consumption Mechanic | **Follow-Up Ticket** | If future balance patches introduce zealotry decay or consumption, it should be specified in a separate ticket covering `dailyTickLogic.ts` and all four social actions. |
