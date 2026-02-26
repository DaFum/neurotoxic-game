# src/context/ — Gotchas

- Adding/changing actions requires updating **all three**: `ActionTypes` enum, reducer case, and `actionCreators.js`.
- Money/harmony clamping uses shared helpers from `gameStateUtils.js` — don't inline your own clamping.
- `applyInventoryItemDelta` is the canonical inventory mutator — numeric stacks clamp at 0, booleans are explicit ownership toggles. Don't mutate inventory fields directly.
- `delta.flags` is for queue/flag orchestration only — it must not write gameplay stats (e.g. `flags.score` is unsupported by design).
- `START_GIG` resets `gigModifiers` to `DEFAULT_GIG_MODIFIERS`. `COMPLETE_TRAVEL_MINIGAME` does NOT reset the scene — routing is deferred to `useArrivalLogic`.
- Persisted saves must pass `validateSaveData` before state restore. Scene values are validated against an allowlist.
