# src/components/overworld - Agent Instructions

## Scope

Applies to `src/components/overworld/**`.

## Rules

- Preserve every legacy action entry point when regrouping menus, or remove the backing hook/action in the same change.
- Scene navigation and travel actions must flow through existing scene/action callbacks; do not dispatch raw reducer shapes.
- Keep Band HQ navigation independent from Overworld category ordering.
- User-facing labels and toasts require i18n keys in EN and DE.

## Gotchas

- UI refactors here commonly make actions unreachable while components still render in tests. Add reachability coverage for changed menus.
- `cityTraits` for map nodes must be derived via `getCityKeyFromVenueId(node.venue.id)` imported from `src/utils/mapGenerator.ts`. `node.venue.city` does not exist; using it silently drops city intel from map nodes.
- `OverworldModals` is the canonical container for the Overworld modal stack (Band HQ, Quests, Stash, Pirate Radio, Merch Press, Blood Bank, Dark Web Leak). Add new overworld modals here and thread their state through `useOverworldModals()`; do not inline `{showFoo && <FooModal />}` blocks in `src/scenes/Overworld.tsx`.
