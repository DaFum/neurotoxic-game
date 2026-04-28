# Migration and Typecheck Playbook

Use this reference for JS-to-TS work, checked JavaScript, declaration files, suppressions, and TypeScript diagnostic triage.

## JS or JSX to TS or TSX

1. Rename only when the build path supports it. For React components, use `.tsx`.
2. Type exported functions, component props, and module boundaries first.
3. Let local variables infer unless inference is too wide or ambiguous.
4. Replace external data assumptions with `unknown` plus guards.
5. Move shared shapes into `src/types/*.d.ts` when they cross module boundaries.
6. Update action types, reducers, action creators, and tests in the same change when an action contract changes.
7. Run typecheck and fix errors from the top-level contract outward.

## Checked JavaScript with `checkJs`

For `.js` files that remain JavaScript:

- Prefer JSDoc on exported functions and public data structures.
- Avoid broad `Object` or `Function` annotations.
- Import types with JSDoc when needed:

```js
/** @typedef {import('../types').GameState} GameState */

/**
 * @param {unknown} value
 * @returns {value is GameState}
 */
export function isGameState(value) {
  return typeof value === 'object' && value !== null
}
```

If the file is actively being changed and is not blocked by tooling, prefer completing the migration to `.ts` or `.tsx` instead of adding many JSDoc patches.

## Suppressions

Allowed only as a last resort:

```ts
// @ts-expect-error third-party type omits runtime-supported option; remove after library update
createThing({ knownRuntimeOption: true })
```

Rules:

- Use `@ts-expect-error`, never `@ts-ignore`.
- Scope to exactly one line.
- Include a reason that explains the mismatch.
- Do not use suppressions for project-owned types; fix the type instead.
- Delete the suppression as soon as the upstream issue is fixed.

## Declaration Files and Module Augmentation

Use `.d.ts` files for ambient declarations, cross-module shared shapes, or third-party module augmentation.

Keep declaration files predictable:

```ts
// src/types/game.d.ts
export interface PlayerState {
  money: number
  harmony: number
}
```

For augmentation, import the module being augmented and keep runtime code out of the declaration file:

```ts
import 'some-library'

declare module 'some-library' {
  interface SomeOptions {
    neurotoxicMode?: boolean
  }
}
```

Avoid creating ambient globals unless the runtime truly provides globals.

## `isolatedModules` and `import type`

When `isolatedModules` fails, check for:

- imports that are used only as types but imported as runtime values
- re-exporting types without the `type` modifier
- namespaces or const enum patterns that the transpiler cannot safely handle
- files treated as scripts instead of modules

Examples:

```ts
export type { GameAction } from './game'
export { ActionTypes, type ActionType } from './actionTypes'
```

## Triage for `tsc` Errors

1. Read the first error in the chain, not only the final incompatibility.
2. Locate the source type. Ask: should the source be stricter, looser, or guarded?
3. If the same error appears in several consumers, fix the shared type or boundary helper.
4. If only one call site fails, narrow locally with control flow.
5. Re-run typecheck after each coherent fix group.

## Clamps and Invariants

Do not spread range checks through consumers. Centralize clamps at the action creator or update helper boundary:

```ts
export const createUpdatePlayerAction = (
  updates: UpdatePlayerPayload
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_PLAYER }> => ({
  type: ActionTypes.UPDATE_PLAYER,
  payload: sanitizePlayerUpdates(updates)
})
```

Reducers should consume already-safe payloads unless the reducer itself is the boundary being tested.
