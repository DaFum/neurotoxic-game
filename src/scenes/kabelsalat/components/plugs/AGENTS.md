# src/scenes/kabelsalat/components/plugs - Agent Instructions

## Agent context

- PlugManager agent: coordinates plug discovery, socket matching, and state sync for plug components.
- Drag handler agent: preserves pointer/keyboard drag contracts and caller-provided handlers.
- Limits: stay within `src/scenes/kabelsalat/components/plugs/**`, do not access external inputs, do not bypass typed plug IDs, and keep runtime work short enough for frame-safe UI updates.
- When to use: startup plug registration, runtime reconciliation, and error recovery for mismatched plug/socket state.

## Scope

Applies to `src/scenes/kabelsalat/components/plugs/**`.

## Rules

- Preserve literal plug ID types and shared drag/drop contracts.
- Keep pointer/keyboard handlers composed with caller-provided handlers.

## Gotchas

- Do not convert plug IDs to arbitrary strings; socket matching depends on narrowed literals.
