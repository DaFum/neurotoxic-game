# AGENTS.md — `src/data/events/`

Scope: Applies to event catalog modules in this directory.

## Purpose

These files define categorized event content consumed by the event engine:

- `band.js`
- `financial.js`
- `gig.js`
- `special.js`
- `transport.js`
- `index.js` (barrel)

`src/data/events.js` aggregates event content for runtime filtering/resolution.

## Best Practices

1. Keep event objects declarative and schema-consistent.
2. Use stable IDs and explicit categories/trigger points.
3. Keep deltas balanced and reviewable; avoid hidden side effects.
4. Provide clear narrative text without HTML/script payloads.

## Safety & State Guardrails

- Event outcomes may reduce resources, but reducer safety must remain intact (`money >= 0`, `harmony >= 1`).
- Avoid creating events that can soft-lock progression (no reachable nodes, impossible recovery) without explicit design intent.

## Validation

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-23._
