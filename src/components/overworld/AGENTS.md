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
- `useArrivalLogic` owns direct PreGig entry after travel.
