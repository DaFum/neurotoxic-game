1. **Fix Luck Clamp in Sanitize Band**
   - Update `src/context/reducers/sanitizers/stateSanitizers.ts` to import `clampLuck`.
   - Use `clampLuck(finiteNumberOr(bandData.luck, DEFAULT_BAND_STATE.luck))` when sanitizing the `band.luck` property to enforce the 0-100 limit on loaded saves.
2. **Add Luck Regression Tests**
   - In `tests/node/stateSanitizers.test.js`, add tests in a `describe('sanitizeBand')` block verifying that negative luck and luck > 100 are clamped properly.
   - Specifically test calculating a positive event delta on a negative loaded luck to show the fix works for load-apply lockstep issues.
3. **Fix GigVisualStatus Regression Tests**
   - In `tests/ui/OverloadWarning.test.jsx`, update the tests for `hides below or at the overload threshold` to mock `deriveGigVisualStatus` returning specific values if needed, OR add a dedicated test for `deriveGigVisualStatus` in a new or existing node test.
   - Create a `tests/node/gigVisualStatus.test.js` file.
   - Direct test of `deriveGigVisualStatus(stats)` for values around the boundaries (80/81, 90/91 for overload, 80/81 for corruption).
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit changes**
