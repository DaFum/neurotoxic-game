# Codebase Exploration Report

## Area 1: Save system / versioning

### 1. Where saves are written and read

Saves are primarily managed in `src/context/usePersistence.ts`.
- **SAVE_KEY**: `export const SAVE_KEY = 'neurotoxic_v3_save'`
- **Writing**: The `saveGame` function calls `createPersistedState(stateSnapshot)` which maps the current `GameState` into a serializable object containing whitelisted keys. It then uses `localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))` (wrapped in `safeStorage`).
- **Reading**: The `loadGame` function uses `localStorage.getItem(SAVE_KEY)`, parses it, validates it with `validateSaveData(parsed)` (from `src/utils/saveValidator.ts`), and constructs the raw load payload.
- **createRawLoadPayload**: Filters the parsed JSON object to only include keys defined in `LOADABLE_SAVE_KEYS` array, and injects unlocked items.

```typescript
// From src/context/usePersistence.ts
export const createRawLoadPayload = (
  parsedObj: Record<string, unknown>,
  unlocks: string[]
): Record<string, unknown> => {
  const payload: Record<string, unknown> = { unlocks }
  for (const key of LOADABLE_SAVE_KEYS) {
    if (Object.hasOwn(parsedObj, key)) {
      payload[key] = parsedObj[key]
    }
  }
  return payload
}
```

### 2. Version field in the save format

- **Initial State**: In `src/context/initialState.ts`, the `initialState` object explicitly sets `version: 2`.
- **Type**: `GameState` in `src/types/game.d.ts` has `version: number`.
- **Save Payload**: `LOADABLE_SAVE_KEYS` in `usePersistence.ts` includes `'version'` as the first element, ensuring it's written and read from the save.
- **Migration Logic**: In `src/context/reducers/systemReducer.ts`, inside `handleLoadGame`, there is a basic version check that bumps version 1.0 to 2:

```typescript
  // Version Migration Map
  if (migratedState.version < 2) {
    // 1.0 -> 2 additions (if any structured layout changes need applying)
    migratedState.version = 2
  }
```

### 3. The LOAD_GAME reducer case

Located in `src/context/reducers/systemReducer.ts` as `handleLoadGame`. It does not do a direct, naive merge of the old save into the current state. Instead, it performs a structured, sanitized load and shape migration:

1. **Sanitization**: It passes each major slice of the incoming payload through a dedicated sanitizer function (e.g., `sanitizePlayer(loadedState.player)`, `sanitizeBand(loadedState.band)`, `sanitizeSocial(loadedState.social)`, etc.) which constructs safe objects ensuring required nested fields exist.
2. **Safe State Construction**: It builds a `safeState` object using these sanitized pieces.
3. **Shape Migration**: It applies specific migrations to nested data structures (like `migratePlayerLocation` and mapping `venueBlacklist` through `migrateLegacyVenueId`).
4. **Version Bump**: It bumps the root version to `2` if it was less than `2`.

---

## Area 2: game.d.ts type organization

### 1. Types in `src/types/game.d.ts`

Here are the exported interfaces/types and their logical domains:

*   **System/Global Domains:** `GameState`, `GamePhase`, `Rarity`, `GameSettings`, `UnknownRecord`, `RawGameSettings`, `RawLoadedGame`, `Action`, `GameAction`
*   **Events/Story:** `EventOption`, `GameEvent`
*   **Map/World:** `Venue`, `MapNode`, `GameMap`
*   **NPCs/Characters:** `CharacterProfile`, `CharacterTrait`
*   **Minigames:** `MinigameState`
*   **Player/Progression:** `PlayerState`
*   **Band/Inventory:** `BandMember`, `StashItem`, `BandState`
*   **Social/Rivals:** `BrandAlignment`, `RivalBandState`, `SocialState`, `PostResult`
*   **Gigs/Performance:** `GigModifiers`, `PostGigSummary`
*   **UI/System:** `ToastPayload`
*   **Quests:** `QuestState`
*   **Action Payloads (System/Minigame/Events):** `ResetStatePayload`, `EventDeltaPayload`, `UpdatePlayerPayload`, `UpdateBandPayload`, `CompleteTravelMinigamePayload`, `ClinicActionPayload`, `DarkWebLeakConfig`, `DarkWebLeakPayload`, `PirateBroadcastPayload`, `BloodBankDonatePayload`, `TradeVoidItemPayload`, `MerchPressPayload`

### 2. Other existing type files in `src/types/`

Based on a directory listing (`ls src/types/`), the following type files exist:

- `audio.d.ts`
- `callbacks.d.ts`
- `components.d.ts`
- `economy.d.ts`
- `game.d.ts`
- `index.ts`
- `kabelsalat.d.ts`
- `migration-stubs.d.ts`
- `react-compat.d.ts`
- `rhythm.d.ts`
- `rhythmGame.d.ts`

*(Note: There is also an `AGENTS.md` file in this directory.)*

### 3. Types that belong to their own domain files

`game.d.ts` is currently acting as a monolithic catch-all for many disparate domains. The following types clearly belong in distinct domain-specific `.d.ts` files to improve modularity:

*   **Quest Types:** `QuestState` -> could move to `quest.d.ts`
*   **Event Types:** `EventOption`, `GameEvent` -> could move to `events.d.ts`
*   **Social Types:** `SocialState`, `BrandAlignment`, `PostResult` -> could move to `social.d.ts`
*   **NPC/Character Types:** `CharacterProfile`, `CharacterTrait` -> could move to `npc.d.ts` or `character.d.ts`
*   **Map/Venue Types:** `MapNode`, `GameMap`, `Venue` -> could move to `map.d.ts` or `world.d.ts`
*   **Gig/Performance Types:** `GigModifiers`, `PostGigSummary` -> could move to `gig.d.ts` or merge with rhythm types.
*   **Minigame Specific Types:** `CompleteTravelMinigamePayload`, `ClinicActionPayload`, etc. -> could move to `actions.d.ts` or specific minigame/scene type definitions.
