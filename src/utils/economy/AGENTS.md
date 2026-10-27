# src/utils/economy - Agent Instructions

## Economy invariants

Source-of-truth priority: runtime helpers/constants win. If simulations,
tooltips, or docs disagree with `economy/`, `gameState/`, or
`postGig/`, update the consumers and rerun the required simulation
baseline instead of duplicating formulas.

### Gig financial reconciliation

- `MAX_GIG_NET` in `economy/constants.ts` is the live gig-net cap. Excess net is added back to expenses as an `overageFee` line (`economy:gigExpenses.overageFee.*` i18n keys), not silently truncated. `calculateGigFinancials()` must reconcile `net === income.total - expenses.total`; do not duplicate the cap value in guidance or consumers.
- Management cut is fame-progressive: `MANAGEMENT_CUT_RATE (0.15) × Math.min(1, playerFame / 200)`. Required to keep Bootstrap bankruptcy below the simulation gate.

### Shared formulas and simulations

- `MAX_GIG_NET`, `MANAGEMENT_CUT_RATE`, and `BASE_DRAW_RATIO` are mirrored by `scripts/game-balance-simulation.mjs` via direct import. Changing them invalidates `reports/game-balance-simulation-baseline.json`; re-run `pnpm run simulate:balance:baseline`.

## Gig / merch threading

- `calculateTravelMinigameResult()` is the source of truth for Tourbus condition loss; its 50% damage-to-condition scaling must stay aligned with the reducer and completion UI.
- `EconomyContext.merchPrices` is a direct top-level field, not nested under `context.social`. Passing via `context.social.merchPrices` is silently ignored by `calculateMerchIncome`.
- Post-gig merch derives `context.cityTraits?: CityTraitState` from the normalized venue ID city key: use `state.gameMap?.cityStates?.[cityKey]` when present, otherwise call `deriveCityTraits(cityKey)`. If the city key is empty or `context.cityTraits` is omitted, `calculateMerchIncome` uses neutral 1.0 multipliers. Unrecognized trait fields fall through to merch profile lookup defaults; never read `cityStates` from top-level `GameState`.
- Per-item merch demand profiles live in `src/data/merch.ts` (`MERCH_PROFILES`, `SPENDING_PROFILE_MERCH_MULTIPLIER`). `DEFAULT_MERCH_PRICES` is re-exported from there; do not redefine merch prices in `economy/`.

## Merch demand

- `calculateMerchIncome` in `economy/` computes `rawShare` for every item regardless of inventory; the cap is applied only at allocation (`sold = min(desired, inventory)`). Out-of-stock demand is intentionally lost, not redistributed — skipping zero-stock items at the share step would normalize in-stock shares to 1.0 and silently absorb missed sales.

## Fuel and merch capacity

- `fuelMultiplier` is a CONSUMPTION modifier: it scales liters burned per trip in `calculateFuelCost` only. `calculateRefuelCost` must NOT apply it to the pump price — the tank deficit is physical liters, so discounting the price as well squares the discount (0.85 → ~28% instead of the advertised 15%).
- `economy.calculateMerchIncome`: `merchCapacityBonus` is a carry-cap modifier (raises the restock ceiling), NOT phantom sellable stock. At gig time, `sold = min(desired, inventoryCount)` — do not add `capacityBonus` to the sell-time allocation.
