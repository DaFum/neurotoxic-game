1. **Explore `src/hooks/minigames/useRoadieLogic.ts`**
   - Check the length and structure of the `useRoadieLogic` hook.
2. **Refactor `useRoadieLogic.ts` to reduce line count**
   - Extract `getInitialGameState` outside the component to return the initial `gameStateRef` state. Move the initial item pickup logic directly into this function, removing the need for a dedicated `useEffect`.
   - Extract `getInitialUiState` outside the component to initialize the `uiState`.
   - Extract `handleNeurotoxicDamage` pure helper to encapsulate passive damage update logic.
   - Extract `processMove` pure helper to encapsulate movement validation and state modification.
   - Extract `useRoadieKeyboardControls` custom hook to handle the `keydown` event listeners.
   - Extract `useRoadieSceneTransition` custom hook to handle the fallback scene transition logic if the UI hangs on game over.
3. **Verify Refactoring**
   - Use `run_in_bash_session` to run `pnpm run lint` and `pnpm run typecheck` to ensure no errors are introduced.
   - Use `run_in_bash_session` to run `pnpm run test:vitest:node` and `pnpm run test:vitest:ui` to ensure logic remains intact.
4. **Complete Pre Commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Submit PR**
   - Submit the changes using the specified title format and description structure.
