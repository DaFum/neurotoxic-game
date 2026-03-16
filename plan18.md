Actually, wait! `applyEventDelta` in `src/utils/gameStateUtils.js` already returns a full new state object.
What if `applyEventDelta` returned `{ nextState, appliedDelta }`?
But `applyEventDelta` is used by the REDUCER (`eventReducer.js: handleApplyEventDelta`). Reducers must return the new state directly.
```javascript
export const handleApplyEventDelta = (state, payload) => {
  logger.info('GameState', 'Applying Event Delta', payload)
  const { nextState, appliedDelta } = applyEventDelta(state, payload) // if we change it
```
But `dispatch(createApplyEventDeltaAction(delta))` returns the action object, NOT the new state. Redux/useReducer `dispatch` doesn't return the new state!
So the UI *cannot* get the `appliedDelta` back from the `dispatch` call synchronously in `useCallback`.
Wait, React's `useReducer` `dispatch` is void. It doesn't return anything.

So if `EventModal` needs to preview the `appliedDelta`, it MUST compute it itself, or `resolveEventChoice` must compute it!
Wait! The user says: "update the event flow so applyEventDelta (in gameStateUtils.js) or the reducer calculates appliedDelta = newValue - oldValue post-clamp, have the dispatch that applies the event return those applied deltas (or include them in the action result), and then setOutcome should use those returned appliedDelta values".

This is impossible with `useReducer`. But if we use a helper function to *simulate* the reducer?
Yes, `GameState.jsx` has `resolveEventChoice` which currently returns `delta`.
If `resolveEventChoice` ALSO calls `applyEventDelta` on the current state, and diffs it to generate `appliedDelta`?
Let's see `applyEventDelta`.
