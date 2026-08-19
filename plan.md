1. **Fix `src/utils/gameState/clamps.ts`:**
   - Use `replace_with_git_merge_diff` to add `export const clampLuck = (luck: number): number => clamp0to100(luck)`.

2. **Fix `src/utils/gameState/delta.ts`:**
   - Use `replace_with_git_merge_diff` to apply `clampLuck(currentLuck + luckDelta)` in `calculateAppliedDelta` and `applyEventDelta`, removing `addClampedNonNegative`. Ensure `clampLuck` is imported from `./clamps`.

3. **Verify and fix `src/context/reducers/bandReducer.ts`:**
   - Use `replace_with_git_merge_diff` to import `clampLuck` from `../../utils/gameState/clamps` and replace `sanitizeNumericKey('luck', clamp0to100)` with `sanitizeNumericKey('luck', clampLuck)`.

4. **Fix `src/utils/purchaseLogicUtils.ts`:**
   - Use `replace_with_git_merge_diff` to:
     - Update `canAfford` signature to accept `item: { currency?: string }` so it's less restrictive.
     - Make `validatePurchase` call `canAfford(item, player, finalCost)` instead of `currencyValue < finalCost`.
     - Update the luck purchase effects (`hq_room_void_altar` and `hq_room_shrine`) to use `clampLuck((getNumericProp(...) ?? 0) + 10)`. Ensure `clampLuck` is imported from `./gameState/clamps`.

5. **Fix `src/hooks/preGig/usePreGigHandlers.ts`:**
   - Use `replace_with_git_merge_diff` to import `canAfford` from `../../utils/purchaseLogicUtils` and replace inline `player.money < cost` checks with `!canAfford({ currency: 'money' }, player, cost)`.

6. **Fix `src/components/clinic/ClinicMemberCard.tsx`:**
   - Use `replace_with_git_merge_diff` to import `canAfford` from `../../utils/purchaseLogicUtils` and replace `player.money >= CLINIC_GRAFT_COST` with `canAfford({ currency: 'money' }, player, CLINIC_GRAFT_COST)`.

7. **Fix `tests/node/gameStateDeltaLockstep.test.js`:**
   - Use `replace_with_git_merge_diff` to add a test block asserting bounded luck behavior between 0 and 100 for event deltas (which is actually partially covered, I need to ensure the test asserts upper bounds). The current test "clamps luck, loyalty, and zealotry identically in preview and apply" tests the lower bound (-1 to 0). I will add an upper bound check for luck.

8. **Verify tests pass:**
   - Use `run_in_bash_session` to run tests and typecheck.

9. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
10. Submit the change using the `submit` tool.
