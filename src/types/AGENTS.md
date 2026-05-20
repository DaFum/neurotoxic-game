# src/types - Agent Instructions

## Cross-file contracts

- `RelationshipChange` (`member1`, `member2`, `change`, optional `source` and `timestamp`) is exported from `src/types/game.d.ts`. Do not redefine it locally in `gameStateUtils.ts` or other consumers.
- Social platform and `SocialPostOption` contracts live in `src/types/social.d.ts`; do not reintroduce local platform unions or `SocialPostOption` clones in social utilities/hooks.
- Shared audio UI contracts live in `src/types/audio.d.ts`; component-local copies drift.

## Optional-field alignment

- `GameState.lastGigStats` and the `SET_LAST_GIG_STATS` payload must expose matching optional fields: `score`, `misses`, `accuracy`, `combo`, `health`, `overload`.
- Callback prop names ending in `Callback` are shared UI contracts; rename only with all consumers and tests updated together.
