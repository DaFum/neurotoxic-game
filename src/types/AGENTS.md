# src/types - Agent Instructions

## Game/Event Contracts

- `RelationshipChange` (`member1`, `member2`, `change`, optional `source` and `timestamp`) is exported from `src/types/game.d.ts`. Do not redefine it locally in `gameStateUtils.ts` or other consumers.
- If a local `RelationshipChange`-shaped clone already exists, replace it with the shared import and remove the duplicate in the same change.

## Social Contracts

- Social platform and `SocialPostOption` contracts live in `src/types/social.d.ts`; do not reintroduce local platform unions or `SocialPostOption` clones in social utilities/hooks.
- If a local platform union or `SocialPostOption` clone already exists, replace it with the shared import and remove the duplicate in the same change.

## Audio/UI Contracts

- Shared audio UI contracts live in `src/types/audio.d.ts`; component-local copies drift.
- If a component-local audio state/handler copy already exists, replace it with the shared contract and remove the duplicate in the same change.
- Callback prop names ending in `Callback` are shared UI contracts; rename only after updating every importing module, JSX caller, and test that renders or asserts those props.

## Gig Stats Alignment

- `GameState.lastGigStats` and the `SET_LAST_GIG_STATS` payload must expose matching optional fields: `score`, `misses`, `accuracy`, `combo`, `health`, `overload`.
