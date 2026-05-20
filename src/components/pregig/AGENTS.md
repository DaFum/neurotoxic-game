# src/components/pregig - Agent Instructions

## Scope

Applies to `src/components/pregig/**`.

## Rules

- Modifier costs come from `MODIFIER_COSTS`; do not duplicate prices in UI.
- Starting a gig must respect the `START_GIG` reset of `gigModifiers`.
- Keep copy and option labels in EN/DE locale files.
- All buttons must have `type='button'`; price adjustment buttons must have an `aria-label` with the item name.
- Use CSS design-token vars (`--color-toxic-green`, `--color-void-black`, etc.) for colors; do not hardcode Tailwind color classes.

## Merch Item Lookup

- Use `HQ_ITEMS_BY_MERCH_KEY` (exported from `src/data/hqItems.ts`) — a precomputed `Map<string, HQItem>` keyed by `effect.item` (e.g. `'shirts'`, `'vinyl'`).
- Call `HQ_ITEMS_BY_MERCH_KEY.get(key)` — O(1) — instead of scanning `Object.values(HQ_ITEMS).flat().find(...)`. Do not call `.find` on the raw `HQ_ITEMS` object (which is keyed by category, not flat).
- `ALL_HQ_ITEMS` (also exported from `src/data/hqItems.ts`) is the flat array for cases where iteration is needed.

## Tab Switcher (PreGig scene)

- `src/scenes/PreGig.tsx` renders a Logistics tab and a Merch tab; tab buttons use `aria-pressed` and i18n keys for labels.
- Components in this folder (e.g. `MerchStrategyBlock`) are rendered inside those tabs; they do not own top-level tab state.

## Gotchas

- Previous gig selections do not carry over. UI state should initialize from current defaults, not persisted old selections.
- Band-meeting / harmony-restore actions must guard `band.harmony >= 100` and refund (early-return with a "maxed out" info toast) before deducting cost; the clamp in the reducer would otherwise swallow the spend with no benefit.
