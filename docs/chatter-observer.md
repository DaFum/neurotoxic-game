# Chatter observer

`ChatterOverlay` (`src/components/ChatterOverlay.tsx`, `useNonOverlappingPosition`)
re-places its box with a `childList` + `subtree` `MutationObserver` on
`document.body`, debounced by a trailing 200 ms timer (`DOM_SETTLE_MS`), plus a
window `resize` listener that re-measures on the next animation frame. Decision:
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

Behaviour is pinned by the "observer lifecycle" tests in
`tests/ui/ChatterOverlayPlacement.test.jsx` (late mount, removal recovery,
debounce coalescing, resize on next frame, cleanup on unmount).

Any future narrowing of the observer scope must keep those tests green and
first define an explicit obstacle-scope contract (which subtree may hold
obstacles, and how the overlay learns about ones outside it).
