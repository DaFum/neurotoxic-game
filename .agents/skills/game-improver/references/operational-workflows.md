# Operational Workflows

## Table Of Contents

1. Core Responsibilities
2. Project Context Awareness
3. Analysis Process
4. Key Areas Of Focus
5. Specialized Skills Integration
6. Performance Optimization Workflow
7. Example Improvement Workflows

## Core Responsibilities

1. Analyze and improve gameplay balance, progression, economy, and risk-reward loops.
2. Implement feature enhancements that fit the brutalist style and German tour setting.
3. Detect, reproduce, and fix bugs, compatibility issues, and regressions.
4. Harden security against save tampering and exploit paths.
5. Optimize performance for smooth rendering and responsive interaction.
6. Raise code quality through refactoring, tests, and clearer error handling.
7. Expand content (events, venues, songs, upgrades) with balanced outcomes.

## Project Context Awareness

- Read repo guidance in strict order before edits: root instructions, nested instructions, and coding standards.
- Preserve pinned stack assumptions (React 18, Vite 5, Tailwind 4, Pixi 8, Tone 15).
- Preserve brutalist UI intent: uppercase, boxy layout language, direct copy, and strong contrast.
- Preserve German tour authenticity for places, naming, and narrative framing.
- Integrate threat-model intent when touching persistence, input handling, or loading paths.

## Analysis Process

1. Parse request scope and affected systems.
2. Gather implementation context from relevant files.
3. Identify concrete issues, constraints, and opportunities.
4. Design minimal-change solutions first, then broaden if needed.
5. Implement and validate with tests and quality gates.
6. Summarize changes, risks, and rationale with file references.

## Key Areas Of Focus

### Gameplay Balancing

- Economy tuning in utility/data layers so growth never eliminates strategic pressure.
- Rhythm scoring and difficulty progression that reward skill and consistency.
- Progression and upgrade pacing that keep tradeoffs meaningful.
- Risk-reward outcomes that are understandable and non-trivial.

### Technical Improvements

- Pixi rendering lifecycle correctness and stable frame pacing.
- WebAudio lifecycle reliability and browser-compliant startup behavior.
- State transitions, reducer safety, and render efficiency.
- Memory safety across Pixi resources, listeners, and audio nodes.
- Input and persistence hardening against invalid or tampered state.

### Content Expansion

- Events with clear conditions, consequences, and cooldown discipline.
- Venue additions grounded in realistic regional flavor and difficulty.
- Song and rhythm content balanced for density, readability, and challenge.
- Upgrade trees that create playstyle differentiation without breaking balance.

## Specialized Skills Integration

- `game-balancing-assistant`: formulas, progression, payout/cost curves.
- `audio-debugger-ambient-vs-gig`: ambient vs excerpt behavior, timing boundaries.
- `webaudio-reliability-fixer`: autoplay/context lifecycle failures.
- `pixi-lifecycle-memory-leak-sentinel`: cleanup and memory pressure.
- `state-safety-action-creator-guard`: reducer/action invariants.
- `tailwind-v4-css-variables-enforcer`: Tailwind v4 + CSS variable compliance.
- `convention-keeper-brutalist-ui`: style consistency in UI composition/copy.
- `perf-budget-enforcer`: runtime and bundle budget guardrails.
- `refactor-with-safety`: behavior-preserving structural cleanup.
- `one-command-quality-gate`: lint, test, build verification.
- `debug-ux-upgrader`: debug overlays and diagnostics.
- `min-repro-builder`: isolated reproduction environments.
- `ci-hardener`: CI speed/reliability improvements.
- `release-notes-synthesizer`: release summary generation.
- `asset-pipeline-verifier`: asset resolution and integrity checks.

## Performance Optimization Workflow

1. Profile first to locate dominant bottlenecks.
2. Optimize Pixi render/update paths and resource handling.
3. Analyze build output and chunk composition.
4. Audit leaks in scene transitions and teardown paths.
5. Ensure audio resources are resumed/suspended/disposed correctly.
6. Reduce unnecessary re-renders and expensive state churn.
7. Re-test with representative gameplay scenarios.

## Example Improvement Workflows

### Economy Rebalance

1. Measure where progression flattens.
2. Adjust cost/payout multipliers in small deltas.
3. Validate outcomes over multiple route paths.
4. Add tests for changed formula boundaries.

### Audio Reliability Fix

1. Reproduce on target browser/device.
2. Verify context state transitions and gating.
3. Correct lifecycle and cleanup points.
4. Re-test scene transitions and long sessions.

### UI/Debug Enhancement

1. Add feature toggle with safe default-off behavior.
2. Keep visual treatment aligned with brutalist conventions.
3. Confirm no measurable overhead when disabled.

### Save Integrity Hardening

1. Validate incoming persisted payloads.
2. Clamp invalid values and reject impossible transitions.
3. Provide graceful fallback/recovery path.
