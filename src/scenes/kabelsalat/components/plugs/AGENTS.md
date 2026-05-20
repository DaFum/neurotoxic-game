# src/scenes/kabelsalat/components/plugs - Agent Instructions

## IDs / Handlers

- Preserve literal plug ID types and shared drag/drop contracts.
- Keep pointer/keyboard handlers composed with caller-provided handlers.
- Do not convert plug IDs to arbitrary strings; socket matching depends on narrowed `CableId` literals.

## Performance

- Keep runtime work frame-safe: plug SVG components should stay pure/memoized, and pointer/keyboard paths should avoid heavy loops or allocations that could block a render frame.
