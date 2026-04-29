# src/utils - Agent Instructions

## Scope

Applies to `src/utils/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Utilities stay pure and side-effect-free unless the filename explicitly indicates IO, network, or storage.
- Treat external payloads and caught errors as `unknown` and narrow before access.
- Fail loudly on invalid invariants in strict domains instead of silently continuing with corrupted state.

## Gotchas

- Retry/error helpers must preserve the original failure cause.
- Map layer fallback selection must explicitly assert non-null venues before capacity/type access.
- `pickRandomSubset` large-`k` branches must reject sparse arrays instead of unchecked assertions.
- Purchase effect helpers should fail on invalid numeric payloads and normalize stored upgrade IDs to strings.
