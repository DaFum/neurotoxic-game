# src/hooks/minigames/ — Gotchas

- **Rendering agnostic**: These hooks must NOT import `PIXI` or manipulate DOM directly. They return reactive state for `StageController` classes to consume.
- Use `useRef` for high-frequency mutable state (player X/Y). Only sync to `useState` for UI updates (score, health bars) — avoids render thrashing.
- Do NOT dispatch reducer actions every frame. Accumulate damage/score locally, dispatch only on completion or major events.
- Minigame completion dispatches results but does NOT set the scene — routing is handled by `useArrivalLogic`.
- Run logic tests: `node --test --import tsx --experimental-test-module-mocks tests/minigameState.test.js`
