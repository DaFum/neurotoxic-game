# src/hooks/minigames — Agent Instructions

## Scope

Applies to `src/hooks/minigames/**`.

## Minigame Hook Rules

- Keep minigame hooks focused on state/timing orchestration; rendering concerns belong in scene/components.
- Ensure completion paths are idempotent and safe against repeated ticks/callbacks.

## Domain Gotchas

- Time-expiry completion must invoke the same finish/finalize callback path as button-driven completion to avoid delayed reducer updates.
- Use `useRef` guards (`isCompleteRef`, `finishCalledRef`) for one-shot completion semantics when update loops can fire multiple times in a single frame window.

## Recent Findings (2026-04)

- Minigame regressions commonly appear when completion side effects are triggered only from UI buttons; ensure logic-driven expiry and manual actions both finalize through shared callbacks.
- Avoid dispatching context actions from inside React state-updater callbacks; compute expiry from refs and call shared finalize handlers from normal control flow.
- Shared completion callbacks invoked by both timer and button paths must set all termination refs/flags (`isCompleteRef`, `isGameOver`) themselves to prevent post-finish tick processing before unmount.
- If a minigame waits on a post-game button, add a bounded fallback auto-transition timer so players cannot get stranded if the manual action is missed.
