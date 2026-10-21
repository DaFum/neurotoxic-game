# Core-Loop and Expedition Scene Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish MainMenu, Overworld, PreGig, Gig, PostGig, GameOver, TourPrep and RunSummary on visual hierarchy, phone layout, and UX states/copy, per `docs/superpowers/specs/2026-10-19-core-loop-scene-polish-design.md`.

**Architecture:** Phase 0 adds screenshot fixtures and captures before images. Phase 1 fixes defects shared across scenes at their root, each with a failing test first. Phase 2 does per-scene finish work, verified by before/after screenshots. Changes are CSS-class and small-component edits inside existing files; no reducer, state, audio or dependency change.

**Tech Stack:** React 19, Tailwind v4 (CSS variables only), motion (`motion/react-m`), i18next (EN + DE), Vitest + Testing Library (`pnpm exec vitest run`), `node:test` for node suites, Playwright screenshot scripts under `.claude/skills/playwright-screenshot/scripts/`.

**Conventions every task follows** (from `AGENTS.md`):

- Single Vitest file: `pnpm exec vitest run tests/<file>.test.jsx`. Single node test: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`.
- No hardcoded colors (CSS variables / existing Tailwind tokens only). EN and DE locale JSON change together. No `@ts-ignore`, `any`, `.propTypes`.
- Commits use Conventional Commits and end with:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_016ofjkbGDku2xFdPVinywXC`.
- Screenshots and scratch output go to the scratchpad directory, never into the repo.

**Evidence status.** Diagnosed in source: tasks 3, 4, 5. Hypothesis to confirm in the task's first step: tasks 6, 7, 8. Decided only after Phase 0 baselines: tasks 9, 10 (see the Triage gate after Task 2).

---

## File Structure

| File | Change | Responsibility |
| --- | --- | --- |
| `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js` | Modify | Add `tourprep`, `runsummary` fixtures |
| `tests/node/playwright-screenshot-fixture-validation.test.js` | Modify | Pin the new fixtures through `handleLoadGame` |
| `src/components/postGig/NetResult.tsx` | Modify | Legible net-profit amount |
| `tests/ui/NetResult.test.jsx` | Modify | Pin the font change |
| `src/scenes/PostGig.tsx`, `src/scenes/PreGig.tsx` | Modify | Phone clearance below the global HUD |
| `src/hooks/travel/effects/useSoftlockEffect.ts` | Modify | One stranded toast per softlock episode |
| `tests/hooks/travel/useSoftlockEffect.toast.test.jsx` | Create | Pin single toast |
| `src/components/pregig/SetlistBlock.tsx`, `GigModifiersBlock.tsx` | Modify | Scroll affordance, no silent clipping |
| `src/scenes/gameover/GameOverStats.tsx` | Modify | Readable final-statistics state |
| `src/scenes/mainmenu/MainMenuHeader.tsx` | Modify | Subtitle contrast, top spacing |
| `src/components/MapNodeView.tsx` | Modify | Overworld label collisions (Task 9) |
| `src/scenes/TourPrep.tsx`, `src/scenes/RunSummary.tsx` | Modify | Per triage (Task 10) |
| `public/locales/{en,de}/ui.json` (or the repo's locale path) | Modify only if copy changes | Locale parity |

---

## PHASE 0 — Baselines

### Task 1: `tourprep` screenshot fixture

**Files:**

- Modify: `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js` (add after the `gameover`/`clinic` fixtures, inside `FIXTURES`)
- Test: `tests/node/playwright-screenshot-fixture-validation.test.js`

`TourPrep` dispatches `prepareExpeditionRun()` on entry when `expedition.status === 'idle'`, so the fixture needs only the scene.

- [ ] **Step 1: Write the failing test.** Append inside the existing `describe('Playwright Screenshot Fixtures', ...)` block:

```js
  test('expedition scene fixtures survive handleLoadGame and name a real scene', () => {
    for (const name of ['tourprep', 'runsummary']) {
      ok(Object.hasOwn(FIXTURES, name), `fixture "${name}" is missing`)
      const scene = FIXTURES[name].state.currentScene
      ok(
        ALLOWED_SCENE_VALUES.has(scene),
        `fixture "${name}" targets unknown scene "${scene}"`
      )
    }
    strictEqual(FIXTURES.tourprep.state.currentScene, 'TOUR_PREP')
    strictEqual(FIXTURES.runsummary.state.currentScene, 'RUN_SUMMARY')
  })
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/playwright-screenshot-fixture-validation.test.js`
Expected: FAIL with `fixture "tourprep" is missing`. If `ALLOWED_SCENE_VALUES` is an array instead of a `Set`, change `.has` to `.includes`.

- [ ] **Step 3: Add the fixture.**

```js
  tourprep: {
    description: 'Expedition TourPrep build screen',
    state: { currentScene: 'TOUR_PREP' },
    waitFor: async page =>
      page.locator('h2').first().waitFor({ state: 'visible', timeout: 15000 })
  },
```

- [ ] **Step 4: Run the test.** Only the `tourprep` half can pass until Task 2 adds `runsummary`; confirm the failure message is now `fixture "runsummary" is missing`.

- [ ] **Step 5: Commit** after Task 2 (the two fixtures share one test).

### Task 2: `runsummary` fixture and baseline capture

**Files:**

- Modify: `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- Reference: `tests/expeditionLifecycleFixture.js` (`startedState`, `walkToFinale`), `src/types/expedition.d.ts:461-483`

`RunSummary` reads `state.expedition.outcome` (`ExpeditionOutcome`) and `state.career.betweenTourByRunId`. The save sanitizers may drop unknown fields silently (see the note in the playwright-screenshot skill), so the fixture is proven by the validation test and a capture, not by reading it.

- [ ] **Step 1: Add the fixture.**

```js
  runsummary: {
    description: 'Expedition RunSummary settlement screen (extracted run)',
    state: {
      currentScene: 'RUN_SUMMARY',
      player: { money: 480, fame: 350 },
      expedition: {
        status: 'extracted',
        runId: 'fixture-run-1',
        outcome: {
          runId: 'fixture-run-1',
          kind: 'extracted',
          reason: null,
          finalizedAtRouteStep: 6,
          settlement: {
            retentionRate: 0.75,
            moneyEarned: 800,
            moneyRetained: 600,
            moneyForfeited: 200,
            fameEarned: 120,
            fameRetained: 90,
            fameForfeited: 30,
            retainedRewardEntryIds: [],
            abandonedRewardEntryIds: []
          },
          finaleResultId: null
        }
      }
    },
    waitFor: async page =>
      page.locator('h2').first().waitFor({ state: 'visible', timeout: 15000 })
  },
```

- [ ] **Step 2: Extend the validation test** so it proves the outcome survives the sanitizers. Add to the test from Task 1:

```js
    const loaded = handleLoadGame(
      createInitialState(),
      { type: 'LOAD_GAME', payload: deepMerge(BASE_STATE, FIXTURES.runsummary.state) }
    )
    strictEqual(loaded.expedition.outcome?.runId, 'fixture-run-1')
    strictEqual(loaded.expedition.outcome?.settlement.moneyRetained, 600)
```

Check how the existing tests in this file call `handleLoadGame` (they already import it) and copy that call shape exactly; adjust argument order if it differs.

- [ ] **Step 3: Run the test.** If `outcome` comes back `null`, a sanitizer rejects the fixture: read the expedition sanitizer in `src/context/reducers/systemReducer.ts`'s load path, add the missing required fields (for example `status`, `runDraftTraitIds`, `pressure`) from `createDefaultExpeditionState()` in `src/domain/expedition/defaults.ts`, and rerun until it passes.

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/playwright-screenshot-fixture-validation.test.js`
Expected: PASS, all tests.

- [ ] **Step 4: Commit.**

```bash
git add .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js tests/node/playwright-screenshot-fixture-validation.test.js
git commit -m "test(screenshots): add TourPrep and RunSummary fixtures"
```

- [ ] **Step 5: Capture baselines** (scratchpad paths; start the dev server, keep its pid, stop it at the end).

```bash
S=.claude/skills/playwright-screenshot/scripts
D=<scratchpad>/shots/before
mkdir -p $D/desktop $D/mobile
(pnpm run dev > <scratchpad>/dev.log 2>&1 & echo $! > <scratchpad>/dev.pid)
sleep 8; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173   # expect 200
for f in menu overworld pregig postgig gameover gig tourprep runsummary; do
  OUT_DIR=$D/desktop node $S/screenshot-state-inject.js $f
done
OUT_DIR=$D/mobile node $S/screenshot-mobile.js menu overworld pregig postgig gameover gig tourprep runsummary
```

Expected: eight `✓` lines per run, no thrown "mislabelled screenshot" errors.

- [ ] **Step 6: Re-capture `menu` and `gameover` with a settle wait.** The first pass showed no secondary buttons on desktop `menu` and an empty stats panel on `gameover`; both scenes animate in with delays (`delay: 1.2` plus per-row `1.4 + i*0.15` in `GameOverStats`). If the images still lack content after `waitForTimeout(3000)`, that is a real defect and goes into the triage list.

### Triage gate (not a task to skip)

- [ ] Read all 16 baseline images. Write findings for `tourprep`, `runsummary`, `menu` (desktop) and `gameover` into a short addendum at the end of this file under `## Triage addendum`, each as: file, defect, one-line fix. Tasks 9 and 10 are written from that addendum. Do not start them before it exists.

---

## PHASE 1 — Shared fixes

### Task 3: Mangled net-profit amount (`NetResult`)

**Files:**

- Modify: `src/components/postGig/NetResult.tsx:34`
- Test: `tests/ui/NetResult.test.jsx`

The amount renders in `font-display` (Metal Mania, `src/index.css:251`) and the `+€8` glyphs collide. Whatever the exact glyph cause, the Azeret Mono face already used by the report rows renders `+€69` cleanly in the same screenshot, so the amount moves to it.

- [ ] **Step 1: Write the failing test** (append to `tests/ui/NetResult.test.jsx`):

```jsx
  it('renders the amount in the mono face so the sign and euro glyphs stay legible', () => {
    render(<NetResult net={8} />)

    const netEl = screen.getByTestId('post-gig-net-result-value')
    expect(netEl.className).toContain('font-mono')
    expect(netEl.className).not.toContain('font-display')
  })
```

- [ ] **Step 2: Run to verify it fails.**

Run: `pnpm exec vitest run tests/ui/NetResult.test.jsx`
Expected: FAIL (`expected ... to contain 'font-mono'`).

- [ ] **Step 3: Implement.** In `NetResult.tsx` replace `font-display tabular-nums` with `font-mono tabular-nums` in the value element's class string:

```tsx
        className={`text-3xl sm:text-5xl font-bold font-mono tabular-nums leading-tight break-words ${
```

- [ ] **Step 4: Run the test file.** Expected: PASS (all NetResult tests).

- [ ] **Step 5: Verify visually.** Re-capture `postgig` desktop and phone to `<scratchpad>/shots/after`, read the net-profit crop, and confirm `+€8` reads as three distinct characters. If it does not, stop and report the actual cause.

- [ ] **Step 6: Commit.**

```bash
git add src/components/postGig/NetResult.tsx tests/ui/NetResult.test.jsx
git commit -m "fix(postgig): render net profit in mono face for legible sign and euro"
```

### Task 4: Phone clearance below the global HUD (PostGig, PreGig, RunSummary)

**Files:**

- Modify: `src/scenes/PostGig.tsx:79` (wrapper), `src/scenes/PreGig.tsx:55` (wrapper), `src/scenes/RunSummary.tsx:130` (wrapper; its class is `w-full h-full bg-void-black relative overflow-y-auto flex flex-col items-center p-3 sm:p-6 lg:p-8`; add `max-sm:pt-44` after `p-3`)
- Test: `tests/ui/PostGig.component.test.jsx`, and the RunSummary scene test (find with `ls tests/ui | grep -i runsummary`)

`HUD.tsx:58` is `absolute top-0` on every scene. At 390px wide the player card ends about 114px down and the collapsed control button about 171px down. `PostGig`'s wrapper has `p-3` only, so the HUD covers the title and first row; `PreGig` has `pt-28` (112px), which only just touches the card.

- [ ] **Step 1: Write the failing test** (append to `tests/ui/PostGig.component.test.jsx`, reusing that file's existing render helper and mocks):

```jsx
  it('reserves phone space below the global HUD', () => {
    renderPostGig()   // use the existing helper in this file; match its actual name
    const screen = within(document.body).getByTestId('post-gig-screen')
    expect(screen.className).toContain('max-sm:pt-44')
  })
```

Open the file first and use whatever render helper and imports it already has.

- [ ] **Step 2: Run to verify it fails.**

Run: `pnpm exec vitest run tests/ui/PostGig.component.test.jsx`
Expected: FAIL on `max-sm:pt-44`.

- [ ] **Step 3: Implement.**
  - `PostGig.tsx`: in the `post-gig-screen` wrapper class string add `max-sm:pt-44` after `p-3`.
  - `PreGig.tsx`: change `pt-28 sm:pt-32` to `pt-44 sm:pt-32` (the 112px value is below the 114px card; `sm` and up are unchanged).

- [ ] **Step 4: Run** `pnpm exec vitest run tests/ui/PostGig.component.test.jsx tests/ui/PreGig*.test.jsx`. Expected: PASS.

- [ ] **Step 5: Verify visually** at 390×844 for `pregig` and `postgig`: no HUD card overlaps the title or first row.

- [ ] **Step 6: Commit.**

```bash
git add src/scenes/PostGig.tsx src/scenes/PreGig.tsx tests/ui/PostGig.component.test.jsx
git commit -m "fix(scenes): clear the global HUD on phone in PreGig and PostGig"
```

### Task 5: Duplicate "Stranded" toast (`useSoftlockEffect`)

**Files:**

- Modify: `src/hooks/travel/effects/useSoftlockEffect.ts:53-126`
- Create: `tests/hooks/travel/useSoftlockEffect.toast.test.jsx`

Diagnosed: the effect's cleanup clears `refs.timeoutRef.current`, so any dependency change (a new `player` object) while stranded re-runs the effect, finds `timeoutRef` empty, and fires another `addToast` and a second 3-second timer. A softlock episode should toast once.

- [ ] **Step 1: Write the failing test.** The hook has many collaborators, so mock the ones that decide "stranded":

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('../../../src/utils/mapUtils', () => ({
  checkSoftlock: vi.fn(() => true)
}))
vi.mock('../../../src/utils/travelSoftlockUtils', () => ({
  getSellableAssets: () => [],
  getPostSaleScenarios: () => []
}))
vi.mock('../../../src/utils/assetSelectors', () => ({
  getActiveAssetModifiers: () => ({}),
  getTotalDailyObligations: () => 0
}))
vi.mock('../../../src/utils/travelUtils', () => ({
  getNodeAccessStatus: () => ({ allowed: true })
}))

import { useSoftlockEffect } from '../../../src/hooks/travel/effects/useSoftlockEffect'

const makeProps = (addToast, player) => ({
  refs: { timeoutRef: { current: null } },
  state: { isTraveling: false },
  params: {
    gameMap: { nodes: {}, connections: [] },
    player,
    band: {},
    social: {},
    assets: [],
    liabilities: [],
    addToast,
    saveGame: vi.fn(),
    changeScene: vi.fn(),
    venueBlacklist: [],
    reputationByRegion: {}
  }
})

describe('useSoftlockEffect', () => {
  beforeEach(() => vi.useFakeTimers())

  it('toasts once per softlock episode even when player identity changes', () => {
    const addToast = vi.fn()
    const first = makeProps(addToast, { currentNodeId: 'a', day: 3 })
    const { rerender } = renderHook(p => useSoftlockEffect(p), {
      initialProps: first
    })
    // New player object, same stranded situation, same refs bundle.
    rerender({
      ...first,
      params: { ...first.params, player: { currentNodeId: 'a', day: 3 } }
    })
    expect(addToast).toHaveBeenCalledTimes(1)
  })
})
```

Adjust import paths if `tests/hooks/travel` is nested differently, and mirror any helper the neighbouring travel tests already provide.

- [ ] **Step 2: Run to verify it fails.**

Run: `pnpm exec vitest run tests/hooks/travel/useSoftlockEffect.toast.test.jsx`
Expected: FAIL with `expected "spy" to be called 1 times, but got 2 times`. If it fails for any other reason (mock shape, missing param), fix the test setup until it fails for this reason.

- [ ] **Step 3: Implement.** In `useSoftlockEffect.ts`, add `useRef` to the import and a guard:

```ts
import { useEffect, useRef } from 'react'
```

```ts
  // One toast per softlock episode: the cleanup below clears the timer on every
  // dependency change, so the timer alone cannot tell a new episode from a re-run.
  const toastedRef = useRef(false)
```

Change the stranded branch:

```ts
      if (!refs.timeoutRef.current) {
        logger.error('TravelLogic', 'GAME OVER: Stranded')
        if (!toastedRef.current) {
          toastedRef.current = true
          addToast(
            i18n.t('ui:travel.errors.gameOverStranded', {
              defaultValue:
                'GAME OVER: Stranded! Cannot travel and cannot afford fuel.'
            }),
            'error'
          )
        }
        refs.timeoutRef.current = setTimeout(() => {
          saveGame(false)
          changeScene(GAME_PHASES.GAMEOVER)
        }, 3000)
      }
```

and in the `else` (no longer stranded) branch, reset it:

```ts
    } else {
      toastedRef.current = false
      if (refs.timeoutRef.current) {
```

- [ ] **Step 4: Run the new test and the neighbours.**

Run: `pnpm exec vitest run tests/hooks/travel`
Expected: PASS.

- [ ] **Step 5: Negative gate.** Revert only the `toastedRef` lines (`git diff <base> -- src/hooks/travel/effects/useSoftlockEffect.ts > <scratchpad>/x.patch && git apply -R <scratchpad>/x.patch`), confirm the new test fails, then `git apply <scratchpad>/x.patch`.

- [ ] **Step 6: Commit.**

```bash
git add src/hooks/travel/effects/useSoftlockEffect.ts tests/hooks/travel/useSoftlockEffect.toast.test.jsx
git commit -m "fix(travel): toast the stranded game over once per episode"
```

### Task 6: PreGig lists clipped without an affordance

**Files:**

- Modify: `src/components/pregig/SetlistBlock.tsx:170,182`, `src/components/pregig/GigModifiersBlock.tsx:51`, `src/scenes/PreGig.tsx:112`
- Test: `tests/ui/` PreGig block tests (find with `ls tests/ui | grep -i pregig`)

Confirmed in the baselines: at 1280×720 the 4th setlist row and the 5th budget row are cut by the panel bottom with nothing indicating more. On phone each list is a nested scroll box (`max-h-[48svh]` / `max-h-[38svh]`).

- [ ] **Step 1: Write the failing test.** Assert the scroll region is reachable and labelled, and that the phone caps are gone:

```jsx
  it('lets the setlist take its natural height on phone', () => {
    renderSetlistBlock()   // use the existing helper/props in the SetlistBlock test file
    const region = screen.getByRole('region', { name: /setlist/i })
    expect(region.className).not.toContain('max-h-[48svh]')
    expect(region.className).toContain('lg:overflow-y-auto')
  })
```

Use the existing test file's render helper and props; the region role and name come from Step 3.

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL (no `region` role yet).

- [ ] **Step 3: Implement.**
  - `SetlistBlock.tsx:170`: change the container to
    `className='border-2 border-ash-gray/40 p-4 bg-void-black/70 backdrop-blur-sm flex flex-col min-h-0 lg:max-h-none'` (drop the phone/`sm` `max-h` caps) and add `role='region'` with `aria-label={t('ui:pregig.setlist')}`.
  - `SetlistBlock.tsx:182`: scroll only from `lg` and add a bottom fade as the affordance:
    `className='flex-1 min-h-0 lg:overflow-y-auto pr-0 sm:pr-2 space-y-2 lg:[mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)]'`
  - `GigModifiersBlock.tsx:51`: replace `overflow-y-auto min-h-0 max-h-[38svh] sm:max-h-[42svh] lg:max-h-none` with `min-h-0 lg:overflow-y-auto` and the same `lg:[mask-image:...]`.
  - Keep `PreGig.tsx:112` (`lg:h-[58svh]`) so desktop still fits one screen.

- [ ] **Step 4: Run** `pnpm exec vitest run tests/ui/PreGig*.test.jsx tests/ui/*Setlist*.test.jsx`. Expected: PASS.

- [ ] **Step 5: Verify visually** (desktop and phone `pregig`): phone shows full lists in page scroll; desktop shows a fade at the cut edge.

- [ ] **Step 6: Commit.**

```bash
git add src/components/pregig src/scenes/PreGig.tsx tests/ui
git commit -m "fix(pregig): drop phone height caps and fade the desktop scroll edge"
```

---

## PHASE 2 — Per-scene polish

### Task 7: GameOver final-statistics state — DROPPED after triage

The settled captures (`shots/before/settled/gameover-*`) show a fully populated, readable panel on desktop and phone. The dim/empty look in the first capture was only the entrance animation (rows appear at 1.4s+). No defect; the duplicate toast that covered the title is Task 5.

### Task 8: MainMenu footer overlaps the Features button on short viewports

**Files:**

- Modify: `src/scenes/mainmenu/MainMenuFooter.tsx:11-12`
- Test: the MainMenu tests (`ls tests/ui | grep -i mainmenu`; add the new test to the file that already renders the footer, or `tests/ui/MainMenuFooter.test.jsx` if none does)

Confirmed from the settled capture at 1280x720: the footer is `absolute bottom-4 sm:bottom-6`, while the button stack is vertically centered, so the "(c) 2026 ..." line is drawn over the Features button. Subtitle contrast and title spacing are fine once the entrance animation settles (no change there).

- [ ] **Step 1: Write the failing test.** The footer must be in normal flow, not absolutely positioned:

```jsx
  it('sits in normal flow so it can never overlap the buttons above it', () => {
    const { container } = render(<MainMenuFooter />)
    const root = container.firstElementChild
    expect(root.className).not.toContain('absolute')
    expect(root.className).toContain('mt-')
  })
```

Use the file's existing imports and i18n/motion mocks.

- [ ] **Step 2: Run to verify it fails.** Expected: FAIL (`absolute` present).

- [ ] **Step 3: Implement.** In `MainMenuFooter.tsx` replace `absolute bottom-4 sm:bottom-6 flex w-full flex-col items-center gap-1 z-(--z-overlay) px-4` with `mt-8 sm:mt-10 flex w-full flex-col items-center gap-1 z-(--z-overlay) px-4`.

- [ ] **Step 4: Run** `pnpm exec vitest run tests/ui/MainMenu*.test.jsx`. Expected: PASS, including every existing reachability test for Start Tour, Start Expedition, Load Game, Band HQ, Socials, Credits and Features.

- [ ] **Step 5: Verify visually** at 1280x720 and 390x844 with a 4s settle (use the scratch `settled.mjs` approach): footer sits below Features with no overlap, and the page still scrolls to it on short viewports.

- [ ] **Step 6: Commit** `fix(mainmenu): keep the footer in flow so it cannot overlap Features`.

### Task 9: Overworld label collisions — from triage addendum

**Files:** `src/components/MapNodeView.tsx` (label stack, around lines 439-560), existing overworld tests.

Existing behavior to preserve: labels for non-actionable nodes are already `max-sm:hidden` (`labelMobileHiddenClass`), and the label stack is an opaque chip so overlaps occlude rather than blend. Write this task from the triage addendum after Phase 0. Required shape: failing class/structure test, minimal change, desktop and phone before/after screenshots of `overworld`.

### Task 10: TourPrep and RunSummary — resolved by triage

- **RunSummary:** on phone the HUD covers the title and the first rows. Same defect as PostGig; fixed in Task 4.
- **TourPrep:** no defect found on desktop or phone. It already reserves `pt-48 sm:pt-44 lg:pt-44` and its tabs wrap cleanly. No change.

---

## Final verification (Task 11)

- [ ] **Step 1: Capture the after set** for all eight scenes at both viewports to `<scratchpad>/shots/after`, and run `node .claude/skills/playwright-screenshot/scripts/diff-screenshots.js <before> <after>`. Read the images of every scene that changed; confirm each intended fix and look for regressions.
- [ ] **Step 2: Run the PR gate.**

```bash
pnpm run test:all
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run sync:agents   # only if AGENTS.md changed; expect no diff otherwise
```

Expected: all green. Report any failure with its output; never weaken a test.

- [ ] **Step 3: Locale parity.** If any copy changed, confirm EN and DE keys match: `pnpm run test:additional`.
- [ ] **Step 4: Stop the dev server by pid** (`kill $(cat <scratchpad>/dev.pid)`) and confirm with `ps -eo pid,args | grep "[v]ite/bin/vite.js"`.
- [ ] **Step 5: Open items.** File a GitHub issue (search duplicates first, link the originating PR) for each deferred finding, and list the issue numbers in the final report.

---

## Self-review against the spec

| Spec item | Task |
| --- | --- |
| Phase 0 fixtures and baselines | 1, 2 |
| HUD overlaps titles on phone | 4 |
| Overworld HUD takes ~40% of phone | Not planned as written: `OverworldHUD` already collapses Band Status on phone and has an expedition one-line mode. Revisit from the triage addendum (Task 9) |
| PreGig lists clipped | 6 |
| Net profit mangled | 3 |
| Duplicate GameOver toast | 5 |
| MainMenu | 8 |
| Overworld labels | 9 |
| PostGig, Gig hierarchy | 4 (PostGig clearance); Gig has no confirmed defect beyond phone HUD grouping, to be re-evaluated from the baselines |
| GameOver stats | 7 |
| TourPrep, RunSummary | 10 |
| Guardrails, verification | Conventions block, 11 |

Spec deviation to confirm: the spec's "collapse Band Status by default on phone" and "compact Overworld HUD strip" are already implemented in `BandStatusPanel` (`expanded` defaults to false below `sm`) and `OverworldHUD` (`expeditionActive` mode), so this plan does not re-implement them.

---

## Triage addendum (from the Phase 0 baselines, 2026-10-19)

| Scene | Finding | Disposition |
| --- | --- | --- |
| TourPrep (desktop, phone) | None | No change |
| RunSummary (desktop) | None | No change |
| RunSummary (phone) | HUD covers title and first rows | Task 4 |
| GameOver (settled, both) | Populated and readable | Task 7 dropped; duplicate toast is Task 5 |
| MainMenu (settled, desktop) | Footer overlaps the Features button | Task 8 |
| MainMenu subtitle, title spacing | Fine once settled | No change |
| Overworld | Label pile-up on phone, dense desktop clusters | Task 9, written from the baselines |

---

## Execution status (2026-10-19)

| Task | Status | Commit |
| --- | --- | --- |
| 1-2 Fixtures and baselines | Done | 8d76152 |
| 3 Net profit mono face | Done | 6caf351 |
| 4 HUD clearance (PostGig, PreGig, RunSummary) | Done | a111ae1 |
| 5 Single stranded toast | Done | 1d212f5 |
| 6 PreGig list clipping | Done | dd4d241 |
| 7 GameOver stats | Dropped (no defect once settled) | - |
| 8 MainMenu footer overlap | Done, plus safe-centering follow-up | ee4d714, 4b0d4ac |
| 9 Overworld labels | Deferred: design decision, #3170 | - |
| 10 TourPrep / RunSummary | Resolved by triage (RunSummary via Task 4) | - |
| 11 Final verification | Narrow tests and screenshots done locally; full suite is left to CI | - |

Open items filed: #3169 (stranded countdown restarts), #3170 (Overworld label collisions), #3171 (screenshot diff tool compares nothing without pixelmatch), #3172 (Gig phone HUD, Clinic, Credits, Intro, minigames).
