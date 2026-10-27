# src/context/assets - Agent Instructions

## Long-Term Assets

- Asset action creators (`assetActionCreators.ts`) normalize payloads via `finiteNumberOr` and strip prototype keys before validation. DIY+loan returns `PURCHASE_CHASSIS_FAILED` (typed) — never `null`.
- `purchaseChassis` enforces loan-profile eligibility against `state.player.fame` (NOT `state.band.fame`) and `state.social.scenePresence`; ineligible profiles return `PURCHASE_CHASSIS_FAILED` with reason `LOAN_PROFILE_INELIGIBLE`. Add new gating fields to the same union when extending `LoanProfile`.
- `purchaseChassis` rejects `mode: 'crowdfund'` (`CROWDFUND_REQUIRES_CAMPAIGN`) and `handlePurchaseChassis` only accepts `cash`/`loan` payloads — crowdfund acquisition exists solely via `startCrowdfund` + `processCrowdfundTick`. Without both guards a crowdfund-mode dispatch would mint a free chassis (neither payment branch fires).
- `startCrowdfund` derives `plannedSuccessProbability` (`resolveCrowdfundProbability` from the player's fame and scene presence plus the target) and `plannedSuccessRoll` (`mulberry32(rngSeed ^ fameStake ^ days)`) from state and caps `fameStake` at the player's fame; callers pass none of them. The setup modal previews the same formula, so the tick resolves `roll < probability` against the displayed odds.
- `INSTALL_MODULE` allows flavor-mix between module and chassis (legit module on DIY chassis is intentional).
