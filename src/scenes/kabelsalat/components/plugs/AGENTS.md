# src/scenes/kabelsalat/components/plugs - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/plugs/**`.

## Rules

- Preserve literal plug ID types and shared drag/drop contracts.
- Keep pointer/keyboard handlers composed with caller-provided handlers.

## Gotchas

- Do not convert plug IDs to arbitrary strings; socket matching depends on narrowed literals.
