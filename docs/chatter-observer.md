# Chatter observer

`ChatterOverlay` (`src/components/ChatterOverlay.tsx`, `useNonOverlappingPosition`)
re-places its box with a `childList` + `subtree` `MutationObserver` on
`document.body`, debounced by a trailing 200 ms timer (`DOM_SETTLE_MS`) with a 1000 ms maximum
wait (`DOM_SETTLE_MAX_WAIT_MS`), plus a window `resize` listener that re-measures on the next animation frame. Decision:
**keep this observer unchanged.** Reasons, each checked against the code:

- No portals exist: `grep createPortal src` returns nothing, so every obstacle
  lives in the regular DOM tree.
- `.game-container` (`src/App.tsx`, `GameContent`) is the only shared ancestor
  of the overlay and the scene obstacles, so observing it would be no narrower
  than observing `document.body` in practice.
- `ResizeObserver` does not detect mounts: it fires on size changes of observed
  elements, not when a new obstacle appears. (`TutorialManager` and the stage
  resize handler already use it for their own, unrelated, needs.)
- Chatter's own exit removals (`AnimatePresence` unmounting a message) change
  its size and must trigger a re-measure, so mutations inside the overlay are
  intentionally observed too.
- Pixi drawing creates no DOM mutations: the canvas is appended once at stage
  init (`BaseStageController.ts`); per-frame drawing happens on the canvas, not
  in the DOM.

The maximum wait starts at the first mutation of a burst and is not restarted
by later ones, so a sustained `childList` stream (toasts, HUD popups) cannot
postpone re-measurement past one second. Whichever timer fires first measures
once and cancels the other; there is no leading-edge measurement, so nothing
re-places before 200 ms of quiet unless the maximum wait runs out. Only the
callback scheduling changed, not the observer's target or options. The real
mutation rate was measured once (2026-10-26, DEV build, headless Chromium, no
player input beyond arrow-key presses in the Gig, random events off, 20-30 s per
scene): a `MutationObserver` on `document.body` with the same options saw at most
0.8 callbacks per second in every scene (Tourbus 0.2, Roadie 0.2, Kabelsalat 0.8,
Amp Calibration 0.5, Gig HUD 0.2-0.6). The longest run of mutations less than
200 ms apart lasted 313 ms, so the old trailing debounce was never starved and
the maximum wait never fired. Active play with toasts and popups may differ; the
guard stays as a cheap bound, not as a fix for an observed problem.

Behaviour is pinned by the "observer lifecycle" tests in
`tests/ui/ChatterOverlayPlacement.test.jsx` (late mount, removal recovery,
debounce coalescing, the sustained-stream maximum wait, resize on next frame, cleanup on unmount).

Any future narrowing of the observer scope must keep those tests green and
first define an explicit obstacle-scope contract (which subtree may hold
obstacles, and how the overlay learns about ones outside it).
