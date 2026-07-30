# Balance Recovery and Diagnostics Design

## Goal

Correct misleading balance-simulator warnings, establish what player-visible
events and quests the simulator actually covers, and evaluate paid harmony
recovery as an experimental candidate family without changing shipped economy,
fame, cadence, or event values.

## Constraints

- Keep production payouts, fame rewards, catalogue prices, bootstrap costs,
  chaos financial damage, scandal controversy, and gig cadence unchanged.
- Use the map-bounded ten-hop tour as the denominator for frequency diagnostics.
- Source mechanics and costs from canonical game modules where an equivalent
  production mechanic exists.
- Preserve the calibration, selection, and one-time validation seed separation.
- Treat missing simulation coverage as insufficient evidence, not as evidence of
  low gameplay density.

## Recovery Candidate Family

Evaluate an unchanged control and four candidates:

| Harmony threshold | Cost |
| --- | --- |
| below 40 | one tour day and its gig opportunity |
| below 45 | one tour day and its gig opportunity |
| below 40 | canonical direct recovery cost |
| below 45 | canonical direct recovery cost |

Each candidate records recovery evaluations, activations, harmony restored,
money spent, days consumed, and gigs forgone. A candidate is experimental only
until it passes the existing calibration and selection gates and the independent
validation stream. Direct recovery costs must reuse a canonical clinic/recovery
value rather than introduce an arbitrary economy constant.

## Event Coverage

Separate three concepts that the current diagnostics conflate:

1. Runtime-equivalent trigger opportunities reached by a simulated route, gig,
   or post-gig flow.
2. Event resolutions actually modelled by the simulator.
3. Player-visible world impulses, which may include resolved events and quest
   offers, progress, completions, or failures.

The report must identify runtime trigger paths that are not executed by the
simulator. Existing synthetic counters remain available but are labelled as
modelled effects rather than a complete count of game events. Density warnings
use a ten-hop-tour or reached-opportunity denominator only when coverage is
sufficient; otherwise they report insufficient evidence.

## Quest Coverage

Audit quest creation, activation, progress, expiry/failure, completion, and
rewards. Inventorying `QUEST_REGISTRY` is not execution coverage. If the current
simulation does not execute a lifecycle stage, report that stage as unmodelled.
Reuse canonical quest domain functions only where the simulator already emits
an unambiguous corresponding gameplay action. Do not invent a quest-selection
or reward-maximising player policy in this change.

## Warning Corrections

- Remove any comparison between euro-denominated van values and Fame, or replace
  it with a dimensionally valid comparison when one already exists.
- Calibrate minigame diagnostics to the reachable mechanics: at most one travel
  minigame per executed trip and exactly one setup minigame per performed gig.
- Do not describe partial synthetic event counters as total event density.
- Surface missing event and quest coverage as a simulator limitation.

## Verification

Focused node tests must cover:

- dimensionally correct van/progression diagnostics;
- reachable minigame thresholds over the ten-hop horizon;
- separation of event opportunities, resolutions, and coverage;
- quest lifecycle coverage and insufficient-evidence behaviour;
- all four recovery candidates and the unchanged control;
- correct recovery cost, day, gig-opportunity, and harmony accounting;
- unchanged shipped tuning and preserved seed-stream separation.

Only directly affected tests and required symbol/type checks run locally; the
full suite remains delegated to CI.
