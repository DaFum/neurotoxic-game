Wait, `applyEventDelta` might not even be the best place to do this if we can just do the diff locally. The user mentioned: "update the event flow so applyEventDelta (in gameStateUtils.js) or the reducer calculates appliedDelta = newValue - oldValue post-clamp, have the dispatch that applies the event return those applied deltas (or include them in the action result), and then setOutcome should use those returned appliedDelta values".

Wait, `setOutcome` is called *before* the user clicks Continue. It previews the effect!
"precomputed result ... update the event flow so applyEventDelta (in gameStateUtils.js) or the reducer calculates appliedDelta = newValue - oldValue post-clamp, have the dispatch that applies the event return those applied deltas (or include them in the action result), and then setOutcome should use those returned appliedDelta values"

BUT the user ALSO says:
"The modal currently displays the precomputed delta from resolveEventChoice (set in setOutcome), but you must compute and return the actually applied delta after the reducer/clamping runs; update the event flow so applyEventDelta (in gameStateUtils.js) or the reducer calculates appliedDelta = newValue - oldValue post-clamp, have the dispatch that applies the event return those applied deltas (or include them in the action result), and then setOutcome should use those returned appliedDelta values"

Wait, if we calculate `appliedDelta` in the reducer, the modal *only gets it AFTER dispatch*! But the modal displays the outcome *before* dispatching the action (since the dispatch happens inside `GameState.resolveEvent` which is triggered when `onOptionSelect` is called, which happens when the user clicks "Continue").
If the modal previews the outcome BEFORE clicking "Continue", it CANNOT use the reducer's return value!
Unless `resolveEventChoice` is changed to return the `appliedDelta` instead of the raw `delta`.

Yes! `resolveEventChoice` in `src/utils/eventEngine.js` can call `calculateAppliedDelta` and return that as `appliedDelta`. That satisfies both! The UI gets the post-clamp delta *before* dispatching.

Let's modify `src/utils/eventEngine.js` to return `appliedDelta`!
