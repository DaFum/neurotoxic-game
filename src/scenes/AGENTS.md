# src/scenes/ — Gotchas

- `PreGig.jsx` imports `MODIFIER_COSTS` from `economyEngine.js` — never re-declare cost values inline. Both the UI preview and PostGig expense calculation must use the same constant.
- `START_GIG` reducer resets `gigModifiers` to `DEFAULT_GIG_MODIFIERS` — previous gig modifier selections must not carry forward.
- Gig pipeline must remain coherent: `PREGIG` → `PRE_GIG_MINIGAME` (Roadie Run) → `GIG` → `POSTGIG`.
- `TRAVEL_MINIGAME` routes directly to `PREGIG` for performance nodes via `useArrivalLogic` — the overworld flash is skipped.
- Global overlays are controlled by `App.jsx` — scenes must not duplicate overlay responsibility.
