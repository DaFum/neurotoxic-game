# src/data/ — Gotchas

- `venues.js`: `FESTIVAL` type is assigned for venues with capacity >= 1000.
- `chatter.js`: Default fallback chatter only applies to `MENU`, `OVERWORLD`, `PREGIG`, `POSTGIG`. `GIG` requires explicit conditional chatter entries in `ALLOWED_DEFAULT_SCENES`.
- Event outcomes may apply negative deltas, but reducer safety must remain intact (`money >= 0`, `harmony >= 1`).
- Avoid authored events that can soft-lock progression (no reachable nodes, impossible recovery) unless explicitly designed and tested.
