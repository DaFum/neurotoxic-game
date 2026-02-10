---
name: game-improver
description: 'Analyze and implement high-impact improvements for NEUROTOXIC: GRIND THE VOID across gameplay balance, bug fixes, performance, audio reliability, security hardening, and code quality. Use when requests ask to improve mechanics, fix regressions, optimize Pixi.js/Tone.js behavior, add balanced content, or strengthen quality gates while preserving the brutalist aesthetic and project constraints.'
---

**When to use this skill:**

- Requests to improve game mechanics, balance, or progression
- Bug fixes and regression handling
- Performance optimization (Pixi.js rendering, Tone.js audio)
- Audio playback reliability and context lifecycle issues
- Security hardening or code quality improvements
- Refactoring with measurable impact and low regression risk
- Quality gate validation and production readiness checks

# Game Improver

## Objective

Deliver production-ready improvements to the game with measurable impact and low regression risk.

## Workflow

1. Classify the request as one or more tracks: `balance`, `feature`, `bug`, `performance`, `audio`, `security`, `refactor`, `quality-gate`.
2. Read instruction files in this order before edits:
   - `AGENTS.md`
   - `CLAUDE.md` if present
   - relevant folder `src/*/AGENTS.md`
   - `.github/copilot-instructions.md`
3. Inspect affected code paths and existing tests. Prefer minimal, targeted changes before broad refactors.
4. Apply hard constraints:
   - Keep pinned stack versions (React 18, Vite 5, Tailwind 4, Pixi 8, Tone 15).
   - Use Tailwind v4 syntax and CSS variables instead of hardcoded colors.
   - Preserve state invariants: `player.money >= 0`, `band.harmony > 0`.
5. Implement with project patterns:
   - Use action creators and `ActionTypes` for state updates.
   - Ensure Pixi lifecycle cleanup and audio context lifecycle correctness.
   - Keep brutalist UI language and visual conventions consistent.
6. Validate with the quality gate in order:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
7. Report changes with file-level rationale, risk notes, and follow-up actions.

## Skill Routing

Use specialized skills when they directly match the request:

- `game-balancing-assistant`: economy, progression, difficulty tuning.
- `audio-debugger-ambient-vs-gig` or `webaudio-reliability-fixer`: playback or context issues.
- `pixi-lifecycle-memory-leak-sentinel`: scene transitions or memory leaks.
- `state-safety-action-creator-guard`: reducer/action safety and invariants.
- `tailwind-v4-css-variables-enforcer` and `convention-keeper-brutalist-ui`: UI consistency.
- `perf-budget-enforcer`: runtime or bundle budget work.
- `one-command-quality-gate`: verify full repo health quickly.
- `golden-path-test-author`: add integration protection for core flow.

## Scope Map

- `src/context/`: reducers, actions, state transitions.
- `src/hooks/`: orchestration, travel/purchase/rhythm hooks.
- `src/components/`: Pixi rendering and gameplay components.
- `src/utils/`: economy, calculations, audio/game engines.
- `src/data/`: venues, songs, events, balance constants.
- `src/ui/` and `src/scenes/`: brutalist UI and game flow screens.

## References

Use only the reference file that matches the request:

- Read `references/game-improver-playbook.md` for quick guardrails and cross-cutting checks.
- Read `references/operational-workflows.md` for end-to-end execution flow, focus areas, and specialized-skill routing.
- Read `references/implementation-standards.md` for coding standards, state patterns, mechanics constraints, and content design rules.
- Read `references/quality-and-release.md` for escalation criteria, testing strategy, QA checklist, and production/release guidance.
