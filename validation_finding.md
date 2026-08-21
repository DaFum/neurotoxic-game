# Validation Finding: `src/hooks/useGigVisuals.ts`

## Actual Code State
- **Inspection of Line 34:** An inspection of `src/hooks/useGigVisuals.ts` reveals that line 34 begins the `bgUrl` `useMemo` declaration and does not contain any `Array.includes` call.
- **Usage of `.includes()`:** The only `.includes()` call in the file occurs at line 36: `currentGig?.name?.includes('Kaminstube')`. This is identified as a `String.prototype.includes` method, which is a substring test on a single string, and not an `Array.includes` call on a constant array literal.
- **Execution Frequency:** This check runs safely inside a `useMemo` block that is keyed on the dependency array `[currentGig?.name, currentGig?.difficulty, isOnline]`. Thus, it recomputes only when the gig name, difficulty, or online status changes, and not on a per-render, per-frame, or per-tick basis.

## Why `Set.has` Does Not Apply
- **Differing Behaviors:** `Set.has` performs an exact-value membership lookup. In contrast, the existing code uses `String.prototype.includes` to perform a substring match. Therefore, a `Set` cannot accurately express the logic of checking if the "name contains 'Kaminstube'".
- **Consequences of Conversion:** Converting the logic to `Set.has('Kaminstube')` would introduce a change in behavior: it would strictly match only when the gig's name is exactly equal to `'Kaminstube'` instead of correctly matching any name containing that substring.
- **Consistent Convention:** The identical substring convention appears deliberately in `src/utils/socialEngine.ts:66` for the same venue (`if (venue?.name?.includes('Kaminstube'))`), which confirms that this pattern is intentional across the codebase.

## Scope and Recommendation
- **Recommendation:** No functional change should be made to `src/hooks/useGigVisuals.ts`.
- **Out of Scope Usage:** The genuine constant-array-literal usages of `.includes()` exist only in `src/hooks/useTutorial.ts:92` and `src/utils/balanceTuning.ts:239`. These occurrences are low-frequency (either memoized or one-time configurations) and are entirely out of scope for this ticket's target file.
- **Action Item:** It is highly recommended to close this ticket as "not applicable" or to update it with this corrected finding. Doing so will prevent an incorrect, behavior-breaking change from being merged into the codebase.
