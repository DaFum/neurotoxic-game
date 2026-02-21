# AGENTS.md — `src/hooks/rhythmGame/`

Scope: Applies to rhythm sub-hooks in this directory.

## Purpose

These hooks split the gig loop into focused responsibilities:

- `useRhythmGameAudio.js` (audio lifecycle and playback coordination)
- `useRhythmGameInput.js` (keyboard mapping and hit handling)
- `useRhythmGameLoop.js` (frame/timing loop)
- `useRhythmGameScoring.js` (scoring/combo/hype transitions)
- `useRhythmGameState.js` (mutable runtime refs + lifecycle guards)

## Code-Aligned Hook Contracts

- **`useRhythmGameState.js`** initialises `accuracy` React state at `100` and exposes both `accuracy` and `setAccuracy` in its return value. All other hooks that need to update accuracy must destructure `setAccuracy` from this hook.
- **`useRhythmGameAudio.js`** returns `{ retryAudioInitialization }` only — not an additional `initializeGigState` alias. It also merges `calculateGigPhysics` result multipliers into `gameStateRef.current.modifiers` (as `drumMultiplier` and `guitarScoreMult`) so the scoring hook can read band-trait bonuses without re-computing them.
- **`useRhythmGameScoring.js`** reads `state.modifiers.drumMultiplier` (physics-aware, set by audio hook) with fallback to the static closure value when computing drum lane points. It calls `setAccuracy(calculateAccuracy(...))` after every hit and miss to keep the live accuracy reading current.

## Best Practices

1. Keep hook boundaries clear; avoid cross-domain logic leaks.
2. Preserve deterministic transition to `POSTGIG` (single completion path).
3. Clean up timers/listeners/audio handles in every early-return branch.
4. Keep return contracts stable unless all callers are updated atomically.

## Safety & Game Rules

- Respect reducer guardrails: money never negative, harmony never <= 0 after clamping.
- Avoid duplicate scene transition dispatches from competing completion triggers.
- Keep input handling pure (no direct DOM mutation except required listeners).

## Validation

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-21._
