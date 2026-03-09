# Missing Branch-Level Behavior Tracking

This checklist expands the file-level inventory in `tests/MISSING_TESTS_CODEBASE.md` into branch-level behavior targets.

## `src/components/stage/BaseStageController.js`

- [ ] Init success path: app/stage creation and ready state.
- [ ] Init failure path: renderer/app bootstrap error handling.
- [ ] Resize path: valid dimensions update stage correctly.
- [ ] Resize guard path: invalid/unavailable view dimensions are ignored.
- [ ] Dispose path: destroys app/resources exactly once.
- [ ] Dispose idempotency path: repeated dispose calls do not throw.

## `src/context/reducers/sceneReducer.js`

- [ ] Valid scene transition action updates scene.
- [ ] Invalid/unknown scene action returns previous state.
- [ ] Unsupported action type returns previous state.
- [ ] Reset/default branch restores initial scene state.

## `src/data/brandDeals.js`

- [ ] Each alignment/category bucket returns non-empty deal definitions.
- [ ] Deal objects satisfy required schema (id, alignment, offer, penalties/rules).
- [ ] Optional fields branch (item/perGig/penalty) is represented and valid.
- [ ] Any weighted/random grouping branch has valid totals and reachable entries.

## `src/data/events/consequences.js`

- [ ] Positive consequence path applies expected state deltas.
- [ ] Negative consequence path applies expected state deltas.
- [ ] Clamping/safety branch prevents invalid ranges.
- [ ] Unknown consequence key branch safely no-ops or falls back.

## `src/data/events/financial.js`

- [ ] Event selection path for each financial event category.
- [ ] Requirement-gated branch includes/excludes events correctly.
- [ ] Reward/penalty branch values are structurally valid.
- [ ] Fallback branch for empty/invalid pool is safe.

## `src/data/events/relationshipEvents.js`

- [ ] Relationship event pool selection by context/state.
- [ ] Conditional availability branches (flags, thresholds, prerequisites).
- [ ] Branches with band-member targeting resolve valid member references.
- [ ] Fallback branch when no relationship events are eligible.

## `src/data/events/special.js`

- [ ] Special event eligibility branches by progression/flags.
- [ ] Rare/high-impact branch appears only under intended conditions.
- [ ] Reward/penalty optional branches are shaped correctly.
- [ ] Empty-pool fallback branch is safe.

## `src/hooks/rhythmGame/useRhythmGameAudio.js`

- [ ] Start/playback branch initializes from audio engine clock.
- [ ] Pause/resume branch preserves timing continuity.
- [ ] End-of-track branch uses setlistCompleted + near-track-end dual gate.
- [ ] Notes-driven duration cap branch vs procedural-song duration branch.
- [ ] Cleanup branch unsubscribes/stops on unmount.

## `src/hooks/rhythmGame/useRhythmGameLoop.js`

- [ ] Active loop tick branch updates frame state.
- [ ] Inactive/paused branch skips updates.
- [ ] Drift/late-frame compensation branch behaves deterministically.
- [ ] Completion/exit branch stops loop and dispatches completion callback.
- [ ] Unmount cleanup branch cancels RAF/timers.

## `src/hooks/rhythmGame/useRhythmGameState.js`

- [ ] Input-hit branch updates combo/score/accuracy.
- [ ] Miss branch resets or reduces combo according to rules.
- [ ] Toxic/overload modifier branch changes state transitions correctly.
- [ ] Boundary branch clamps score-related and meter-related state.
- [ ] Game-over/finish branch produces expected terminal state.

## `src/scenes/KabelsalatScene.jsx`

- [ ] Scene initialization branch mounts required controllers/components.
- [ ] Success-complete branch routes to expected next scene/state updates.
- [ ] Failure/cancel branch routes to fallback scene/state.
- [ ] Pause/resume branch keeps scene state consistent.
- [ ] Unmount branch destroys resources cleanly.

## `src/scenes/Overworld.jsx`

- [ ] Travel selection valid branch initiates travel.
- [ ] Travel blocked branches (money/fuel/requirements) surface correct outcome.
- [ ] Arrival branch invokes arrival logic path.
- [ ] Refuel/repair branch updates resources and cost correctly.
- [ ] Interaction branch for current node vs new node path.

## `src/scenes/TourbusScene.jsx`

- [ ] Minigame start branch initializes run state and handlers.
- [ ] Damage/collision branches apply correct condition loss.
- [ ] Upgrade-modifier branches alter damage/chances as intended.
- [ ] Completion branch emits COMPLETE_TRAVEL_MINIGAME behavior.
- [ ] Abort/failure branch routes/cleans up correctly.

## `src/ui/DebugLogViewer.jsx`

- [ ] Empty-log branch renders placeholder state.
- [ ] Non-empty branch renders log entries with expected ordering.
- [ ] Filter/search branch includes/excludes entries correctly.
- [ ] Clear/close interaction branches update UI state correctly.

## `src/ui/GigModifierButton.jsx`

- [ ] Enabled branch triggers selection callback.
- [ ] Disabled/unaffordable branch blocks interaction.
- [ ] Selected/toggled branch reflects active styling/state.
- [ ] Cost label/metadata branch renders correctly for optional fields.

## `src/ui/bandhq/SettingsTab.jsx`

- [ ] Language setting branch updates selected locale.
- [ ] Audio slider/toggle branches call expected handlers.
- [ ] Persisted-setting load branch hydrates defaults correctly.
- [ ] Missing/invalid setting fallback branch keeps UI stable.

## `src/ui/bandhq/ShopItem.jsx`

- [ ] Purchasable branch fires purchase callback.
- [ ] Unaffordable branch disables action and shows reason.
- [ ] Owned/one-time branch prevents repurchase.
- [ ] Passive/stat/item type branches render correct metadata.

## `src/ui/bandhq/ShopTab.jsx`

- [ ] Catalog render branch lists available upgrades/items.
- [ ] Filter/category branch changes visible set correctly.
- [ ] Purchase success branch updates owned state and feedback.
- [ ] Purchase failure branch (insufficient funds/invalid) surfaces error path.

## `src/ui/bandhq/UpgradesTab.jsx`

- [ ] Owned upgrades render branch vs empty owned-list branch.
- [ ] Tier/slot grouping branch displays each section correctly.
- [ ] Tooltip/details branch shows expected upgrade effects.
- [ ] Unknown upgrade id fallback branch avoids crash.

## `src/ui/shared/Icons.jsx`

- [ ] Each exported icon component renders without props.
- [ ] Size/color/className prop branches are applied correctly.
- [ ] Accessibility/title branch behaves correctly when title is present/absent.

## `src/ui/shared/propTypes.js`

- [ ] Each shared PropTypes shape validates valid props.
- [ ] Missing required fields branch emits expected warnings.
- [ ] Optional nested fields branch accepts omissions safely.
- [ ] Invalid-type branch emits expected warnings.
