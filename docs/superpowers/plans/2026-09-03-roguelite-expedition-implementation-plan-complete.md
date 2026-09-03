# Roguelite Expedition Implementation Plan — Canonical Index

> **For agentic workers:** This file is intentionally an index, not a second authoritative concatenation of the implementation plan.

The original version of this file duplicated the Masterplan plus all child plans. During review, that duplicate drifted from the corrected child plans and briefly contained stale action contracts, test paths, event-pipeline instructions, and later a narrower gameplay interpretation than the approved design. To prevent a second source of truth, the executable implementation plan now lives only in the canonical files below.

## Canonical plan files

1. [`roguelite-expedition/00-spec-fidelity-execution-contract.md`](./roguelite-expedition/00-spec-fidelity-execution-contract.md) — **highest implementation-plan authority after the approved design Spec; restores full gameplay scope and closes the remaining execution gaps**
2. [`roguelite-expedition/00-review-hardening-contract.md`](./roguelite-expedition/00-review-hardening-contract.md) — mandatory reducer/trust-boundary/durability hardening wherever it does not conflict with the later Spec-Fidelity contract
3. [`2026-09-03-roguelite-expedition-master-plan.md`](./2026-09-03-roguelite-expedition-master-plan.md)
4. [`roguelite-expedition/01-expedition-core-extraction.md`](./roguelite-expedition/01-expedition-core-extraction.md)
5. [`roguelite-expedition/02-condition-repairs-cargo.md`](./roguelite-expedition/02-condition-repairs-cargo.md)
6. [`roguelite-expedition/03-crew-stress-relationships.md`](./roguelite-expedition/03-crew-stress-relationships.md)
7. [`roguelite-expedition/04-pressure-rivals-contracts.md`](./roguelite-expedition/04-pressure-rivals-contracts.md)
8. [`roguelite-expedition/05-meta-regions-ascension.md`](./roguelite-expedition/05-meta-regions-ascension.md)
9. [`roguelite-expedition/06-balance-simulator-recalibration.md`](./roguelite-expedition/06-balance-simulator-recalibration.md)

## Authority and execution order

The binding order is:

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`
2. `00-spec-fidelity-execution-contract.md`
3. `00-review-hardening-contract.md`
4. the Masterplan
5. the numbered child plans

Rules:

- The **Spec-Fidelity + Execution Contract is authoritative for every contract it amends**. It restores the approved pre-tour build, route node classes, multi-axis failure model, active Condition/Crew consequences, Nemesis escalation, between-tour decisions, HQ transition and rule-changing Legendary rewards. If an older snippet conflicts with it, use the Spec-Fidelity replacement.
- The **Review Hardening Contract remains mandatory** for reducer authority, crash consistency, replay protection, persistence ordering, G6 horizon/cohort integrity and every other hardening rule that is compatible with the Spec-Fidelity contract.
- The Masterplan owns remaining cross-gate architecture, dependencies and stage gates.
- Each numbered child plan owns its subsystem tasks except where one of the two contracts above explicitly replaces/amends a step.
- Execute G1–G6 in numerical order. After G1, the Masterplan may still allow independent G2/G3 work, but each gate must apply its corresponding `Gx-Fy` Spec-Fidelity tasks plus `Gx-A/B/C` Hardening amendments before being green.
- **Simulator evidence is invalid for a mechanic that has no production consumer and app-side test.** This rule is binding across G2–G6.
- Do not copy task bodies back into this file. Keeping this file as an index is deliberate drift prevention.

## Product-fidelity release checklist

Before G6 can be accepted, the implementation must prove all of the following from production paths:

```text
Tour Prep commits the complete build rather than only Expedition ids.
Rival and Underground/Black-Market choices are visible route classes.
Fog has real 0→1→2 reveal producers.
Rare/unsecured rewards are genuinely exposed to Extraction/failure loss.
Failure has multiple systemic causes and rescue decisions, not only bankruptcy.
Cargo is tied to actual selected owned content.
Condition affects rhythm gameplay and broken groups disable until recovery.
Hidden defects have a complete hidden→reveal→trigger/resolve lifecycle.
Every Crew role changes a production mechanic and relevant consequences persist.
Obligation/Rival transitions are typed and reducer-authoritative.
Nemesis levels alter future opportunities/constraints.
Contextual Finales alter real pre/post-gig mechanics.
Region/Tour/Pressure values are consumed by production helpers before simulation.
Run Summary resolves 1–3 consequential between-tour decisions before Next Tour.
HQ permanent progression is primarily Meta rather than universal run-1 Fame power.
Legendary finale rewards transform rules/choices rather than form a percentage ladder.
G6 imports those shipped rules and verifies them in disjoint Calibration/Holdout evidence.
```

## Optional local single-file artifact

For offline reading only, a developer may generate a disposable concatenated copy without committing it:

```bash
{
  cat docs/superpowers/plans/roguelite-expedition/00-spec-fidelity-execution-contract.md
  printf '\n\n---\n\n'
  cat docs/superpowers/plans/roguelite-expedition/00-review-hardening-contract.md
  printf '\n\n---\n\n'
  cat docs/superpowers/plans/2026-09-03-roguelite-expedition-master-plan.md
  for file in \
    docs/superpowers/plans/roguelite-expedition/01-expedition-core-extraction.md \
    docs/superpowers/plans/roguelite-expedition/02-condition-repairs-cargo.md \
    docs/superpowers/plans/roguelite-expedition/03-crew-stress-relationships.md \
    docs/superpowers/plans/roguelite-expedition/04-pressure-rivals-contracts.md \
    docs/superpowers/plans/roguelite-expedition/05-meta-regions-ascension.md \
    docs/superpowers/plans/roguelite-expedition/06-balance-simulator-recalibration.md
  do
    printf '\n\n---\n\n'
    cat "$file"
  done
} > /tmp/roguelite-expedition-implementation-plan-complete.md
```

The generated `/tmp` file is convenience output only; review and implementation must always use the canonical repository files listed above.
