# src/components/overworld - Agent Instructions

## Menus

- When regrouping menus, preserve every existing rendered control/menu item that invokes a hook or action (for example Band HQ, Quests, Stash, Pirate Radio, Merch Press, Blood Bank, Dark Web Leak), or remove the backing hook/action in the same change. UI refactors here commonly leave actions unreachable while components still render in tests; add reachability coverage for changed menus.
- Band HQ navigation must not depend on the order of Overworld category arrays or rendered menu groups.

## Map State

- `cityTraits` for map nodes must be derived from `normalizeVenueId(node.venueId ?? node.venue)` and `getCityKeyFromVenueId(...)` from `src/utils/mapGenerator.ts`. `node.venue.city` does not exist; an empty city key should pass `undefined`.

## Modals

- `OverworldModals` is the canonical container for the Overworld modal stack (Band HQ, Quests, Stash, Pirate Radio, Merch Press, Blood Bank, Dark Web Leak). Add new overworld modals here and thread state through `useOverworldModals()`; do not inline `{showFoo && <FooModal />}` blocks in `src/scenes/Overworld.tsx`.
