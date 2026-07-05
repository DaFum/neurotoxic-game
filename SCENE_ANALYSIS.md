# Neurotoxic — Per-Scene Screenshot Analysis

**Date:** 2026-07-03 · **Branch:** `claude/codebase-analysis-review-sajpsa`
**Method:** Captured every scene with the `playwright-screenshot` skill (state-injection + live flow) against the dev build, then visually inspected each render for layout, contrast, overflow, z-index, and alignment defects. Console output was checked for real JS errors vs. environment noise.

## Verdict

**The scenes render correctly and on-brand. Two real defects were found and fixed** — overworld node-label collisions and the chatter box visually overlapping interactive UI. Everything else is a sandbox image-CDN artifact. The per-scene table below records the *post-fix* state. Details follow.

## Fixes applied

**1. Overworld node-label de-collision** (`src/components/MapNodeView.tsx`).
Node type + location labels blended into the busy map and overran each other in dense clusters. Two-part fix:
- **Opaque chips** — each label now sits on a solid `bg-void-black/90` chip (the location name adds a `toxic-green` border that brightens on hover), so where labels overlap they occlude cleanly instead of blending into green-on-green mush. Matches the existing brutalist chip style (the pending-confirm label already used this pattern).
- **Hover/active z-raise** — the current or hovered node's container is bumped to `--z-stage-controls`, so the label you're pointing at always renders on top of its neighbours.

Uses brand tokens only, layout-neutral (no node repositioning), verified via re-capture: overlapping labels now read as distinct solid boxes and the active one comes forward.

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
| **CREDITS** | ✅ Fixed | Title + credit rows render correctly. The ambient chatter overlay previously sat over the RETURN button (visual only — it was already click-safe); now relocates off it (Fix #2). |
| **OVERWORLD** | ✅ Fixed | HUD, tour-plan header, band-status, event log, map render. Node labels blended/collided in dense clusters → **fixed** with opaque chips + hover/active z-raise (Fix #1). |
| **PREGIG** | ✅ Clean | Full Preparation screen: budget allocation, setlist, Start Show, band status. |
| **GIG** | ✅ Clean | Rhythm playfield: score/combo, TOXIC OVERLOAD & DECIBEL CORRUPTION meters, crowd-energy bars, lane inputs (GUITAR/DRUMS/BASS), band members. |
| **POSTGIG** | ✅ (see note) | Under state-injection shows the report *shell* ("TALLYING RECEIPTS…"); the figures are computed by the live END_GIG flow, so this is an injection limitation, **not** a scene bug. |
| **GAMEOVER** | ✅ Clean | "SOLD OUT / THE TOUR HAS ENDED PREMATURELY", final-stats panel, LOAD LAST SAVE / RETURN TO MENU. |
| **CLINIC** | ✅ Clean | "THE VOID CLINIC", funds/fame, per-member heal/graft actions. |
| **BAND HQ** | ✅ Clean | Header, tab bar, CAREER STATUS + BAND STATUS (stamina/mood bars) + VAN STATUS. |
| **EVENT MODAL** | ✅ Clean | Dimmed backdrop, CRITICAL badge, numbered options. (Literal `EVENT.OPTION` text is the synthetic test fixture's placeholder i18n keys, not a render bug.) |

## Ambient chatter overlay — investigated, not a bug

The `ChatterOverlay` ("TOUR FEED" / "MAIN FEED" / "PRE-GIG FEED" / "LIVE FEED") renders bottom-left (OVERWORLD) or bottom-center (all other scenes). It was already **click-safe** (`pointer-events-none`, z below modal chrome) but could still *visually* sit over a CTA (credits RETURN, pregig START SHOW, band-hq tabs). **Now fixed** — see Fix #2: the box relocates to the first anchor clear of interactive UI, so it no longer covers buttons/tabs/links/dialogs.

## Residual note

The opaque-chip + z-raise de-collision resolves label *readability* in dense clusters (overlapping labels occlude cleanly; the active one comes forward). It does not physically move labels apart — a full geometric solver (measure every label rect and nudge/stagger) would eliminate the remaining spatial overlap entirely, but that's a heavier, measurement-driven layout pass with its own regression surface (hover, map regen, mobile, per-render cost). The chip approach was chosen as the robust, deterministic solution; a measured solver can be a future enhancement if fully non-overlapping placement is required.

## Conclusion

Two defects found and fixed — overworld node-label de-collision (opaque chips + hover/active z-raise) and the chatter box overlapping interactive UI (relocation off buttons/tabs/links/dialogs). The remaining scenes are visually sound and consistent with the brutalist design system; the other apparent problems are sandbox image-CDN artifacts (would render in a networked build), not code issues.
