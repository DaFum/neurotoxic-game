# src/data - Agent Instructions

## IDs & Events

- Data IDs are contracts. Keep IDs stable and update dependent lookup maps/tests when adding or renaming entries.
- Event condition arrows require explicit `(state: GameState) =>` annotations.

## Quests

- `QUEST_REGISTRY` (`questRegistry.ts`) is the single source of truth for quest config (`kind`, `repeatPolicy`, `progressSource`, `required`, `deadlineOffset`, `cooldownDays`, `failurePenalty`, reward/flag fields). It is `as const satisfies Record<string, Partial<QuestState>>` — extend `QuestState` in `src/types/quest.d.ts` before adding a new field. Do NOT re-declare quest config inline: `QUEST_EVENTS` effects and `usePostGigHandlers` pass `{ id }` (or build from `getQuestDefinition`), and `QuestLifecycle.addQuest` merges registry defaults under the payload and computes `deadline` from `deadlineOffset`.
- Repeat policy is enforced in `QuestLifecycle.addQuest`: `'never'` is blocked once the id is in `completedQuestIds` or a completion/reward flag is active; `'cooldown'` is blocked while an unexpired `questCooldowns` entry exists. `completeQuest` records `completedQuestIds`, clears `clearFlagsOnComplete`, and opens cooldowns; `checkDeadlines` applies failure penalties (controversy/harmony/loyalty), pushes `failurePenalty.flags`, clears `clearFlagsOnFail`, and records re-add cooldowns keyed by quest id. Cooldowns expire in `handleAdvanceDay`.
- Quest progress is event-driven via `QuestProgress.applyEvent` (`src/utils/questProgress.ts`, `APPLY_QUEST_EVENT`). The `small_venue_good_gig` capacity (≤300) gate lives at the dispatch site in `gigReducer`, not in `applyEvent`. Validate registry shape with `tests/node/questSystem.test.js` and lifecycle/progress with `tests/node/domain/questLifecycle.test.js`.
- `harmony_recovered` is a **threshold** source, not an accumulator: the event carries `newHarmony` (the resulting band harmony) and `applyEvent` routes it through `QuestLifecycle.setQuestProgress`, which sets absolute (monotonic) progress and completes the quest when `band.harmony >= required`. So `required` on a harmony quest is the target harmony level (e.g. `quest_ego_management` 50, `quest_harmony_project` 75). The event is emitted from `gigReducer` (post-gig harmony) and `usePostGigHandlers` (after a positive harmony delta); there is no longer a hardcoded ego-completion check.
- Repeat policies have specific scope semantics: `cooldown` writes a `questCooldowns` entry keyed by `questId` (global); `perVenue` and `perRegion` write a `completedQuestScopes` entry keyed by `(questId, scopeKey)` and refuse re-add only for the same scope. `addQuest` stamps `scopeKey` from `state.currentGig?.id ?? state.player?.currentNodeId` (venue) or `state.player?.location` (region); a `perVenue`/`perRegion` quest without an available scope key is refused.
- Story arcs may branch via `QuestState.followupQuestId` — `completeQuest` automatically dispatches the follow-up through the gated `addQuest` path, so repeat-policy and scope checks apply to the follow-up too. New quests must satisfy the phase-20 content gates in `tests/node/questSystem.test.js`: every `progressSource` is handled by `QuestProgress.applyEvent`, repeatable quests declare a cooldown/scope guard, failure penalties stay non-lethal, story quests declare a completion or failure flag, and `startFlags` are always cleared on resolve. `money_earned` is currently declared but not emitted; do not use it as a `progressSource` until a dedicated emit site exists.

## HQ Items

- In `src/data/hqItems.ts`, each item uses a singular `effect` property, not `effects`.
- HQ item `cost` must be an integer multiple of 10, and `currency` must be `'money'` or `'fame'`; `tests/node/hqItems.test.js` enforces both.
- New HQ items also need EN/DE entries in `public/locales/{en,de}/items.json`.

## Songs

- Validate `src/data/songs.ts` and `src/assets/rhythm_songs.json` changes with `tests/node/songsData.test.js` for transform edge cases and `tests/node/songs-real.test.js` for production data contracts; lint/autofix does not catch missing or malformed song data.

## Randomness

- Non-deterministic event conditions and effects (e.g. `crisis.ts` raid roll) must use `secureRandom()` from `src/utils/crypto`, not `Math.random()`. `secureRandom()` throws when the Crypto API is unavailable; the `Math.random()` fallback lives in `getSafeRandom()`/`getSafeUUID()` wrappers. Tests stub the imported function directly.

## Traits

- Legacy save shapes may store `traits` as an array; trait helpers (`hasTrait`, duplicate-unlock checks) must `Array.isArray` and handle both arrays and object maps keyed by trait ID. Do not normalize on read without also migrating the persisted save.
