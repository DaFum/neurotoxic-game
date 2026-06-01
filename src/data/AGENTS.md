# src/data - Agent Instructions

## IDs & Events

- Data IDs are contracts. Keep IDs stable and update dependent lookup maps/tests when adding or renaming entries.
- Event condition arrows require explicit `(state: GameState) =>` annotations.

## Quests

- `QUEST_REGISTRY` (`questRegistry.ts`) is the single source of truth for quest config (`kind`, `repeatPolicy`, `progressRules`, `required`, `deadlineOffset`, `cooldownDays`, `failurePenalties`/legacy `failurePenalty`, `rewards`/legacy reward fields, offer/flag fields). It is `as const satisfies Record<string, QuestDefinition>` — extend `QuestDefinition` in `src/types/quest.d.ts` before adding a new static field. Active saves use `ActiveQuestState` runtime fields only for registry-backed quests; do not put static definition data into active quest runtime unless preserving unknown legacy/ad-hoc quests. Do NOT re-declare quest config inline: `QUEST_EVENTS` effects and `usePostGigHandlers` pass `{ id }` (or build from `getQuestDefinition`), and `QuestLifecycle.addQuest` merges registry defaults under the payload and computes `deadline` from `deadlineOffset`.
- Repeat policy is enforced in `QuestLifecycle.addQuest`: `'never'` is blocked once the id is in `completedQuestIds` or a completion/reward flag is active; `'cooldown'` is blocked while an unexpired `questCooldowns` entry exists. `completeQuest` records `completedQuestIds`, clears `clearFlagsOnComplete`, and opens cooldowns; `checkDeadlines` applies failure penalties (controversy/harmony/loyalty), pushes `failurePenalty.flags`, clears `clearFlagsOnFail`, and records re-add cooldowns keyed by quest id. Cooldowns expire in `handleAdvanceDay`.
- Quest progress is event-driven via canonical `QuestEvent` payloads and declarative `progressRules` in `QuestProgress.applyEvent` (`src/utils/questProgress.ts`, `APPLY_QUEST_EVENT`). Legacy `progressSource` stays for compatibility/UI copy, but new matching belongs in `progressRules`. Validate registry shape with `tests/node/questSystem.test.js` and lifecycle/progress with `tests/node/domain/questLifecycle.test.js`.
- Connect gameplay through producers in `src/quests/producers/*` and emit events with `QuestEvents.emit(state, event)` from reducers or the `applyQuestEvent` action from hooks; never call `QuestLifecycle.advanceQuest` or `setQuestProgress` directly from producer code (`tests/node/questSystem.test.js` gates this), producers must include contextual fields (`platform`, `postCategory`, `dealType`, `brandAlignment`, `venueId`, `region`, `assetKind`, `itemId`, `minigameId`, `tags`), and quests must be filtered only through `progressRules.match`.
- `band.harmonyChanged` / legacy `harmony_recovered` is a **threshold** rule, not an accumulator: the event context carries resulting harmony (`context.harmony` / legacy `newHarmony`) and `applyEvent` routes threshold rules through `QuestLifecycle.setQuestProgress`. So `required` on a harmony quest is the target harmony level (e.g. `quest_ego_management` 50, `quest_harmony_project` 75).
- Repeat policies have specific scope semantics: `cooldown` writes a `questCooldowns` entry keyed by `questId` (global); `perVenue` and `perRegion` write a `completedQuestScopes` entry keyed by `(questId, scopeKey)` and refuse re-add only for the same scope. `addQuest` stamps `scopeKey` from `state.currentGig?.id ?? state.player?.currentNodeId` (venue) or `state.player?.location` (region); a scoped quest without an available scope key is refused. Scoped quests also **only progress** when a rule declares `match.scope` and the emitted event context matches the stamped `scopeKey`.
- Quest offers go through `QuestOfferEngine` (`src/domain/questOfferEngine.ts`), which composes `canAcceptQuest`, quest slots (`story:1`, `side:2`, `repeatable:2`, `tutorial:1`), cooldown/scope gates, and declarative `offer.condition`. Do not reintroduce one-off "no active quest" checks in event conditions.
- Story arcs may branch via `QuestState.followupQuestId` — `completeQuest` automatically dispatches the follow-up through the gated `addQuest` path, so repeat-policy and scope checks apply to the follow-up too. New quests must satisfy the content gates in `tests/node/questSystem.test.js`: every progressing quest declares `progressRules`, rule events are emitted by producers/gameplay, scoped repeat policies declare scope rules, repeatables declare cooldown/scope guardrails, failure penalties stay non-lethal, story quests declare completion/failure flags, and `startFlags` are always cleared on resolve. `money_earned` is currently declared but not emitted; do not use it as a `progressSource`/rule event until a dedicated producer exists.

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
