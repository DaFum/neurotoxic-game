# src/components/assets - Agent Instructions

## Hub Architecture

- `AssetsScene` is the single hub for the long-term asset system. Section plans 2-5 register their views in `sectionRegistry.ts` (`SECTION_VIEWS[kind] = { Component, accent }`); foundation ships an empty registry and the hub renders a localized placeholder per tab.
- The hub sets `--section-accent` as a CSS variable on the scene root. Every modal and panel under `src/components/assets/` reads it via `var(--section-accent, var(--color-toxic-green))`. Do not prop-drill section colours.
- `AssetsTopBar` shows liquidity, net daily obligations, and outstanding debt. It computes obligations via `getTotalDailyObligations` and debt via `getTotalDebt` from `src/utils/assetSelectors.ts` — do not recompute the formulas inline.
- `AssetsScene` tabs and the active tabpanel are linked via `id={`assets-tab-${kind}`}` ↔ `aria-controls`/`aria-labelledby`. Preserve those ids when restructuring the hub.
- Slot hotspots use the shared `--color-hotspot-bg` token (defined in `src/index.css`) for their empty-state background. Don't reintroduce `rgba(0,0,0,0.5)` literals in TSX.
- Mobile layout: the tab strip scrolls horizontally with icon-only chips under `sm`, the trailer overlay stacks beneath the van under `md`. Section views should be authored relative-positioned so trailer-like sub-panels can collapse into flow on small viewports.

## Shared Modals

- `ChassisAcquisitionModal`, `LoanProfileModal`, `CrowdfundSetupModal`, `CrowdfundCampaignCard`, `LiabilitiesPanel`, `RepairConfirmModal`, `SellConfirmModal`, `RiskEventModal`, `ForeclosureModal`, and `ModulePickerModal` are sektion-agnostic. They take an asset (or slot) via props and dispatch through `useGameActions()` helpers (`purchaseChassis`, `installModule`, `sellChassis`, etc.).
- DIY+loan is disabled in the UI (`ChassisAcquisitionModal`) as the first defense; the action creator returns `PURCHASE_CHASSIS_FAILED` as the second.
- `SellConfirmModal` previews the depreciation formula matching `handleSellChassis`. Keep them aligned — the reducer remains authoritative.
- `ModulePickerModal` filters `getModulePoolForAsset` by the active slot's `slotType`, surfaces `lockReasons` as structured badges, and blocks install on `exclusiveWithGroup` conflicts. It subscribes to narrow state slices (`player.fame`, `player.money`, `social.scenePresence`, `activeStoryFlags`, `band`, `assets`) and rebuilds a synthetic composite for `getModulePoolForAsset` so the modal does NOT re-render on every unrelated state change. Add a new slice to the selector set when adding a new `LockReason` branch.
- `CrowdfundSetupModal` computes the success probability via `resolveCrowdfundProbability(fame, scenePresence, target)` (exported from `assetTicks.ts`) and passes it as `plannedSuccessProbability` into `startCrowdfund`. The action creator clamps it into `[0.05, 0.95]` and stamps it onto the campaign; `processCrowdfundTick` resolves success when `plannedSuccessRoll < plannedSuccessProbability`. The displayed odds ARE the realized odds — never replace the formula on one side without the other. `plannedSuccessRoll` itself is drawn from `mulberry32(rngSeed ^ fameStake ^ days)` for per-campaign determinism inside a session.
- `CrowdfundSetupModal` fame-stake slider is capped at the player's current `fame` (no `Math.max(20, fame)` floor — that allowed staking phantom fame); the initial state is `Math.min(20, fame)` for the same reason.

## Module Picker Performance

- The picker renders up to ~20 modules per section (17 for Tourbus). A simple `grid` is sufficient at that scale; virtualization (`react-window`) is explicitly out of scope until a section ships >50 modules. Re-evaluate if/when sections push past that bar.

## Tourbus

- `sections/TourbusSection.tsx` is the entry point; it registers itself in `SECTION_VIEWS.tourbus_chassis` from `sectionRegistry.ts` with accent `var(--color-toxic-green)`.
- `sections/TourbusVehicleView.tsx` renders a 16:9 `GeneratedImagePanel` background with absolutely-positioned hotspot buttons sourced from `TOURBUS_SLOT_POSITIONS`. Slots whose `slotType` has no position entry are skipped (sanity guard).
- `tb_trailer_addon` slots are NOT rendered on the van — they belong to `sections/TourbusTrailerOverlay.tsx`, which mounts only when `tb_trailer_hitch` is installed. On `md+` it docks left of the van as an absolute overlay; under `md` it flows below the van so it doesn't overflow narrow viewports.
- All hotspot borders/buttons use `var(--section-accent, var(--color-toxic-green))` for consistent fallback when the scene root is absent. Hotspot size scales `w-9/h-9 → sm:w-12 → md:w-16` so hotspots stay reachable on phones without dominating the 16:9 background.

## Studio

- `sections/StudioSection.tsx` is the entry point; it registers in `SECTION_VIEWS.studio_chassis` from `sectionRegistry.ts` with accent `var(--color-electric-blue)`.
- `sections/StudioFloorplanView.tsx` renders a 4:3 isometric studio background with rectangle zone overlays sourced from `STUDIO_SLOT_ZONES` — dashed borders instead of round point hotspots, matching the room-layout metaphor (zones, not points).
- Zone rectangles use `top-left = (x - w/2, y - h/2)` and `width/height = (w, h)` after percent conversion.
- Installed-module thumbnails route through `GeneratedImagePanel` with `aspectRatio='1:1'` + `variant='hotspot'` — do NOT introduce raw `<img>` tags here; the project's GeneratedImagePanel-is-the-only-Pollinations-consumer rule applies.

## Bandhaus

- `sections/BandhausSection.tsx` is the entry point; registers `SECTION_VIEWS.bandhaus_chassis` from `sectionRegistry.ts` with accent `var(--color-cosmic-purple)`. Uses the narrow-selector + `useMemo` pattern (subscribes to `s.assets` and memo-filters) so the panel doesn't re-render on unrelated state changes.
- `sections/BandhausCrossSectionView.tsx` renders a 3:4 portrait Dollhouse cross-section. Slot rectangles use `top-left = (x - w/2, y - h/2)`.
- `bh_secret` slots are tier-gated in the UI: the view returns `null` for any `bh_secret` slot when `asset.chassisTier < 3`, even if a sanitizer or save migration left the slot in place.
- `bh_identity` slots, when populated, render the module image as a wide facade overlay (`sizeHint: { width: 512, height: 128 }`) with a half-transparent `--color-hotspot-bg` backdrop so the mural stays legible against the background image. Non-mural installed slots use a transparent backdrop.
- All borders use `var(--section-accent, var(--color-cosmic-purple))`. Installed-module thumbnails route through `GeneratedImagePanel` — no raw `<img>` here, per the project Pollinations rule.

## Merch-Werkstatt

- `sections/MerchWorkshopSection.tsx` is the entry point; registers `SECTION_VIEWS.merch_workshop_chassis` from `sectionRegistry.ts` with accent `var(--color-warning-yellow)`. Use the narrow-selector + `useMemo` pattern from Studio/Bandhaus.
- `sections/WorkshopProductionLineView.tsx` renders a 21:9 ultrawide conveyor with station rectangles from `WORKSHOP_SLOT_ZONES` and a decorative CSS line between main production slots. Installed-module thumbnails must route through `GeneratedImagePanel`; do not add raw Pollinations `<img>` consumers.
- `enablesLimitedEditions` (`mw_vinyl_cutter`) and `enablesBulkProduction` are asset modifier flags for merch/economy consumers. The section UI only surfaces module installation; feature behavior belongs in the merch/economy path.
