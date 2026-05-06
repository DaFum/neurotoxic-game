# tests/ui/bandhq/hooks - Agent Instructions

## Scope

Applies to `tests/ui/bandhq/hooks/**`.

## Rules

- Verify processing-lock cleanup on success and failure paths.
- Assert toast content against resolved, actually applied effect deltas.

## Gotchas

- Include early-throw cases before `try/finally` effect execution so validation failures cannot leave stale locks.
