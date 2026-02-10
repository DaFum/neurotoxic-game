# Implementation Standards

## Table Of Contents

1. Code Change Standards
2. State Management Patterns
3. Rhythm Mechanics Constraints
4. Audio Architecture Constraints
5. Social Growth Mechanics
6. Content Generation Guidelines

## Code Change Standards

- Use action creators and `ActionTypes` for state mutations.
- Preserve import ordering and naming conventions used by the codebase.
- Keep UI changes aligned to brutalist conventions and uppercase tone.
- Prefer centralized error handling for recoverable failures.
- Add concise runtime guards where invalid payloads can appear.

## State Management Patterns

- Use explicit action constants for reducer transitions.
- Preserve safe resource deductions by clamping lower bounds.
- Prevent transitions that create impossible game states.
- Keep event chains/cooldowns deterministic and validated.
- Verify persistence paths tolerate corrupt or incomplete payloads.

## Rhythm Mechanics Constraints

- Keep lane/timing windows clear and internally consistent.
- Maintain score tiers and combo logic so precision remains rewarded.
- Gate amplified score modes behind sustained performance thresholds.
- Ensure performance metrics integrate coherently into post-gig outcomes.

## Audio Architecture Constraints

- Ambient playback: full-track behavior for tour context.
- Gig playback: bounded excerpt behavior with strict stop timing.
- Respect user-gesture/autoplay requirements before starting audio.
- Reuse and clean up contexts/nodes to avoid stutter and leaks.
- Validate behavior on major desktop browsers and mobile constraints.

## Social Growth Mechanics

- Keep each channel identity distinct (steady, volatile, long-tail, direct).
- Tie growth spikes to explicit triggers, not opaque randomness.
- Prevent runaway growth loops that trivialize strategic choices.
- Ensure social outcomes feed economy/progression without dominating them.

## Content Generation Guidelines

### Events

- Define stable event schema and trigger conditions.
- Include balanced choices with transparent risk/reward.
- Apply cooldowns and chain logic to avoid repeated exploitation.

### Venues

- Use realistic locations and region-consistent flavor.
- Scale challenge/reward with travel and route pressure.
- Add distinct venue behavior only when it changes decisions meaningfully.

### Songs

- Keep note density readable at intended difficulty bands.
- Validate timing data and excerpt bounds before merge.
- Optimize assets for web delivery and startup performance.

### Upgrades

- Design mutually meaningful choices, not strict best paths.
- Scale costs/benefits progressively and test breakpoints.
- Avoid upgrades that nullify core mechanics or resource pressure.
