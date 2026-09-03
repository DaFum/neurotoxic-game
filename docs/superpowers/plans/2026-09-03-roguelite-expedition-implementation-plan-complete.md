# Roguelite Expedition Implementation Plan — Canonical Index

> **For agentic workers:** This file is intentionally an index, not a second authoritative concatenation of the implementation plan.

The original version of this file duplicated the Masterplan plus all six child plans. During review, that duplicate drifted from the corrected child plans and briefly contained stale action contracts, test paths, and event-pipeline instructions. To prevent a second source of truth, the executable implementation plan now lives only in the canonical files below.

## Canonical plan files

1. [`2026-09-03-roguelite-expedition-master-plan.md`](./2026-09-03-roguelite-expedition-master-plan.md)
2. [`roguelite-expedition/01-expedition-core-extraction.md`](./roguelite-expedition/01-expedition-core-extraction.md)
3. [`roguelite-expedition/02-condition-repairs-cargo.md`](./roguelite-expedition/02-condition-repairs-cargo.md)
4. [`roguelite-expedition/03-crew-stress-relationships.md`](./roguelite-expedition/03-crew-stress-relationships.md)
5. [`roguelite-expedition/04-pressure-rivals-contracts.md`](./roguelite-expedition/04-pressure-rivals-contracts.md)
6. [`roguelite-expedition/05-meta-regions-ascension.md`](./roguelite-expedition/05-meta-regions-ascension.md)
7. [`roguelite-expedition/06-balance-simulator-recalibration.md`](./roguelite-expedition/06-balance-simulator-recalibration.md)

## Authority and execution order

- The Masterplan owns cross-gate architecture, dependencies, invariants, coverage mapping, and stage gates.
- Each child plan owns the executable tasks for its subsystem.
- When a contract crosses gates, the owner named in the Masterplan's **Cross-gate invariants** section is authoritative. Child plans must extend that contract rather than redefining it.
- Execute the child plans in numerical order unless the Masterplan explicitly permits parallel development.
- Do not copy task bodies back into this file. Keeping this file as an index is deliberate drift prevention.

## Optional local single-file artifact

For offline reading only, a developer may generate a disposable concatenated copy without committing it:

```bash
{
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
