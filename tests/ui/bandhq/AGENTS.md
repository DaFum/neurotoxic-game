# tests/ui/bandhq - Agent Instructions

## Scope

Applies to `tests/ui/bandhq/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Assert reachable user flows: open tab, perform action, see feedback.
- Mock affordability, ownership, and effect payloads with finite numeric values and explicit IDs.

## Gotchas

- Category menu regressions often hide reachability loss; include legacy HQ action assertions after navigation refactors.
