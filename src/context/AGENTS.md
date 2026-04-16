# src/context — Agent Instructions

## Scope
Applies to `src/context/**`.

## State Update Contract
- If adding/changing an action, update all three together in one PR:
  1. `actionTypes`
  2. reducer handling (`gameReducer` and/or slice reducer)
  3. `actionCreators`
- Prefer dispatching action creators; do not wire direct reducer calls from UI/hooks.

## Bounded State Rules
- Keep `player.money` clamped to `>= 0`.
- Keep `band.harmony` clamped to `1..100`.
- Use shared helpers in `src/utils/gameStateUtils.ts` for clamps; do not duplicate clamp logic inline.

## Migration Rules
- Remove `@ts-nocheck` incrementally (one reducer/action surface per PR).
- For type-only migrations, preserve serialized state keys and payload shapes.
