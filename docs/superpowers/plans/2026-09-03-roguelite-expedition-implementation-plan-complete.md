# Roguelite Expedition Implementation Plan — Canonical Index

> **For agentic workers:** This file is intentionally an index, not a second authoritative concatenation of the implementation plan.

The original version of this file duplicated the Masterplan plus all six child plans. During review, that duplicate drifted from the corrected child plans and briefly contained stale action contracts, test paths, and event-pipeline instructions. To prevent a second source of truth, the executable implementation plan now lives only in the canonical files below.

## Canonical plan files

1. [`roguelite-expedition/00-review-hardening-contract.md`](./roguelite-expedition/00-review-hardening-contract.md) — **mandatory reviewed execution contract; apply its amendments at the named G1–G6 insertion points**
2. [`2026-09-03-roguelite-expedition-master-plan.md`](./2026-09-03-roguelite-expedition-master-plan.md)
3. [`roguelite-expedition/01-expedition-core-extraction.md`](./roguelite-expedition/01-expedition-core-extraction.md)
4. [`roguelite-expedition/02-condition-repairs-cargo.md`](./roguelite-expedition/02-condition-repairs-cargo.md)
5. [`roguelite-expedition/03-crew-stress-relationships.md`](./roguelite-expedition/03-crew-stress-relationships.md)
6. [`roguelite-expedition/04-pressure-rivals-contracts.md`](./roguelite-expedition/04-pressure-rivals-contracts.md)
7. [`roguelite-expedition/05-meta-regions-ascension.md`](./roguelite-expedition/05-meta-regions-ascension.md)
8. [`roguelite-expedition/06-balance-simulator-recalibration.md`](./roguelite-expedition/06-balance-simulator-recalibration.md)

## Authority and execution order

- The **Review Hardening Contract is authoritative for every contract it amends**. If an older child-plan snippet conflicts with it, use the replacement contract from `00-review-hardening-contract.md`; the affected gate is not green until that amendment is applied.
- The Masterplan owns all remaining cross-gate architecture, dependencies, invariants, coverage mapping, and stage gates.
- Each child plan owns the executable tasks for its subsystem except where the Hardening Contract explicitly replaces or amends a step.
- When a contract crosses gates, the owner named in the Masterplan's **Cross-gate invariants** section remains authoritative unless the Hardening Contract explicitly tightens that boundary.
- Execute the child plans in numerical order and apply the Hardening amendments at their stated G1–G6 insertion points. The Masterplan may still permit independent G2/G3 development after G1.
- Do not copy task bodies back into this file. Keeping this file as an index is deliberate drift prevention.

## Optional local single-file artifact

For offline reading only, a developer may generate a disposable concatenated copy without committing it:

```bash
{
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