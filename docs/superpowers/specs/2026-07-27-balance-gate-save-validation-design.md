# Balance Gate and Save Validation Design

## Goal

Prevent new saves from being rejected and ensure only a fully validated balance-candidate combination can become production tuning or overwrite canonical reports.

## Design

`regionalGigHistory` is validated as a bounded record of safe region identifiers to bounded arrays of finite, non-negative integer days. The existing sanitizer remains the normalization boundary and sorts/deduplicates accepted history.

The experiment harness evaluates every individually accepted bootstrap candidate with every individually accepted touring candidate. Each combination is run against every configured scenario, receives per-scenario validation details, and is eligible for production only if the complete final gate passes. Eligible combinations are ranked deterministically by the smallest tuning change. Canonical reports are written only for an accepted combination.

Fame earned per gig uses one exported calculation shared by the simulation summary and experiment checks. Expected final scenarios are derived from `SCENARIOS` and `KPI_TARGETS`. Runtime is counted at the simulation-call boundary, and the aggregate source hash includes the production wiring and save pipeline.

## Verification

Node tests cover hostile and malformed regional history, an actual persisted-save roundtrip, missing/duplicate final scenarios, non-KPI report rows, canonical fame weighting, combination selection, report gating, Markdown status, and runtime accounting. The final full experiment run must pass before defaults and canonical reports are updated.
