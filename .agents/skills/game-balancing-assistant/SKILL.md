---
name: game-balancing-assistant
description: Analyze game balance data and propose tuning changes with rationale. Use when adjusting difficulty, progression, or economy balance.
---

# Game Balancing Assistant

## Key Files

- `src/utils/economyEngine.js` — money, fuel, and payout calculations
- `src/utils/eventEngine.js` — event effects on mood, stamina, harmony
- `src/utils/simulationUtils.js` — simulation helpers for balance testing
- `src/utils/gigStats.js` — gig scoring and reward calculations
- `src/data/events.js` + `src/data/events/` — event definitions with effect values
- `src/data/venues.js` — venue capacity, payout multipliers, unlock thresholds
- `src/data/songs.js` — song difficulty and scoring parameters
- `src/data/characters.js` — band member base stats (stamina, mood, skill)
- `src/data/upgrades.js` — upgrade costs and effects
- `src/context/gameReducer.js` — where balance clamps are enforced (money >= 0, harmony > 0)

## Workflow

1. Identify the parameters that affect balance by reading `economyEngine.js`, `gigStats.js`, and event data.
2. Check venue payouts in `venues.js` against upgrade costs in `upgrades.js` — ensure progression feels fair.
3. Review event effect values in `src/data/events/` — compare mood/stamina/harmony deltas.
4. Compare current values against design goals and propose adjustments with explicit rationale.
5. Use `simulationUtils.js` to validate proposed changes or suggest new simulation tests.
6. Verify clamps in `gameReducer.js` still hold (money >= 0, harmony > 0).

## Output

- Provide a tuning table with current vs proposed values and rationale.
- Note any tests or simulations needed to validate changes.

## Related Skills

- `state-safety-action-creator-guard` — ensures balance changes respect state invariants
- `golden-path-test-author` — for regression testing critical game flow after balance changes
