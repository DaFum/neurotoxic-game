In `tests/EventModal.test.jsx`, the assertions expect `handleSelect` to be called when the option is clicked.
However, because I reverted `EventModal.jsx` back to using the local `outcome` state to preview the effect (which is what the user explicitly requested by saying "The modal currently displays the precomputed delta from resolveEventChoice (set in setOutcome)... setOutcome should use those returned appliedDelta values"), the option click DOES NOT call `onOptionSelect(option)` anymore! It calls `setOutcome` internally!

Then, when the Continue button is clicked, it calls `onOptionSelect({ ...outcome.option, _precomputedResult: outcome._precomputedResult })`.

So the tests are failing because they expect the click to call `onOptionSelect` immediately (like I did in my first version of the PR). But in THIS version of the PR, `onOptionSelect` is only called on Continue.

Let's update `tests/EventModal.test.jsx` to reflect this two-step flow!
Wait, that is step 4 in my plan. I am currently on step 1 (Update `src/ui/EventModal.jsx`). So I should just finish step 1 and then update the test.
Wait, let me double check if there are any other `EventModal.jsx` changes requested.
"wrap any disabled interactive children in <span tabIndex={0}> so they can receive keyboard focus when disabled."
Wait, does `EventModal` have disabled interactive children?
Let's check.
