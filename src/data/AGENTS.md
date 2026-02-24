# AGENTS.md — `src/data/`

Scope: Applies to all files in `src/data/`.

Nested override: `src/data/events/AGENTS.md` takes precedence for `src/data/events/*`.

## Purpose

`src/data/` is the static content layer for game balance and authored content.

Core files:

- `characters.js`, `venues.js` (FESTIVAL type assigned for Capacity ≥ 1000), `songs.js`
- `hqItems.js`, `upgrades.js`, `upgradeCatalog.js`
- `chatter.js`
- `postOptions.js` (Dictionary for dynamic social media actions and side effects)
- event aggregation entry: `events.js`

## Code-Aligned Data Rules

1. Keep data declarative (no side effects).
2. Preserve schema consistency (IDs, categories, trigger points, delta shape contracts).
3. Ensure newly authored events/content are reachable from active aggregation/resolution paths.
4. Keep balancing changes explicit and reviewable.
5. Avoid embedding HTML/script payloads in narrative strings.

## Safety & Balance

- Data may attempt negative deltas, but reducer safety must remain intact (`money >= 0`, `harmony >= 1`).
- Avoid authored content that unintentionally soft-locks progression unless explicitly designed/tested.
- Keep chatter default-scene assumptions aligned with `ALLOWED_DEFAULT_SCENES` behavior.

## Validation & Test Targets

When data/balance changes, verify relevant suites, e.g.:

- `tests/eventEngine.test.js`
- `tests/eventEngine_resolver.test.js`
- `tests/goldenPath.test.js`

Then run:

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-24._
