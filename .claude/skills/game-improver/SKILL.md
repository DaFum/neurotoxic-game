---
name: game-improver
description: |
  Implement bug fixes, features, balance adjustments, and performance optimizations for NEUROTOXIC.

  Trigger when: asked to fix bugs (state corruption, crashes, logic errors), add features (new items, upgrades, mechanics), tune balance (costs, rewards, difficulty), optimize performance (render loops, memory leaks, bundle size), refactor code (clean up tech debt, improve readability), fix UI inconsistencies (broken layouts, color mismatches), or test new systems.

  Routes to specialists: balance→game-balancing-assistant, audio→audio-debugger-ambient-vs-gig or webaudio-reliability-fixer, UI design→convention-keeper-brutalist-ui, state bugs→state-safety-action-creator-guard.

  Use for: core game logic, feature implementation, bug fixes, performance wins, refactoring, testing. Covers reducer changes, hook logic, data transformations, asset loading, persistence, and end-to-end testing.
---

# Game Improver

Implement production-ready improvements—bug fixes, features, optimizations, and refactoring—for NEUROTOXIC.

## Quick Routing Decision Tree

**Is the issue primarily...?**

| Issue Type | Use This Skill | Else Use |
|-----------|---|---|
| **Gameplay balance** (costs, rewards, difficulty) | ❌ | `game-balancing-assistant` |
| **Audio playback** (music fails, stutters, wrong track) | ❌ | `audio-debugger-ambient-vs-gig` or `webaudio-reliability-fixer` |
| **UI design** (colors, borders, layout, typography) | ❌ | `convention-keeper-brutalist-ui` |
| **State bugs** (reducer errors, invalid transitions) | ✅ | `state-safety-action-creator-guard` |
| **Core logic bug** (game loop, travel cost calc) | ✅ | — |
| **New feature** (upgrade, item, system) | ✅ | — |
| **Performance** (render loops, memory, bundle) | ✅ | — |
| **Testing** (regression, integration, edge cases) | ✅ | — |
| **Refactoring** (extract components, reduce duplication) | ✅ | — |

**Unsure?** Proceed here. If we need a specialist, we'll delegate mid-workflow.

## Core Workflow

### 1. Understand the Request
- What problem are we solving? (user pain, crash, balance, performance)
- What's the affected game system? (economy, progression, audio, UI, state)
- What's the success metric? (no crashes, +X DPS, faster load time, clarity)

### 2. Research & Map Dependencies
- **State**: Which reducers, actions, selectors are involved?
- **UI**: Which components render the feature? Do they need updates?
- **Data**: Which data files (upgrades.js, hqItems.js, events) are affected?
- **Audio**: Does this touch AudioContext or Tone.js?
- **Pixi**: Any scene rendering, animations, or dynamic assets?
- **Localization**: User-facing text? Add i18n keys.
- **Tests**: What should pass/fail after this change?

Use **references/improvement-patterns.md** to find a similar change.

### 3. Plan Implementation
Define:
- **Files to modify**: List top 3-5 files.
- **Changes**: Brief 1–2 sentence summary per file.
- **State mutations**: Any new `ActionTypes` or reducer cases?
- **Tests to add/update**: Which tests validate the fix?
- **Localization**: New i18n keys needed?

### 4. Implement
**State changes**: Use `ActionTypes`, reducers, action creators (together, not separately).
**UI changes**: Follow Tailwind v4 syntax (`@import "tailwindcss"`, color tokens with `--color-` prefix).
**Localization**: All user text via `t('key')`. Namespaced keys (`ui:`, `events:`, etc.). Both `en` and `de`.
**Performance**: Memoize expensive calcs, watch for per-frame allocations, destroy Pixi on unmount.
**Pixi cleanup**: Always use `app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true })`.

See **references/state-mutations.md**, **references/improvement-patterns.md**, **references/performance-guardrails.md**.

### 5. Verify & Test

**Run full test suite** (takes ~3-5 min):
```bash
pnpm run test:all  # lint + test + test:ui in sequence
```

**Run targeted tests** (faster, for iteration):
```bash
# Logic tests
pnpm run test -- tests/path/to/file.test.js

# UI tests
pnpm run test:ui -- tests/path/to/file.test.jsx

# Watch mode (re-run on save)
pnpm run test -- --watch
```

**Build check** (catches import errors, bundle issues):
```bash
pnpm run build
```

**All verification in one command**:
```bash
pnpm run lint && pnpm run test && pnpm run test:ui && pnpm run build
```

See **references/verification-checklist.md** for detailed criteria.

## Core Constraints

**Stack**: React 19.2.4, Vite 8.0.0, Tailwind 4.2.1, Framer Motion 12.36.0, Tone.js 15.5.6. Node 22.13+.
**State Limits**: `player.money >= 0`, `band.harmony ∈ [1, 100]`, `van.fuel ∈ [0, 100]`. Clamp via `gameStateUtils.js`.
**Audio**: Use `audioEngine.getGigTimeMs()` as single clock. Don't access Tone.js directly. Handle suspended AudioContext.
**Pixi**: Destroy on unmount. No memory leaks. Pre-compute, don't allocate per-frame.
**I18n**: ALL user text via `t('key')`. Namespaced (`ui:`, `events:`, etc.). Both `en` and `de`.
**Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.).

## Examples

### Example 1: Bug Fix (State Corruption)

**Input**: "Fix: traveling doesn't deduct fuel correctly"

**Workflow**:
1. Find travel logic: `src/hooks/useOverworldLogic.js` (or `economyEngine.js`)
2. Check reducer: Does `UPDATE_PLAYER` subtract fuel? Check `gameReducer.js`
3. Find test: `tests/travel.test.js` — what's the failing assertion?
4. Fix: Add fuel deduction to travel action payload
5. Test: `pnpm run test -- tests/travel.test.js`
6. Verify bounds: Is fuel clamped to [0, 100]? Check `gameStateUtils.js`

### Example 2: New Feature (Upgrade System)

**Input**: "Add meditation pod upgrade: +1 harmony/day, costs 500"

**Workflow**:
1. Data: Edit `src/data/hqItems.js` — add item with `effect: 'harmony_regen'`
2. Economy: Check `economyEngine.js` — does it handle `harmony_regen` effect?
3. Hook: `useGameLoop.js` — apply effect each day via `ADVANCE_DAY`
4. Tests: Add to `tests/economyEngine.test.js` — verify cost, effect, clamping
5. Localization: Add keys to `public/locales/en.json` and `public/locales/de.json`

### Example 3: Performance (Memory Leak)

**Input**: "Fix: memory grows when switching gigs"

**Workflow**:
1. Suspect: Pixi scene, audio context, event listeners not cleaned up
2. Find scene: `src/scenes/GigScene.jsx` or `src/components/PixiStageController.jsx`
3. Check cleanup: Does `useEffect` clean up? Pixi destroyed on unmount?
4. Fix: Add `app.destroy({...})` in cleanup function
5. Test: Monitor memory in DevTools; watch for growing heap

See **references/improvement-patterns.md** for more complete examples.

_Skill sync: React 19.2.4, Vite 8.0.0, Tailwind 4.2.1 baseline as of 2026-03-18._
