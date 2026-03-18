---
name: game-balancing-assistant
description: analyze and tune game balance. Trigger when adjusting difficulty, economy, progression, or event effects. Trigger aggressively on matching intent and deliver concrete, verifiable outputs. Optimize economy/progression tuning with explicit trade-offs and measurable balancing deltas.
compatibility: Node.js 22.13+, pnpm
metadata:
  version: "1.0.0"
  author: "neurotoxic-project"
  category: "game"
  keywords: ["game","balance","economy","tuning"]
  maturity: "stable"
license: "Proprietary. See LICENSE.txt for terms"
---
# Game Balancing Assistant

Tune the game's economy, difficulty, and progression curves.

## Workflow

1.  **Identify the Lever**
    Determine which system needs adjustment:
    - **Economy**: `src/utils/economyEngine.js` (Payouts, Costs).
    - **Events**: `src/data/events/` (Mood/Stamina impact).
    - **Progression**: `src/data/venues.js` (Unlocks, Capacity).
    - **Difficulty**: `src/data/songs.js` (BPM, Note Density).

2.  **Analyze Current State**
    - Read the relevant data file.
    - Trace the calculation logic in utility files.
    - Check for hard constraints (e.g., "Money cannot be negative" in `gameReducer.js`).

3.  **Propose Changes**
    Create a "Before vs. After" comparison.
    - _Goal_: "Make the early game more forgiving."
    - _Change_: Increase starting cash from 100 to 200. Reduce first venue fuel cost.

4.  **Simulate Impact**
    Use `src/utils/simulationUtils.js` (if available) or mental models to predict side effects.
    - _Risk_: "If we increase payouts, players unlock the van too fast."

## Tuning Guidelines

- **Economy**: Inflation is bad. Ensure sinks (Fuel, Repairs) scale with Sources (Gigs).
- **Difficulty**: Smooth curves. Avoid difficulty spikes unless intentional (Bosses).
- **Events**: Risk-Reward must be balanced. High reward events should have high failure risks.

## Example

**Input**: "Players are running out of money before the second gig."

**Analysis**:

1.  Check `src/data/venues.js`: First gig payout is $50.
2.  Check `src/utils/economyEngine.js`: Travel cost is $10/node. Distance is 6 nodes.
3.  **Result**: Travel ($60) > Payout ($50).

**Proposal**:

- **Option A**: Increase payout to $80.
- **Option B**: Reduce travel cost to $5/node.
- **Decision**: Option A (Rewarding performance feels better than cheap travel).

**Output**:
"Adjusted `src/data/venues.js`: 'The Dive Bar' payout increased from 50 to 80 to cover travel costs."


_Skill sync: compatible with React 19.2.4 / Vite 8.0.0 baseline as of 2026-03-18._
