# src/components/pregig - Agent Instructions

## Rules

- Modifier costs come from `MODIFIER_COSTS` (`src/utils/economyEngine.ts`); do not duplicate prices in UI.
- `START_GIG` resets `gigModifiers` — UI state must initialize from current defaults, not persisted prior selections.
- Price adjustment buttons need an `aria-label` containing the item name.

## Merch Item Lookup

- Use `HQ_ITEMS_BY_MERCH_KEY` from `src/data/hqItems.ts` — a precomputed `Map<string, HQItem>` keyed by `effect.item` (`'shirts'`, `'vinyl'`, ...). Call `.get(key)` — O(1) — instead of scanning `Object.values(HQ_ITEMS).flat().find(...)`. `HQ_ITEMS` is keyed by category, not flat.
- `ALL_HQ_ITEMS` (same module) is the flat array when iteration is required.

## Gotchas

- Band-meeting / harmony-restore actions must guard `band.harmony >= 100` and early-return with a "maxed out" info toast before deducting cost; the reducer clamp would otherwise swallow the spend with no benefit.
