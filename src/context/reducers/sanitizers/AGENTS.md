# src/context/reducers/sanitizers - Agent Instructions

## Load Sanitization

- `sanitizeBand` in `stateSanitizers.ts` preserves `band.merchPrices` through save/load: whitelist entries by key, validate values with `Number.isFinite(v) && v >= 0`, skip prototype-pollution keys. Extend this pattern for any new per-item numeric map on `BandState`.
- Malformed loaded values should follow existing sanitizer behavior: fall back to defaults or skip invalid entries, never copy untrusted objects wholesale.
- `cityStates` sanitization uses `Number.isFinite(attentionSpan)` (not `typeof === 'number'`) to reject `NaN` and `Infinity`.
- `for...in` over default-shape constants (e.g. `DEFAULT_BAND_STATE.inventory` in `sanitizeBandInventory`) must guard each key with `if (!Object.hasOwn(defaults, key)) continue`. Without the guard, hostile `Object.prototype` additions leak into the sanitized save result.
- Stash hydration in `sanitizeBand` spreads the canonical `CONTRABAND_BY_ID` definition LAST (`{ ...itemObj, ...baseItem }`) so save data can never override definition fields (`value`, `effectType`, `duration`, `type`, `maxStacks`); only per-instance runtime fields (`instanceId`, `applied`, `stacks`) survive from the save, and `stacks` is sanitized to a positive integer. Do not flip the spread order back.
- Legacy-key migrations in sanitizers (e.g. `energy → catering` in `sanitizeGigModifiers`) must only apply when the save lacks the current key — the current key always wins over a stale alias.
- `sanitizePlayer`/`sanitizeBand` own value clamping on load (a direct `LOAD_GAME` bypasses `saveValidator.ts`). The validator's job is type/shape rejection; it still carries legacy in-place clamps (player money and non-negative counters, van condition/breakdown chance, member mood/stamina, band harmony, social counters), but those are not authoritative. Clamp new persisted numeric fields in the sanitizer, never add new clamps to the validator.
- Gig-modifier keys have one whitelist, `sanitizeGigModifierUpdates` (`stateSanitizers.ts`), shared by the `SET_GIG_MODIFIERS` creator, `gigReducer` and `sanitizeGigModifiers`. A runtime flag such as `damaged_gear` must be added there, never to a second list.
