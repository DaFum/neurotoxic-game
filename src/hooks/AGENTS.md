# src/hooks - Agent Instructions

## Scope

Applies to `src/hooks/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Hooks orchestrate callbacks and state reads; reducers/action creators own state transitions.
- Include complete dependency arrays, including `t` when used.
- Return stable, explicit APIs for hooks consumed by components or tests.
- Treat storage, event, API, and unknown callback payloads as `unknown` and narrow before use.

## Gotchas

- Derive UI toast values from pre-dispatch state; `useReducer` dispatch does not synchronously update refs.
- Lock state such as `processingItemId` must clean up in `finally`, including pre-effect validation failures.
