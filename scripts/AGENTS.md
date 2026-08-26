# scripts — Agent Instructions

## Balance Simulations

- Balance harnesses must import canonical reducers, action creators, configs, economy/fame helpers, event data, and minigame logic instead of reimplementing mechanics. A PreGig run executes exactly one setup minigame; simulating all three triples its stress effects.
- A run follows the generated map's ten-hop horizon. Keep `SIMULATION_CONSTANTS.daysPerRun` and progression checkpoints within that horizon. Recalibrate `KPI_TARGETS`, progression bands, Fame-per-gig bands, and solvent-money caps after changing the horizon, `GLOBAL_PAYOUT_NERF`, or `FAME_PROGRESS_CONSTANTS`.
- `gigGapDays` controls frequency; `SHIPPED_GIG_CADENCE_POLICY` controls eligible days and belongs in the harness. Main reports use 2,000 runs and `SIMULATION_CONSTANTS.seedNamespace`; changing the namespace creates unpaired cohorts.
- Diagnose insolvency before and after the first gig separately through `run.earlyRunway`. Sample `observeEarlyRunwayMoney()` after every money-moving call; sampling only after a group can hide an intermediate trough.

## Script Format

- The package is `"type": "module"`, so an ad-hoc script that uses `require()` must be named `.cjs` (see `scripts/benchmark-fast-paths.cjs`).

## Experiment Integrity

- Keep `calibration`, `selection`, and `validation` seed streams disjoint. Search candidates on `selection`; measure `validation` exactly once on the already-selected combination. A validation breach yields `no-production-recommendation-final-validation-failed`; never search for a replacement on that stream.
- Paired Fame comparisons use `pairedFamePerGig` and gate through `famePerGigWithinLimit`. Insufficient comparable-gig coverage must fail closed (`deltaPct: null`), not pass as a zero delta. Cohort reports may publish `calculateAverageFameEarnedPerGig`, but it counts no-gig runs as zero and is not a paired side-effect measure.
- Final validation uses `abortOnBreach: false` so every cap is measured. Candidate screening may abort at the first breached cap.
- Any per-run reseed of `crypto.getRandomValues` must call `resetSecureRandomBatch()` first; otherwise buffered values leak between seed streams and break paired reproducibility.

## Reports and Provenance

- Generated artifacts include `sourceFingerprint`, `generatorFingerprint`, `seedNamespace`, `runsPerScenario`, `workingTreeDirty`, and `artifactSchemaVersion`. Matching recomputed fingerprints are authoritative; a clean tree or reports-only commit is not required.
- `BALANCE_SOURCE_FILES` in `scripts/utils/balance-report-metadata.mjs` must include every source capable of changing report numbers, including RNG batching in `src/utils/crypto.ts`.
- Derive verdict targets from live configuration. `MAX_GIG_NET` is applied after `GLOBAL_PAYOUT_NERF`; scale it with the nerf to preserve the same clipping threshold, or document intentional extra damping.
- Treat `GLOBAL_PAYOUT_NERF`, `FAME_PROGRESS_CONSTANTS`, and the one-off catalogue as coupled: a full tour must still fund the catalogue. Exclude grant-priced entries such as `label_contact` when rescaling costs unless their grants also change.
- Report quest/event lifecycle coverage as `insufficient_evidence` when the simulator does not execute offers, progress, completion, expiry, and rewards. Use the ten-hop tour or reached trigger opportunities—not registry inventory—as the frequency denominator.
