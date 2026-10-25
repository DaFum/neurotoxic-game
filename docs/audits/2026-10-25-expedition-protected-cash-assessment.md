# Expedition Protected Cash Assessment

Date: 2026-10-25
Source: issue #3284, finding 5 (balance-runner part)

---

## 1. Question

Does protected Career Cash make Roadie repairs effectively free?

## 2. Runner Changes Behind the Numbers

`scripts/game-balance-expedition-runner.mjs` now settles a Gig the way `useContinueHandler` does (`settleSimulatedGigPayout`):

- `calculateContinueStats` proposes the balance, `evaluateAcceptedSettlementSolvency` refuses the Cash change in full when it would cross the protected floor, and one `UPDATE_PLAYER` carries the accepted money with the calculated Fame and Fame level. Before, the runner dispatched the proposed money, `enforceExpeditionCashFloor` reverted the whole update, and the run lost that Gig's Fame.
- The deal Fame multiplier (`financials.dealFameMultiplier`) is now passed through, as production does.
- Telemetry: `gigNetTotal` stays the quoted net. New fields: `acceptedGigNetTotal` (the Cash that actually moved), `refusedGigLossCount`, `refusedGigLossValue` (the refused wallet change, so a loss clamped at 0 counts only down to 0).
- Routine repairs count only when the dispatch changes state.

Pinned by `tests/node/gameBalanceExpeditionRunner.test.js` (wallet 500, protection 400, net -600: money stays 500, Fame lands, one refusal counted).

## 3. Measurement

Driver: `runExpeditionSimulation` over all six `EXPEDITION_BALANCE_PROFILES` (every profile has a `protectedCashRatio` between 0.15 and 0.4), skill levels low, competent and high, 200 calibration seeds each (3,600 runs, about 75 s). The CLI `pnpm run balance:expedition` was not used because it rewrites the committed v15 reports. A route-step hook read `getExpeditionSpendableCash` at every step.

| Metric                                    | Value                      |
| ----------------------------------------- | -------------------------- |
| Gig losses refused by the floor           | 1,177 refusals in 777 runs |
| Refused wallet value                      | 1,036,325 total            |
| Quoted gig net (sum)                      | -3,141,605                 |
| Accepted gig net (sum)                    | -2,061,593                 |
| Routine repairs / repair spend            | 8,135 / 704,590            |
| Route steps with zero spendable Cash      | 1 of 27,619                |
| Route steps with spendable Cash below 200 | 640 of 27,619 (2.3%)       |

Refusals concentrate in low-skill runs (`underground_heat` 255, `rival_hunter` 224, `scout_intel` 180, `high_exposure_performance` 142, `diy_repair` 44) and `underground_heat`/competent (331). Clean Sponsor and every high-skill profile had none. Run outcomes moved by at most one run per 200 against the old runner. Mean retained Fame rose in every cell with refusals; it also rose in cells without any refusal (all `clean_sponsor` cells, `high_exposure_performance` competent and high, `rival_hunter` high), which is attributable to the deal Fame multiplier, the only other settlement change.

## 4. Roadie Waiver Evidence

The runner does not dispatch the Roadie minigame completion, so it records no `paid`/`waived` totals from `settleExpeditionMandatoryDebit`. The evidence above is indirect: a Roadie charge is `floor(damage * 2)`, at most 200, and is waived only for the part above spendable Cash. Spendable Cash was below 200 at 2.3% of route steps, almost all in `underground_heat` low (366 of 1,123 steps) and competent (232 of 1,752).

## 5. Verdict

The data do not establish how often Roadie repairs are paid in full: the runner never plays the Roadie completion path, so there are no `paid`/`waived` totals for runs that actually had a Roadie charge. What the sample shows is that spendable Cash was at least 200 at 97.7% of route-step observations, which would cover any Roadie charge of 200 or less at those observations; charges below 200, discounts or credits can also be paid in full with less. Protected Cash can only produce partial or full waivers where spendable Cash is thin, mainly `underground_heat` at low and competent skill, so the evidence points against repairs being effectively free, without proving it. The larger effect of the floor is on Gig losses: about a third of the quoted net loss (1.04M of 3.14M) never leaves the wallet.

## 6. Open Evidence

- Direct `paid`/`waived` totals need the runner to play the Roadie completion path (`START_ROADIE_MINIGAME` and `COMPLETE_ROADIE_MINIGAME` with a simulated damage value). Until then, section 4 is a bound, not a measurement.
