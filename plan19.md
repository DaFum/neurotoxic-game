Ah, I see. `applyEventDelta` is extensively used in tests and reducers. Refactoring it to return a `{ nextState, appliedDelta }` tuple is very risky and causes a massive cascade of changes across tests and reducers.

Is there a safer way to get `appliedDelta` for the modal?
Since `EventModal` only needs the `appliedDelta` for *display* purposes, and `applyEventDelta` doesn't do async calls or heavy computation, we can just compute it locally in `resolveEventChoice` by diffing the returned state!

If we use `applyEventDelta(gameState, delta)` inside `resolveEventChoice`, we get the clamped `nextState`.
Then we can create a `diffStates(oldState, nextState)` helper or just diff the properties we care about!

Even simpler:
In `resolveEventChoice`:
```javascript
  const nextState = applyEventDelta(gameState, delta)
  const appliedDelta = computeAppliedDelta(gameState, nextState, delta)
```

Where `computeAppliedDelta` looks at the raw `delta` and figures out what the actual change was by checking `nextState.player.money - gameState.player.money`.
This isolates the change entirely to `eventEngine.js` and does NOT break `applyEventDelta` signature!

Let's write `computeAppliedDelta` in `eventEngine.js`!
