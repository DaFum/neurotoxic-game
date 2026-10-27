# src/components/assets - Agent Instructions

## Hub Architecture

- `AssetsScene` is the single hub for the long-term asset system. `sectionRegistry.ts` owns the section view map (`SECTION_VIEWS[kind] = { Component, accent }`); keep all four shipped sections registered there unless deliberately removing a section.
- The hub sets `--section-accent` as a CSS variable on the scene root. Every modal and panel under `src/components/assets/` reads it via `var(--section-accent, var(--color-toxic-green))`. Do not prop-drill section colours.
- `AssetsStatusStrip` shows liquidity, net daily obligations, outstanding debt, and active crowdfund campaigns. It computes obligations via `getTotalDailyObligations` and debt via `getTotalDebt` from `src/utils/assets/assetSelectors.ts` — do not recompute the formulas inline.
- `AssetsBottomTabs` owns the section tablist. Tabs and the active tabpanel are linked via `id={`assets-tab-${kind}`}` ↔ `aria-controls`/`aria-labelledby`. Preserve those ids when restructuring the hub.
- Asset UI styles must use defined color tokens such as `--color-void-black` and `--color-blood-red`; `--color-void` and `--color-blood` are not aliases in `src/index.css`.
- Section entry points stay thin wrappers around `AssetSectionPanel`/`AssetSectionDeck` that pass `kind` and a hero renderer.
- Mobile layout: section navigation is the sticky bottom tab bar; labels must wrap without horizontal overflow. The trailer overlay stacks beneath the van under `md`. Section views should be authored relative-positioned so trailer-like sub-panels can collapse into flow on small viewports.

## Shared Modals

- The shared modals (`ChassisAcquisitionModal`, `ModulePickerModal`, `CrowdfundSetupModal`, `RepairConfirmModal`, `SellConfirmModal`, and the rest) are section-agnostic: they take an asset (or slot) via props and dispatch through `useGameActions()` helpers.
- `RiskEventModal` and `ForeclosureModal` are owned globally by `AssetNotifications`, mounted near the app shell in `GameContent` (`src/App.tsx`), which renders them from `state.pendingRiskEvent` / `state.pendingForeclosureNotices`. `advanceDay()` can raise these from any scene, so they must surface scene-independently — do NOT also render them inside `AssetsScene` or any other scene (they would appear twice). Because `AssetNotifications` mounts outside the hub, `--section-accent` is undefined there and `RiskEventModal` falls back to `var(--color-toxic-green)`.
- DIY+loan is disabled in the UI (`ChassisAcquisitionModal`) as the first defense; the action creator returns `PURCHASE_CHASSIS_FAILED` as the second.
- `SellConfirmModal` previews the depreciation formula matching `handleSellChassis`. Keep them aligned — the reducer remains authoritative.
- `ModulePickerModal` subscribes to narrow state slices (`player.fame`, `player.money`, `social.scenePresence`, `activeStoryFlags`, `band`, `assets`) and rebuilds a synthetic composite for `getModulePoolForAsset` so it does NOT re-render on every unrelated state change. Add a new slice to the selector set when adding a new `LockReason` branch.
- `CrowdfundSetupModal` previews the odds via `resolveCrowdfundProbability`, the same function `startCrowdfund` uses to stamp the campaign. The displayed odds ARE the realized odds — never replace the formula on one side without the other.
- `CrowdfundSetupModal` fame-stake slider is capped at the player's current `fame` (no `Math.max(20, fame)` floor — that allowed staking phantom fame); the initial state is `Math.min(20, fame)` for the same reason.
- `ModulePickerModal` disables install and remove (with `assets:installFailed.expedition_locked`) for the committed chassis via the same predicate; `validateModuleInstall` returns `EXPEDITION_LOCKED` and `useAssetDispatchActions.removeModule` toasts `assets:removeFailed.expedition_locked` instead of dispatching.
- `UpgradeConfirmModal` disables the upgrade (with an `assets:upgradeFailed.expedition_locked` tooltip) for the chassis the active expedition committed to, via `isExpeditionChassisCommitmentLocked`. The action creator and reducer enforce the same predicate; the modal is only the first defense.
- Loans in default countdown (`defaultCounter > 0`) cannot be refinanced. Keep the UI, action creator, and reducer aligned so refinancing does not erase foreclosure pressure.

## Module Picker Performance

- The picker renders up to ~20 modules per section (17 for Tourbus). A simple `grid` is sufficient at that scale; virtualization (`react-window`) is explicitly out of scope until a section ships >50 modules. Re-evaluate if/when sections push past that bar.

## Tourbus

- `tb_trailer_addon` slots are NOT rendered on the van — they belong to `sections/TourbusTrailerOverlay.tsx`, which mounts only when `tb_trailer_hitch` is installed. On `md+` it docks left of the van as an absolute overlay; under `md` it flows below the van so it doesn't overflow narrow viewports.
- Trailer addon controls must depend on a compatible production registry pool. When none exist, show the localized unavailable label instead of opening an empty picker; retain controls for saved installed modules. Do not invent addon balance values to fill the pool.

## Studio

- Installed-module thumbnails route through `GeneratedImagePanel` with `aspectRatio='1:1'` + `variant='hotspot'` — do NOT introduce raw `<img>` tags here; the project's GeneratedImagePanel-is-the-only-Pollinations-consumer rule applies.

## Bandhaus

- `BandhausSection` uses the narrow-selector + `useMemo` pattern (subscribes to `s.assets` and memo-filters) so the panel doesn't re-render on unrelated state changes.
- `bh_secret` slots are tier-gated in the UI: the view returns `null` for any `bh_secret` slot when `asset.chassisTier < 3`, even if a sanitizer or save migration left the slot in place.

## Merch-Werkstatt

- `MerchWorkshopSection` uses the narrow-selector + `useMemo` pattern from Studio/Bandhaus.
- Workshop installed-module thumbnails must route through `GeneratedImagePanel`; do not add raw Pollinations `<img>` consumers.
- `enablesLimitedEditions` (`mw_vinyl_cutter`) is an asset modifier flag for merch/economy consumers. The section UI only surfaces module installation; feature behavior belongs in the merch/economy path.
