# src/types - Agent Instructions

## Scope

Applies to `src/types/**`.

## Rules

- Shared domain contracts live here; do not duplicate structural clones in consumers.
- Keep action payload, state, and consumer optionality aligned in the same change.
- Prefer discriminated unions and literal-safe maps over wide records.
- Use `import type` for type-only consumers.

## Gotchas

- `GameState.lastGigStats` and `SET_LAST_GIG_STATS` payload fields must expose matching optional fields: `score`, `misses`, `accuracy`, `combo`, `health`, `overload`.
- `RelationshipChange` (`member1`, `member2`, `change`, optional `source` and `timestamp`) is exported from `src/types/game.d.ts`; do not redefine it locally in consumers such as `gameStateUtils.ts`.
- Social platform and post-option contracts live in `src/types/social.d.ts`; do not reintroduce local platform unions or `SocialPostOption` clones in social utilities/hooks.
- Shared audio UI contracts belong in `src/types/audio.d.ts`; component-local copies drift quickly.
- Callback prop names ending in `Callback` are shared UI contracts; rename only with all consumers and tests updated together.
