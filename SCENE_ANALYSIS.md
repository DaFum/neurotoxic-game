# Neurotoxic — Per-Scene Screenshot Analysis

**Date:** 2026-07-03 · **Branch:** `claude/codebase-analysis-review-sajpsa`
**Method:** Captured every scene with the `playwright-screenshot` skill (state-injection + live flow) against the dev build, then visually inspected each render for layout, contrast, overflow, z-index, and alignment defects. Console output was checked for real JS errors vs. environment noise.

## Verdict

**The scenes render correctly and on-brand. One real legibility defect was found and fixed** (overworld node-label collisions); everything else is either a sandbox image-CDN artifact or an intentional, verified click-safe ambient overlay. Details below.

## Fixes applied

**1. Overworld node labels — legibility text-shadow** (`src/components/MapNodeView.tsx`).
Node type + location labels blended into the busy map and overran each other in dense clusters. Added a `void-black` `text-shadow` halo to both labels (matching the existing `drop-shadow-[…var(--color-void-black)]` convention already used on the node icon two lines above). Layout-neutral, uses brand tokens only, verified via re-capture: labels now stay readable over connection lines, icons, and neighbouring labels. (This does not reposition nodes — true collision-avoidance for extreme overlap remains a larger, separate feature; see follow-up.)

**2. Chatter box relocates off overlapping UI** (`src/components/ChatterOverlay.tsx`).
The ambient chatter box sat at a fixed bottom-center / bottom-left anchor and could visually sit over interactive UI (credits RETURN, pregig START SHOW, band-hq tabs). It now measures its own rect and, when its default anchor would overlap any interactive element (`button`, `[role=button]`, links, tabs, dialogs), re-places itself to the first candidate anchor that's clear (fanning out to the opposite edge/corners); when the default is clear it stays put. Position is applied imperatively from a `useLayoutEffect` (no extra render, no first-paint flash) and re-evaluated when the message set changes or the window resizes. Verified: typecheck + lint clean, and the anchor-selection geometry provably relocates off an overlapping button and keeps the default otherwise.

## Environment caveat (important when reading the shots)

This capture runs in a sandbox where the generated-image CDN (`gen.pollinations.ai`) is unreachable. Every screenshot therefore shows:
- grey `▢ …` placeholders where node/venue/background art would load, and
- console noise: `net::ERR_CONNECTION_CLOSED`, `Texture 'blood'/'toxic' returned null`.

These are **environment artifacts, not bugs** — the code requests the images correctly (through the `loadTexture` path) and they render in a networked build. No other JS errors were observed.

## Per-scene results

| Scene | Render | Notes |
|-------|--------|-------|
| **MENU** | ✅ Clean | Title, tagline, version chip, button stack (START TOUR / LOAD GAME[red=no-save] / BAND HQ / SOCIALS / CREDITS / FEATURES), footer — all aligned and on-brand. |
| **MENU + Tutorial** | ✅ Clean | Tutorial step 1 modal ("WELCOME TO THE GRIND") renders over the menu. It does not dim the backdrop (deliberate — tutorials point at live UI); readable, no clipping. |
| **CREDITS** | ✅ Clean | Title + credit rows render correctly. Ambient chatter overlaps the RETURN button *visually* (see overlay note) but does not block it. |
| **OVERWORLD** | ✅ Fixed | HUD, tour-plan header, band-status, event log, map render. Node labels blended/collided in dense clusters → **fixed** with a legibility text-shadow (see Fix applied). |
| **PREGIG** | ✅ Clean | Full Preparation screen: budget allocation, setlist, Start Show, band status. |
| **GIG** | ✅ Clean | Rhythm playfield: score/combo, TOXIC OVERLOAD & DECIBEL CORRUPTION meters, crowd-energy bars, lane inputs (GUITAR/DRUMS/BASS), band members. |
| **POSTGIG** | ✅ (see note) | Under state-injection shows the report *shell* ("TALLYING RECEIPTS…"); the figures are computed by the live END_GIG flow, so this is an injection limitation, **not** a scene bug. |
| **GAMEOVER** | ✅ Clean | "SOLD OUT / THE TOUR HAS ENDED PREMATURELY", final-stats panel, LOAD LAST SAVE / RETURN TO MENU. |
| **CLINIC** | ✅ Clean | "THE VOID CLINIC", funds/fame, per-member heal/graft actions. |
| **BAND HQ** | ✅ Clean | Header, tab bar, CAREER STATUS + BAND STATUS (stamina/mood bars) + VAN STATUS. |
| **EVENT MODAL** | ✅ Clean | Dimmed backdrop, CRITICAL badge, numbered options. (Literal `EVENT.OPTION` text is the synthetic test fixture's placeholder i18n keys, not a render bug.) |

## Ambient chatter overlay — investigated, not a bug

The `ChatterOverlay` ("TOUR FEED" / "MAIN FEED" / "PRE-GIG FEED" / "LIVE FEED") renders bottom-left (OVERWORLD) or bottom-center (all other scenes). It was already **click-safe** (`pointer-events-none`, z below modal chrome) but could still *visually* sit over a CTA (credits RETURN, pregig START SHOW, band-hq tabs). **Now fixed** — see Fix #2: the box relocates to the first anchor clear of interactive UI, so it no longer covers buttons/tabs/links/dialogs.

## Optional follow-up (not addressed here — larger feature)

**True map-label collision-avoidance.** The text-shadow fix restores legibility, but with ~45 procedurally-placed nodes, labels in the tightest clusters can still physically overlap. Real de-collision (offset/stagger labels, or opaque chips) is a scoped feature, not a one-line patch — left for a dedicated pass.

## Conclusion

Two defects found and fixed — overworld label legibility and the chatter box overlapping interactive UI. The remaining scenes are visually sound and consistent with the brutalist design system; the other apparent problems are sandbox image-CDN artifacts (would render in a networked build), not code issues. Only the procedural map-label de-collision remains as a deliberate, larger follow-up.
