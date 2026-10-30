# Core-Loop and Expedition Scene Polish — Design

Date: 2026-10-19
Status: Draft for review
Branch: `claude/stoic-cori-kano1e`

## Goal

Polish the core-loop scenes (MainMenu, Overworld, PreGig, Gig, PostGig, GameOver) and the
Expedition-mode scenes (TourPrep, RunSummary) on **visual hierarchy and finish**,
**responsive/phone layouts**, and **UX states and copy**. Accessibility/keyboard work is not a
stated goal of this pass; existing behavior must not regress.

Out of scope: minigames (Kabelsalat, RoadieRun, Tourbus, AmpCalibration), Clinic, Credits,
Intro (follow-up groups 2 and 3); any state, reducer, action or audio change.

## Evidence

Baselines captured with `screenshot-state-inject.js` (1280×720) and `screenshot-mobile.js`
(390×844). TourPrep and RunSummary have no fixtures yet, so they are unseen.

| Scene | Desktop | Phone |
| --- | --- | --- |
| MainMenu | Title flush to top edge; subtitle contrast very low | Fine; footer wraps |
| Overworld | Map node labels collide; title crowds radio widget | About 40% of screen is stacked HUD cards; labels pile up; map clipped by `[OPEN MENU]` |
| PreGig | Budget list and setlist clipped at panel bottom | HUD overlaps "PREPARATION" title; fixed-height lists |
| PostGig | Net profit "+€8" glyph mangled | HUD overlaps title and first income row; same glyph bug |
| GameOver | Two identical toasts cover the title | Same; final-statistics panel mostly empty and dim |
| Gig | Acceptable | HUD stacks without grouping; lanes very wide |

## Approach: shared fixes first, then per-scene

### Phase 0 — Baselines

Add `tourprep` and `runsummary` fixtures to
`.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js` (and the mobile run),
following the existing fixture-validation test in
`tests/node/playwright-screenshot-fixture-validation.test.js`. Capture all eight scenes at both
viewports as the "before" set.

### Phase 1 — Shared fixes

| Issue | Suspected cause | Fix |
| --- | --- | --- |
| HUD overlaps scene titles on phone | `src/ui/HUD.tsx:58` is absolutely positioned at the top of every scene; scene wrappers only pad for it at `lg` | Reserve HUD height on phone in scene wrappers; collapse Band Status by default on phone |
| Overworld HUD takes ~40% of phone screen | HUD cards render in flow above the map | Compact top strip; Band Status and Help become drawers |
| PreGig lists clipped | `max-h-[48svh]` / `lg:h-[58svh]` in `SetlistBlock.tsx`, `GigModifiersBlock.tsx`, `PreGig.tsx` | Natural height on phone; visible scroll affordance on desktop |
| Mangled net profit | `font-display` in `NetResult.tsx` likely lacks `+`/`€` glyphs | Sign and currency in the mono face, digits in the display face |
| Duplicate GameOver toasts | Possible fixture artifact or dev double effect (`useSoftlockEffect`) | Root-cause first; dedupe only if it reproduces outside the fixture, otherwise file an issue |

### Phase 2 — Per-scene polish

- **MainMenu:** top margin on the title; subtitle contrast to AA; Expedition entry visually
  distinct from Start Tour. All current actions stay reachable with the same click/keyboard path.
- **Overworld:** map label collision handling; clearer "Next stop" panel.
- **PostGig, GameOver, Gig:** hierarchy and spacing; GameOver gets a populated, readable
  final-statistics state.
- **TourPrep, RunSummary:** specifics decided after Phase 0 baselines. Layout and states only;
  `TourPrepLoadout.tsx` (1,395 lines) is not restructured.

## Guardrails

- EN and DE locale JSON updated together for any copy change.
- Colors via CSS variables / `brandColors.ts` only; no hardcoded hex.
- No control moved or hidden without a reachability test (`src/scenes/AGENTS.md`,
  `src/components/overworld/AGENTS.md`).
- No new dependencies; Tailwind v4 syntax per the repo skill.
- Conventional Commits; one commit series per phase.

## Verification

- Before/after screenshots on the same fixtures with `diff-screenshots.js`.
- Per phase: `pnpm run test:all`, `pnpm run typecheck:core`, `pnpm run deadcode:check`.
- Each defect fix ships with a test that fails without it.

## Open questions

- Whether the duplicate GameOver toast is a real bug (resolved in Phase 1).
- TourPrep and RunSummary defects (resolved after Phase 0).
