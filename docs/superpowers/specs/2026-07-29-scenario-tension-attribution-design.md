# Scenario Tension and Loss Attribution Design

## Goal

Replace bankruptcy-only difficulty interpretation with a fail-closed, multidimensional diagnostic model, then use the evidence sequentially for Chaos, Scandal, Bootstrap, Festival, and progression decisions without pre-committing production tuning.

## Scope and sequencing

Phase 6A adds non-blocking tension contracts, post-first-gig loss attribution, isolated diagnostic seed cohorts, a controversy-level comparison, and runtime parity coverage for the first reachable gig. Phase 6B evaluates one Chaos candidate family selected from that attribution. Phase 6C evaluates the Scandal profile. Phase 6D re-evaluates Bootstrap and observes Festival. Phase 7 measures purchases, liquidity constraints, catalogue coverage, unallocated ending money, and upgrade payback before considering one progression candidate family.

Production values may change only when the immediately preceding diagnostic identifies a concrete lever and the candidate passes every existing hard gate plus the new post-first-gig safety checks. No passing candidate is a valid no-op result.

## Tension contract

`SCENARIO_TENSION_TARGETS` is live configuration beside `RISK_TARGETS`, but remains explicitly non-blocking. Its metric corridors cover bankruptcy, pre- and post-first-gig bankruptcy, runs and average days below EUR 500 and EUR 250, median and P90 maximum drawdown, finale reached and completed, solvent P10 ending money, and credit/support usage.

Evaluation fails closed: absent samples, non-finite values, or insufficient evidence produce `insufficient_evidence`, never an implicit pass. Diagnostic results are published but do not participate in candidate selection or release gating.

## Loss attribution

The simulator observes negative money deltas after the first played gig at the same call boundaries used for early-runway money observation. It assigns each delta to one of:

- daily obligations
- travel
- fuel
- maintenance and repairs
- negative events
- clinic
- assets and upgrades
- other
- gig settlement

Modifier, venue, tax, and other itemized gig expenses are recorded separately as gross spend; they do not become actual losses unless the resulting settlement lowers the real balance. Contraband drops and uses do not move money and therefore have no synthetic loss source. Positive movements never erase recorded actual losses. A loss is material only when that single mutation is at least 10% of the prior money peak. Per-run data records actual loss totals, the first material loss source, and the last material loss source before bankruptcy. Scenario aggregation reports total, median, P90, first-material-loss share, and bankruptcy-predecessor share per source.

## Diagnostic cohorts

The attribution report uses two selection-free cohorts of at least 2,000 runs per main scenario:

- calibration: `#scenario-tension-attribution-v1`
- holdout: `#scenario-tension-attribution-v1#holdout`

Neither cohort selects a candidate. The Scandal diagnostic compares controversy levels 0, 50, 65, and 80 on the same declared cohort contract.

## Candidate safety

Phase 6B and later candidate evaluation preserves the existing three-stream selection contract: calibration and selection operate inside the search; validation runs exactly once on the already selected combination. A candidate must preserve pre-first-gig insolvency and blocked travel, hard bankruptcy caps, Baseline/Aggressive/Cult control stability, paired Fame per gig within 5%, paired solvent ending money for unaffected runs within 5%, and unexplained finale completion regressions. The intended pressure increase must be predominantly post-first-gig, with sufficient comparable evidence.

## Progression diagnostics

Phase 7 records first purchase day, purchases per tour, catalogue share purchased, money after purchases, purchases skipped for liquidity, unallocated ending money, and asset/module payback periods. Catalogue, HQ, van, module, gig-payout, and starting-money values remain separate levers. A progression production candidate is considered only if diagnostics show a concrete lack of attractive spending opportunities.

## Runtime parity

An integration test exercises the production travel/arrival path and proves that arriving at the first reachable playable gig can start that gig without a prior-performance or cadence prerequisite. The harness remains a model of production behavior rather than a runtime policy source.

## Verification and artifacts

Implementation follows red-green TDD. Local verification runs only directly affected Node or UI integration tests, as requested. Generated balance artifacts retain source metadata and are regenerated from a clean source commit, then committed separately. Exported `src/` API changes require symbol regeneration and verification; harness-only exports do not.
