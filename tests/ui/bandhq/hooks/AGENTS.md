# tests/ui/bandhq/hooks - Agent Instructions

## Agent role and limitations

Agents for `tests/ui/bandhq/hooks/**` verify hook behavior by parsing inputs, invoking the targeted hooks, and asserting resolved UI/effect outputs. They may use local mocks and fake timers, but must not access external networks, modify persistent state outside test-controlled storage, or run long-blocking tasks. Use an agent for purchase/effect hook regressions; use human/manual handling for exploratory UX review.

- Do handle input parsing, hook invocation, toast/effect assertions, and cleanup checks.
- Do not perform network calls, mutate real storage, or replace explicit assertions with snapshots.

## Scope

Applies to `tests/ui/bandhq/hooks/**`.

## Rules

- Verify processing-lock cleanup on success and failure paths.
- Assert toast content against resolved, actually applied effect deltas.

## Gotchas

- Include early-throw cases before `try/finally` effect execution so validation failures cannot leave stale locks.
