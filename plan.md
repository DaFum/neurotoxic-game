1. **Target:** `src/context/reducers/sanitizers/stateSanitizers.ts`
2. **Action:** Refactor TSDoc for `sanitizeRivalBandUpdates`, `sanitizeLastGigStats`, `sanitizeActiveQuests`, `sanitizeQuestCooldowns`, and `sanitizeQuestScopes` functions. Ensure they comply strictly with the `TSDOC_INCREMENTAL_REFACTOR_DAEMON` rules (e.g. no types in `@param` or `@returns`, strict active voice summary).
3. **Execution Plan:**
   - Modify `src/context/reducers/sanitizers/stateSanitizers.ts` using search and replace.
   - Run linter using `pnpm run lint`.
   - Update `.jules/tsdoc.md` with a new row according to the required format.
4. **Pre-commit:** Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Submit:** Submit with a meaningful commit message.
