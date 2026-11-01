# Event Engine — Agent Instructions

## Selection

- `selectEvent` is the sole RNG boundary for shuffle and chance rolls. A functional `chance` may derive probability from the optimized state but must not consume randomness itself.
- Template venue context reads canonical `player.location`; `currentLocation` is not part of persisted player state.

## Paid options during a run

- Option `condition`s are evaluated against `withExpeditionSpendableCash(state)` (in `resolveChoice` and `EventModal`), so a money gate such as `money >= 45` cannot be met with protected cash.
- Percentage money effects (`percentage_resource`) are taken of spendable cash plus the running composite delta (`getPercentageMoneyBase`; the full balance outside an active run), computed once in `getPercentageMoneyChange`, clamped with `clampMoneyChange` against the raw balance like a fixed `resource` change. The `percentage_resource` handler and `getOptionPreviewMoney` share this rule, so the previewed price is the executed one; without a player slice both charge nothing, whatever `min`/`max` say.
- Option labels show the offer price, not the applied debit: `EventModal` fills `{{amount}}` with `getOptionPreviewMoney(option, state, { clampToBalance: false })`, which skips the balance clamp (`getPercentageMoneyAmount` for percentages) so a disabled paid option still shows its full price. Affordability and execution keep the clamped default.
- `isOptionAffordable` derives a direct money cost from the option's effects (`getOptionPreviewMoney`) and refuses it when only protected cash could pay and a sibling option is still choosable. If none is, the cost stays payable (clipped at the floor) so an event can never lock. It runs in `resolveEventChoice` and in the modal, and is a no-op outside a run.

## Events

- `social_set` sets only `egoFocus` and `trend`. A numeric counter value (e.g. `loyalty`, `viral`) goes into the additive social delta, so `applyEventDelta` adds it to the current counter: "set" acts as "add". A real numeric set needs its own delta channel; until then, author numeric social changes as increments.
- `resolveChoice` skillCheck in `eventEngine.ts` must branch `stat === 'luck'` BEFORE the `gameState.band[stat]` fallthrough. `band.luck` exists (default 0), so checking band stats first turns the random luck roll into a static 0.
