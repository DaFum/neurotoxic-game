# Phase 3 Controlled Rebalancing Design

## Goal

Add a deterministic, paired control-versus-candidate experiment workflow and use
its evidence to select one early-game solvency lever and one late-game touring
lever for production without changing seeds, run counts, scenario durations,
KPI thresholds, or the checked-in baseline.

## Constraints and assumptions

- The existing Phase 2 simulator remains the authority for scenarios, seeds,
  state initialization, gameplay paths, KPI evaluation, and report metadata.
- Production and experiments share one immutable tuning schema. Experiments may
  override values, but may not introduce simulator-only mechanics.
- Candidate selection follows the acceptance limits in the Phase 3 request. A
  candidate that misses a hard limit cannot win through an aggregate score.
- If no candidate passes every hard acceptance limit, the suite aborts without
  selecting or recommending a production tuning.
- The final report stores compact paired outcomes rather than full timelines.
- No dependency, UI, content, seed, run-count, duration, KPI, or baseline change
  is in scope.

## Architecture

### Canonical tuning

A focused balance-tuning module owns deeply frozen defaults, validation, and an
immutable resolver. It rejects unknown keys, non-finite values, invalid ranges,
and inconsistent windows. Production helpers receive resolved tuning explicitly;
the simulator passes defaults for normal runs and resolved overrides for
experiments. This avoids global mutation and a second balance truth.

### Experiment configuration

The experiment config is ordered data only: stable ID, phase, description,
hypothesis, scenario IDs, overrides, and explicit acceptance criteria. It covers
the three required Phase 3B candidate families and three required Phase 3C
families. Canonical JSON serialization supplies a stable SHA-256 config hash.

### Paired harness

For each scenario/run index, the harness derives the existing scenario seed once
and executes control and candidate from identical initial conditions. Control
runs are cached by scenario, seed, and tuning hash; cached results are immutable.
Candidates receive no additional calls on the main RNG stream. Results retain
only the requested terminal metrics and deltas.

Phase 3B candidates run against original defaults. The selected Phase 3B tuning
becomes the intermediate control for Phase 3C. The selected Phase 3B and Phase
3C tunings are then combined and compared with original control across all main
scenarios.

### Statistics and ranking

Pure statistics helpers compute distributions, bankruptcy transition matrices,
paired deltas, and deterministic 95% bootstrap intervals for paired mean and
median differences. Bootstrap seeds derive from experiment ID, scenario ID, and
metric; at least 2,000 paired resamples are used.

Ranking is lexicographic: hard acceptance first, then documented target fit,
side effects, overcorrection, and implementation complexity. Every component is
reported independently. Rejected candidates receive an explicit reason.

### Gig-gap analysis

The harness creates neutral and low-resource touring profiles for gaps one
through five while holding all other fields constant. It reports daily money,
gig net, fame, resource use, harmony, drawdown, survival, and gap-1-versus-gap-2
elasticity. This control analysis precedes candidate selection.

## Production levers

The early-game candidates modify recurring daily obligations only during their
configured day windows or add a one-shot, ledger-visible emergency intervention.
Travel, fuel, repairs, purchases, upgrades, and events remain untouched.

The touring candidates use existing gig history, harmony/recovery, or chassis
wear paths. Demand penalties expire, stress uses canonical clamps, and wear uses
the existing repair economy. Only the empirically selected family receives
non-neutral production defaults.

## Reports and reproducibility

The JSON report includes report version, timestamps, source/dirty metadata,
SHA-256 hashes, seed and pairing strategies, control snapshot, both phases,
rankings, selected candidates, combined validation, runtime, and recommendation.
The Markdown report renders the required focused tables and interpretations.

Two consecutive experiment runs and two normal simulation runs are normalized by
removing only `generatedAt` and `runtime.durationMs`, then hashed and compared.
Both fields are volatile and explicitly excluded from normalized report hash
inputs; no other report fields are removed. The baseline hash is captured before
work and checked after all commits.

## Testing

Development is test-first. Unit tests cover tuning validation, immutable merges,
pairing, statistics, bootstrap determinism, transitions, ranking, and gig-gap
math. Integration tests cover the selected production paths and at least one
paired bankruptcy improvement. Report integrity tests reject non-finite values,
invalid hashes, mismatched sample counts, KPI regressions, and Markdown leakage.

Final verification runs syntax checks, focused node tests, type checking, symbol
verification when exported `src/` APIs change, experiment and normal simulation
generation/comparison, deterministic output comparisons, and `pnpm run test:all`.

## Commit and publication structure

1. `docs(simulation): design phase 3 controlled rebalancing`
2. `feat(simulation): add controlled balance experiments`
3. `balance: improve bootstrap survivability`
4. `balance: reduce late-game economy snowball`
5. `docs(simulation): update phase 3 balance reports`

The branch is `feat/phase-3-controlled-rebalancing`; publication targets a draft
pull request against `main` titled
`feat(simulation): add controlled phase 3 rebalancing`.
