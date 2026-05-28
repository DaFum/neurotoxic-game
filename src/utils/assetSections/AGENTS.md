# src/utils/assetSections - Agent Instructions

## Tourbus

- `tourbusConfig.ts` exports `TOURBUS_T1_SLOTS`, `TOURBUS_T2_SLOTS`, `TOURBUS_T3_SLOTS` (`as const` tuples) and `TOURBUS_SLOT_POSITIONS: Partial<Record<SlotType, {x,y}>>`; callers must handle `undefined`.
- `tourbusModules.ts` registers 17 modules by mutating `MODULE_REGISTRY` / `MODULE_PROMPTS` from `assetRegistryStore.ts`. Keep tourbus module registration in this file.
- `tb_trailer_hitch` has `slotType: 'tb_trailer_mount'` and adds `tb_trailer_addon` slots. New modules must never declare both `slotType: X` and `addsSlots: [{ slotType: X, ... }]`; registry invariant tests reject self-stacking.

## Studio

- `studioConfig.ts` exports `STUDIO_SLOT_ZONES: Partial<Record<SlotType, {x, y, w, h}>>`. Zones are rectangles over a 4:3 background; callers compute top-left as `(x - w/2, y - h/2)`.
- `studioModules.ts` registers 14 modules. DIY studio `riskEventTypes` feed `rollAssetRiskEvents`; do not duplicate risk-event selection outside the tick helper.
- `st_pro_tools_hd.boni.enablesReRecording` is surfaced by `getActiveAssetModifiers`; re-recording behavior does not belong in section config.

## Bandhaus

- `bandhausConfig.ts` exports `BANDHAUS_T1_SLOTS` / `T2_SLOTS` / `T3_SLOTS` and `BANDHAUS_SLOT_ZONES` for the 3:4 portrait cross-section. Rectangles are centered on `(x, y)`.
- `bh_secret` only exists in `BANDHAUS_T3_SLOTS`, so `bh_secret`-slotted modules are implicitly Tier-3 gated. If a future module needs Tier-3 on a slot that exists earlier, add `unlock.minChassisTier: 3`.
- DIY bandhaus `riskEventTypes` feed `rollAssetRiskEvents`; keep risk selection in the tick helper.

## Merch-Werkstatt

- `workshopConfig.ts` exports `WORKSHOP_T1_SLOTS` / `T2_SLOTS` / `T3_SLOTS` and `WORKSHOP_SLOT_ZONES` for the 21:9 production line.
- `mw_eco_ink_supply.unlock.requiredOtherModuleInstalled` uses an OR-set array; `isModuleUnlocked` owns that OR semantics. Do not reimplement unlock evaluation inside workshop modules.
