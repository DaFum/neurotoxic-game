---
name: perf-budget-enforcer
description: optimize bundle size and runtime performance. Trigger when the app is slow, bundle is too large, or build warnings appear. Checks lazy loading, asset sizes, and render loops.
---

# Performance Budget Enforcer

Analyze and optimize application performance, focusing on bundle size and runtime efficiency.

## Workflow

1.  **Measure the Baseline**
    Run the production build to see chunk sizes.
    ```bash
    npm run build
    ```
    *   *Goal*: Main entry point < 300kB gzipped.
    *   *Warning*: Any chunk > 500kB.

2.  **Identify Bottlenecks**
    *   **Large Dependencies**: Pixi.js, Tone.js. Are they lazy-loaded?
    *   **Assets**: Large images or audio embedded in the bundle? Move to `public/`.
    *   **Code Splitting**: Are routes lazy-loaded in `App.jsx`?

3.  **Optimize**
    *   **Lazy Loading**: Use `React.lazy()` for heavy components (`PixiStage`, `ToneSynth`).
    *   **Dynamic Imports**: `import('pixi.js')` only when needed.
    *   **Vite Config**: Adjust `manualChunks` in `vite.config.js`.

4.  **Runtime Check**
    *   **FPS**: Check `PixiTicker` for heavy logic.
    *   **Memory**: Ensure `destroy()` is called on unused Pixi objects.

## Example

**Input**: "The initial load takes too long."

**Action**:
1.  Run build. See `index.js` is 1.2MB.
2.  Analyze: `Pixi.js` and `Tone.js` are in the main bundle.
3.  **Fix**:
    *   Change `import * as Tone` to dynamic import in `AudioManager`.
    *   Lazy load `GameScene`.
4.  Run build again. `index.js` drops to 200kB.

**Output**:
"Lazy-loaded Pixi and Tone. Main bundle size reduced by 80%. Initial load is now under 1s."
