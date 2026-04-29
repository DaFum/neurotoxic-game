# src/scenes/kabelsalat/components/sockets — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/sockets/**`.

## Domain Gotchas

- Socket components must validate interaction IDs before dereferencing maps in handlers; impossible IDs should fail loudly in development paths.
- Keep socket ordering deterministic and typed (`as const`) so gameplay win checks remain stable across renders.

## Recent Findings (2026-04)

- Subtle socket-order widening to plain arrays causes nondeterministic completion checks; preserve literal tuple/const typing end-to-end.
