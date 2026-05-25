# src/components/assets - Agent Instructions

## Hub Architecture

- `AssetsScene` is the single hub for the long-term asset system. Section plans 2-5 register their views in `sectionRegistry.ts` (`SECTION_VIEWS[kind] = { Component, accent }`); foundation ships an empty registry and the hub renders a localized placeholder per tab.
- The hub sets `--section-accent` as a CSS variable on the scene root. Every modal and panel under `src/components/assets/` reads it via `var(--section-accent, var(--color-toxic-green))`. Do not prop-drill section colours.
- `AssetsTopBar` shows liquidity, net daily obligations, and outstanding debt. It computes obligations via `getTotalDailyObligations` from `src/utils/assetSelectors.ts` — do not recompute the formula inline.

## Shared Modals

- `ChassisAcquisitionModal`, `LoanProfileModal`, `CrowdfundSetupModal`, `CrowdfundCampaignCard`, `LiabilitiesPanel`, `RepairConfirmModal`, `SellConfirmModal`, `RiskEventModal`, `ForeclosureModal`, and `ModulePickerModal` are sektion-agnostic. They take an asset (or slot) via props and dispatch through `useGameActions()` helpers (`purchaseChassis`, `installModule`, `sellChassis`, etc.).
- DIY+loan is disabled in the UI (`ChassisAcquisitionModal`) as the first defense; the action creator returns `PURCHASE_CHASSIS_FAILED` as the second.
- `SellConfirmModal` previews the depreciation formula matching `handleSellChassis`. Keep them aligned — the reducer remains authoritative.
- `ModulePickerModal` filters `getModulePoolForAsset` by the active slot's `slotType`, surfaces `lockReasons` as structured badges, and blocks install on `exclusiveWithGroup` conflicts.
- `CrowdfundSetupModal` uses `resolveCrowdfundProbability` for the live probability preview (same function the tick reducer uses) and draws `plannedSuccessRoll` from `mulberry32(rngSeed ^ fameStake ^ days)` for per-campaign determinism within a session.

## Module Picker Performance

- The picker can render up to ~20 modules per section. The plan's specified strategy is virtual scrolling (e.g. `react-window`) plus thumbnail-size hints. Foundation uses a simple grid because the empty module registry can't stress-test it; section plans 2-5 must verify the picker's open-time before shipping.

## Tourbus

- `sections/TourbusSection.tsx` is the entry point; it registers itself in `SECTION_VIEWS.tourbus_chassis` from `sectionRegistry.ts` with accent `var(--color-toxic-green)`.
- `sections/TourbusVehicleView.tsx` renders a 16:9 `GeneratedImagePanel` background with absolutely-positioned hotspot buttons sourced from `TOURBUS_SLOT_POSITIONS`. Slots whose `slotType` has no position entry are skipped (sanity guard).
- `tb_trailer_addon` slots are NOT rendered on the van — they belong to `sections/TourbusTrailerOverlay.tsx`, which mounts only when `tb_trailer_hitch` is installed and renders a second 16:9 panel to the left of the van.
- All hotspot borders/buttons use `var(--section-accent, var(--color-toxic-green))` for consistent fallback when the scene root is absent.
