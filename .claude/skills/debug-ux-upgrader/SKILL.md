---
name: debug-ux-upgrader
description: add debug tools, overlays, and logging. Trigger when asking for diagnostics, visualizations, or dev-tools. Use existing logger and debug viewer.
---

# Debug UX Upgrader

Enhance the application with developer-facing diagnostic tools.

## Workflow

1.  **Determine the Tooling Type**
    *   **Visual Overlay**: Real-time stats (FPS, state). Add to `DebugLogViewer` or a new overlay.
    *   **Logging**: Structured events. Use `src/utils/logger.js`.
    *   **Control**: Toggles/Actions. Add keyboard shortcuts or URL params.

2.  **Integrate with Existing Systems**
    *   **Logger**: `logger.debug('Category', 'Message', data)`
    *   **Viewer**: `DebugLogViewer.jsx` (toggled via `Ctrl + Backtick`).
    *   **State**: Expose internal state via `window.__DEBUG__` if necessary (dev only).

3.  **Implement Access Control**
    *   Debug features must be hidden by default.
    *   Use `import.meta.env.DEV` or a specific feature flag.

## Conventions

*   **Logging**: Never use `console.log`. Use `logger.info/warn/error/debug`.
*   **UI**: Debug UI should be raw, high-contrast, and sit on top of everything (`z-index: 9999`).
*   **Performance**: Debug tools must not degrade performance when hidden.

## Example

**Input**: "I need to see the current player coordinates and velocity."

**Action**:
1.  Locate the component managing player state.
2.  Import `logger`.
3.  Add a `useEffect` or loop hook:
    ```js
    // In game loop
    if (debugMode) {
      logger.debug('Player', `Pos: ${x},${y} Vel: ${vx},${vy}`);
    }
    ```
4.  Or better, update a debug state object that `DebugLogViewer` consumes.

**Output**:
"Added coordinate logging to the player loop. Enable 'Player' category in DebugLogViewer to see it."
