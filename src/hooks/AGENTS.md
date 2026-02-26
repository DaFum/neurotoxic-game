# src/hooks/ — Gotchas

- `useRhythmGameLogic` stats memo includes `accuracy` (0–100) alongside `score`, `combo`, `health`, etc. `GigHUD` and the "LOW ACC" warning depend on this field being present and numeric.
- Gig completion must flow through a single resolved path to `POSTGIG` — prevent duplicate scene transitions from concurrent completion triggers.
- `useArrivalLogic` owns arrival routing (autosave, event trigger, day advance, direct PREGIG entry for performance nodes). Don't duplicate this logic elsewhere.
