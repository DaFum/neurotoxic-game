# src/utils — Agent Instructions

## Scope

Applies to `src/utils/**` except subtrees with deeper `AGENTS.md` overrides.

## Utility Rules

- Keep utilities pure and side-effect-free unless the filename explicitly indicates IO/network/storage behavior.
- Treat external payloads and caught errors as `unknown` and narrow before access.

## Domain Gotchas

- Retry/error helpers must preserve the original failure cause; swallowing last-error context breaks debug telemetry and tests.
- Map/event/randomization helpers should fail loudly on invalid invariants in strict domains instead of silently continuing with corrupted state.
- Map layer fallback selection should mirror primary-path invariant checks (explicit non-null venue assertions before capacity/type access).
- Event-engine member/stat resolution should throw typed state errors on sparse invariant violations; do not silently coerce broken arrays into benign failures.

## Recent Findings (2026-04)

- Lint coverage drift can hide utility regressions: ensure `.ts` utility files stay inside active ESLint file globs when lint config changes.
