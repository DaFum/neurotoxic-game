# Game Improver Playbook

## Deep-Dive Checklist

1. Define target outcome and affected player loop.
2. Identify primary metrics to improve.
3. Trace dependencies across `context`, `hooks`, `utils`, `components`, `data`, and `scenes`.
4. Verify no violation of state invariants or pinned dependency constraints.
5. Add or update tests where regressions are likely.
6. Run lint, tests, and production build before finalizing.

## Balancing Heuristics

- Keep survival pressure meaningful in early and mid-game.
- Ensure late-game rewards do not trivialize travel, harmony, or fuel decisions.
- Tie high variance systems to clear risk and cooldown mechanics.
- Tune with small deltas first and validate with representative play paths.

## Audio Reliability Guardrails

- Confirm user-interaction gating for autoplay policies.
- Reuse and resume existing AudioContext when appropriate.
- Stop gig playback exactly at configured excerpt duration.
- Dispose temporary nodes/listeners on scene teardown.

## Pixi and Performance Guardrails

- Destroy Pixi resources on unmount or scene switch.
- Avoid accidental per-frame allocations in render/update loops.
- Prefer stable object pools or memoized data for frequent updates.
- Verify no FPS or memory regression after changes.

## Security and Integrity Guardrails

- Validate persisted game state before hydrate.
- Clamp computed resource deductions with safe lower bounds.
- Reject invalid transition payloads early.
- Preserve graceful recovery paths for corrupted save data.

## Delivery Standard

- Keep diffs focused on requested behavior.
- Explain why each change exists and what risk it addresses.
- Include verification evidence and note any unrun checks.
