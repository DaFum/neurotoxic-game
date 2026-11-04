# Planned issue follow-ups — verification record

Started: 2026-11-02. Completed checks recorded on 2026-11-03.
Base: `e6b31c4eb0db64fa6329dc1cc6d6627596ef7709` (latest main fetched before implementation).

The issue bodies and their current Coding Plans were read before edits. The current source superseded several older prescriptions: the seven-day conservative donation bound and existing UI fixes were preserved. No dependency versions or live deployment/remote settings were changed; the Pages build explicitly disables the opt-in image proxy.

## Disposition

| Issues              | Result                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #3525               | Rest projection follows asset cash, skipped/paid/foreclosed liabilities, then living settlement; recalculates departure obligations. Real-reducer regression covers the final missed payment.                                |
| #3530               | Shared campaign outcome/materialization facts derive pending effects. Cost-side fame decreases, successful fame stakes, new asset income and sale credit are included at the correct rest index.                             |
| #3528               | Carried consumables supply one-use harmony and stamina recovery; active runs only credit packed stock. Tests cover fractional regen ceiling and explicit harmony terms.                                                      |
| #3503, #3517        | Existing sell/rest and donation/rest behavior retained. Differential checks and an adversarial 1,023-sale-scenario benchmark added to verification.                                                                          |
| #3519               | Stage failure invalidates sequence continuations before stopping playback; Retry resets gameplay/HUD and restarts song 0, preserving runtime services and the generation counter.                                            |
| #3493               | Expedition settlement checks route, fresh crisis and net cash/fuel requirements before committing travel effects. Refused arrival uses an appropriate localized explanation.                                                 |
| #3495               | No bookable onward leg disables futile refuel/tow/vehicle claims.                                                                                                                                                            |
| #3496               | Refused upgrades, sales and module install/removal keep the form open; action acceptance is returned consistently.                                                                                                           |
| #3509               | Flux removed from browser builds/URLs; opt-in same-origin proxy retains secrets server-side, with Redis rate limits, validated input and bounded/timeout image streaming. Static builds intentionally use bundled fallbacks. |
| #3506               | Browser-confirmed destination-label overlap and hidden compact names addressed with measured placement; final matrix listed below.                                                                                           |
| #3504               | Already fixed production readers; added day-toast, once-only resolution and every-write persistence assertions.                                                                                                              |
| #3507, #3514, #3520 | Already fixed on main; verified existing full-van feedback/PreGig direction, save refusal explanations and locale formatting.                                                                                                |
| #3510               | Unconfirmed. The race characterization proves duplicate allocation/cache overwrite, but repeated-entry post-GC counts and retaining paths were not obtained. No speculative production texture change.                       |
| #3499               | Umbrella source revalidation distinguishes merged fixes from remaining follow-ups. Texture profiling remains open; this PR does not claim to close the umbrella.                                                             |

## Verification

Completed source-freeze checks (all exit 0 unless explicitly qualified below):

- Final `typecheck:core`, reducer type gate and server type gate passed. The first combined core run identified an optional-campaign input type mismatch; the helper signature was corrected and the final core runs passed.
- Changed-file ESLint and Prettier passed; full dead-code and budget gates passed.
- Browser map matrix: 30/30 passed; fresh representatives: 3/3 passed. This covers phone and desktop career seeds, dense Expedition branches and normal Motion animation. Final hex footprints are measured independently of animated scale. Screenshots were inspected. At 320x568 the map can be scrolled to expose all three destination names clear of OPEN MENU, without starting confirmation. The intentional two-line name clamp is preserved.
- Full UI run: 2,101 passed and two ShopItem prompt tests failed because they assumed image generation was enabled by default. Those tests now opt into the proxy; the complete ShopItem file recheck passed 10/10. The full UI suite was not rerun after that test-only correction.
- Residual Node cohort: 1,032 passed and one hook file failed to link incomplete module mocks. The fixture now mocks the new pending-effects input and retains the real financial exports needed by the projection; the full hook file recheck passed 33/33. The earlier all-quick run was interrupted by the execution lifecycle after the rival-reducer tests; it is not recorded as a complete gate pass.
- Heavy Node tier: 49/49 passed. API/logic tier: 51 files / 964 tests passed.
- Tooling Node run: 295 passed and the symbol-index determinism test failed while source edits overlapped its consecutive scans. With sources frozen, its focused recheck passed. Tooling Vitest: 5/5 passed. No symbol-generator code change was required; ignored generated symbol indexes are not committed.
- Final locale cohort: 41/41 passed.
- Proxy-enabled and static production builds completed. A synthetic Flux sentinel was absent from both browser outputs. A browser smoke test reached the static menu online and offline through its service worker and made zero provider/proxy image requests. Final static build completed after the map changes.

Earlier interrupted commands remain incomplete, not passes. The full 2,000-sample balance-report regeneration did not complete: the initial 2-GB heap exhausted memory, and the 6-GB retry was interrupted by the execution lifecycle during matched skill/management probes. No replacement balance artifacts were produced; the full balance evidence remains outstanding.

Focused completed results before the final gates:

- Recovery: 112 Node + 12 caller-hook tests passed, including campaign/liability reducer oracles and packed/HQ cargo cases.
- Rhythm: 44 UI + 12 sequencer tests passed; AudioUtils 6 passed. MultiSong mock export updated for the new helper; included in final Node verification.
- Asset/travel UI: 12 files / 137 tests passed. The final 9-file focused Node recheck passed 217/217.
- Image: 135 combined API/client/leaderboard tests passed; final image API 36 passed; rate-limit security 5 passed; PWA 2 passed; server typecheck and focused lint passed.
- Provider/GameOver baseline: 70 passed; expanded provider assertions: 10 passed.
- Locale: integrity/parity 5, smoke 21 and full 15 passed. EN/DE ui.json already passed Prettier before new paired translation keys.
- Independent source review found no critical or important defects in proxy, recovery, asset/travel or Retry changes. The map review identified the animation-footprint issue; its correction is covered by a direct hook regression and the normal-motion browser case.

## PR review follow-up

The remote follow-up commit `ce8cc83cf` was fetched and incorporated before further edits. Its complete CI run [41641224659](https://github.com/DaFum/neurotoxic-game/actions/runs/41641224659) passed all eight test jobs, including both Node shards, UI, logic, tooling, performance, fast validation and Playwright. ESLint, Dead Code and CodeQL also passed for that commit. This supersedes the incomplete local full-suite runs recorded above.

Review findings were checked against current source. The remaining fixes require explicit case-insensitive `true` in both image-proxy environment paths, preserve the settled fuel-refusal reason for arrival feedback, and include complete menu/radio surfaces in label obstacles. A child-list observer discovers HUD elements inserted after the hook mounts and removes stale resize observations. Existing remote fixes cover Redis deadlines, above-tooltip clearance, localized shortcuts selectors, hovered hex footprints, rival penalties and once-per-gig event flags.

Focused follow-up verification: 141 UI/hook tests, 76 image utility/API tests and 45 Node tests passed. Core, server and reducer type checks passed, as did changed-file ESLint and Prettier. Tests additionally verify published day-advance toasts, crowdfund helper wiring, static ShopItem fallback and the Vite environment-prefix boundary. The browser collision helper now checks the label's own hexagon as well as other nodes. An initial above-label browser assertion exposed a fixture precondition (the original seed now places its labels below); the focused Career fixture puts a reachable destination near the map bottom to require an above anchor. Active Expedition saves rebuild coordinates during load, so the geometry fixture uses Career state. The 30-case career/dense-Expedition/animation cohort passed, followed by the original 320-px HUD case, the original seed-1 overlap case and the explicit above-anchor case (33 relevant browser passes in total).

## Performance evidence

Reproducible adversarial fixture: 10 actual sellable assets produce all 1,023 sale subsets; an impossible full-tank fuel leg forces the recovery search. Each phase used 3 warm-ups and 15 samples on the shared two-CPU executor.

| Phase                                     |     Median |    Maximum |
| ----------------------------------------- | ---------: | ---------: |
| Sale scenario construction                |  11.567 ms |  62.442 ms |
| Immediate search on precomputed scenarios |   8.407 ms |  43.232 ms |
| Seven-day recovery search                 | 144.705 ms | 221.717 ms |
| Construction plus recovery                | 230.931 ms | 346.326 ms |

This is an adversarial helper benchmark, not a browser frame-time claim. It exceeds a 16 ms frame budget. The existing largest-total rest evaluation is retained; the result is an explicit worst-case performance limitation.

## Operational limits

No live deployment, Redis instance, provider budget or production key was changed or inspected. API-capable deployments must configure the server-only Flux and Redis variables and explicitly enable the proxy build flag. Previously embedded keys must be rotated by their owner; live provider images and rate-limit behavior still require deployment verification. Static Pages builds require no unauthenticated provider access.

The historical audit's open dependency-approval note is superseded: main already pins i18next-http-backend 4.0.4. Fresh production audit reports zero advisories. The full dependency audit includes existing development-tool advisories; no dependency upgrade was part of these fixes.

The final #3510 browser attempt obtained real WebGL2 SwiftShader, but tutorial dismissal failed before a Tourbus entry. The development server also did not provide a valid image backend (its `/api/image` response was JavaScript), so it could not supply the real-response evidence required by the plan. Zero Tourbus cycles or heap snapshots were completed; the finding stays unconfirmed. No Pixi loading/cache/ownership code was changed.
