# Tour Director / Anti-Death-Spiral State Analysis

## 1. HARMONY*DEATH_SPIRAL*\* constants

**Definition:**
Defined in `src/utils/eventEngine.ts`:

```typescript
export const HARMONY_DEATH_SPIRAL_THRESHOLD = 30
export const HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR = 0.5
```

**Usage:**
Used in `selectEvent` in `src/utils/eventEngine.ts`:

```typescript
// Dampen random band events when harmony is critically low to prevent death spirals
if (
  event.category === 'band' &&
  event.trigger === 'random' &&
  (gameState.band?.harmony ?? 100) < HARMONY_DEATH_SPIRAL_THRESHOLD
) {
  chance *= HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR
}
```

This logic reduces the probability of random 'band' category events by 50% when band harmony falls below 30. This is a direct measure to prevent the band from accumulating too many negative random band events when they are already struggling with low harmony.

## 2. Event selection/trigger logic

Located primarily in `src/utils/eventEngine.ts`:

- **`selectEvent(pool, gameState, triggerPoint, rng)`:**
  - **Priority 1:** Checks `pendingEvents` in the game state. If there's a pending event in the current pool, it returns it immediately. This allows the game to guarantee sequential events or forced events.
  - **Priority 2:** Filters the pool by `triggerPoint` (e.g., 'travel', 'post_gig'). Events with `trigger: 'random'` can occur at any point.
  - **Priority 3:** Filters out events that are in the `eventCooldowns` set.
  - **Priority 4:** Checks the `event.condition(state)`. If it returns false/null, the event is skipped. If it returns an object, those become `contextvars` for string templating.
  - **Selection:** The eligible events are shuffled (Fisher-Yates). It iterates through the shuffled list. For each event, it determines its base `chance`.
  - **Weighting:** If the event has a `requiredFlag` that is present in `activeStoryFlags`, the `chance` is multiplied by **5.0** (Huge boost).
  - **Dampening:** If the event is a 'band' event, trigger is 'random', and harmony < 30, chance is halved (Death Spiral prevention).
  - **Trigger:** It rolls against the final `chance` (`rng() < chance`). The first event to pass its chance roll is selected.

## 3. Harmony and Money checks (consecutiveBadShows, bankruptcy, relief)

**Post-Gig Checks (`src/context/reducers/gigReducer.ts`):**

- `handleSetLastGigStats` evaluates the gig score.
- **Bad Show (Score < 30):**
  - Calls `handleRecordBadShow`. Increments `player.stats.consecutiveBadShows`.
  - If `consecutiveBadShows >= 3` and the `QUEST_PROVE_YOURSELF` is not active, it forcibly adds this quest. This acts as a steering mechanism/challenge when failing repeatedly.
  - Loses regional reputation. If reputation <= -30, the venue is blacklisted.
- **Good Show (Score >= 60):**
  - Calls `handleRecordGoodShow`. Resets `consecutiveBadShows` to 0.
  - Gains regional reputation.
  - Advances `QUEST_APOLOGY_TOUR` or `QUEST_PROVE_YOURSELF` if conditions are met.
  - If `activeStoryFlags` has `apology_tour_complete` but not `comeback_triggered`, and controversy < 30, queues `consequences_comeback_album` in `pendingEvents`.

**Daily Updates (`src/utils/simulationUtils.ts`):**
The `calculateDailyUpdates` function handles passive decay and checks:

- **Money/Bankruptcy:** `dailyCost` is subtracted from `player.money`. `clampPlayerMoney` is used (which likely prevents it from going below 0, though bankruptcy events could trigger on 0). Wealthy players have a random drain applied.
- **Harmony Drift:** If harmony > 50, it decays towards 50. If < 50, it regens towards 50.
- **Bad Show Streak Penalty:** If `consecutiveBadShows > 0`, harmony is reduced by `Math.min(10, consecutiveBadShows * 2)` each day.
- **Controversy:** High controversy (>= 50) causes an extra daily harmony drain (-1). Passive cooldown accelerates if controversy > 55.

## 4. `src/data/events/` Categories and Recovery Events

Files in `src/data/events/`:

- `band.ts`
- `consequences.ts`
- `crisis.ts`
- `financial.ts`
- `gig.ts`
- `quests.ts`
- `relationshipEvents.ts`
- `special.ts`
- `transport.ts`

**Recovery/Relief Events found (e.g., in `consequences.ts`):**

- **`consequences_comeback_album`:** Queued when recovering from controversy after an Apology Tour. Massive positive boosts (Money +300, Fame +100, Loyalty +20, Controversy -15).
- **Quests as Relief:** The `QUEST_PROVE_YOURSELF` triggered after 3 bad shows gives the player a specific goal rather than just losing.
- **`consequences_cancel_culture_quest`:** Triggers at 85+ controversy. It sets the `cancel_quest_active` story flag (rather than directly adding a quest via the `quest` effect type), which acts as a trigger to guide the player out of high controversy.
- **`consequences_ego_breakup_threat`:** Triggers when an ego-focused member drives harmony < 25. It sets the `breakup_quest_active` story flag, which gives the player a chance to save the band rather than an instant game over.

## 5. Steering and Difficulty Scaling (`hooks` & `utils`)

- **Van Breakdown Scaling (`simulationUtils.ts`):** Breakdowns are heavily scaled based on van condition. Condition < 30 multiplies breakdown chance by 3.0. Controversy >= 80 adds +0.5 multiplier. This makes the game harder when the player is doing poorly or in high controversy.
- **Gig Modifiers (`simulationUtils.ts` - `getGigModifiers`):**
  - Harmony > 80: "TELEPATHY" - easier hits (+20ms hit window).
  - Harmony < 40: "DISCONNECT" - notes jitter.
  - Harmony < 20: "TOXIC" - severe jitter, strict timing (-25ms hit window).
  - Stamina < 30 (Marius/Drums): Rushing tempo (drum speed x1.2).
  - Mood < 30 (Matze/Guitar): Guitar score -50%.
    This heavily penalizes the rhythm game aspect when band stats are poor, creating a mechanical death spiral that reinforces the narrative one.
