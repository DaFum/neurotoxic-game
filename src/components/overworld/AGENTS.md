# src/components/overworld - Agent Instructions

- When regrouping menus, preserve every legacy action entry point, or remove the backing hook/action in the same change. UI refactors here commonly leave actions unreachable while components still render in tests — add reachability coverage for changed menus.
- `cityTraits` for map nodes must be derived via `getCityKeyFromVenueId(node.venue.id)` from `src/utils/mapGenerator.ts`. `node.venue.city` does not exist; using it silently drops city intel.
- `OverworldModals` is the canonical container for the Overworld modal stack (Band HQ, Quests, Stash, Pirate Radio, Merch Press, Blood Bank, Dark Web Leak). Add new overworld modals here and thread state through `useOverworldModals()`; do not inline `{showFoo && <FooModal />}` blocks in `src/scenes/Overworld.tsx`.
- Band HQ navigation must stay independent from Overworld category ordering.
