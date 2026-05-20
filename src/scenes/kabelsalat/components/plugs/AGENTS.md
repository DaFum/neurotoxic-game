# src/scenes/kabelsalat/components/plugs - Agent Instructions

## Rules

- Preserve literal plug ID types and shared drag/drop contracts.
- Keep pointer/keyboard handlers composed with caller-provided handlers.
- Keep runtime work short enough for frame-safe UI updates.

## Gotchas

- Do not convert plug IDs to arbitrary strings; socket matching depends on narrowed literals.
