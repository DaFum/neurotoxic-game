# Agent Knowledge Update

**Date:** 2026-02-23
**Agent:** Jules

## Summary

Successfully updated knowledge of the 'NEUROTOXIC: GRIND THE VOID v3.0' codebase.

## Key Findings

### Architecture

- **Tech Stack:** React 19 + Vite + Tailwind + Pixi.js (Rhythm) + Tone.js (Audio).
- **State Management:** Context-based (`GameStateProvider`) with strict safety guards (clamping money/harmony).
- **Design Philosophy:** "Void Worship" - Toxic Green on Void Black, brutalist UI.

### Constraints

- **CSS Variables:** Use `--toxic-green`, `--void-black`, etc.
- **Pixi:** No DOM manipulation in Pixi components; use sprite pooling.
- **Utils:** Pure utility functions for logic; isolate side effects.
- **Audio:** Use `audioEngine` facade, no direct Tone.js access in components.
- **Node Icons**: House (Start), Skull (Club), Flame (Festival), Campfire (Rest), Mystery (Special), Star (Finale).
- **Economy Flow**: Refactored to separate fuel liters (consumed during travel) from gas money (paid only via Refuel). Post-Gig reports are now performance-only.
- **Direct Arrival**: `TRAVEL_MINIGAME` routes directly to `PREGIG` for performance venues via `useArrivalLogic`.

### Verification

- Ran `npm run test` successfully (571 tests passed).
- Codebase is confirmed healthy.

## Next Steps

Ready to assist with specific tasks such as bug fixes, feature implementation, or refactoring.
