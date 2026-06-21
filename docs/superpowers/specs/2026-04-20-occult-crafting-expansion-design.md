# Occult Crafting Expansion Design

## 1. Overview
The "Cursed Crafting" expansion grafts Occult Artifacts and Void Relics into the existing Contraband and Crafting systems. We will introduce new common occult consumables (e.g., "Bone Dust", "Torn Grimoire Pages") that can be combined in the existing `Crafting System` to forge powerful, risky equipment (e.g., "Cursed Setlist", "Blood-Stained Pick").

## 2. Architecture & Data Flow

### 2.1 Contraband Data (`src/data/contraband.ts`)
We will append new items to the `CONTRABAND_DB`:
- **Consumables (Inputs):** `c_bone_dust`, `c_grimoire_page`, `c_void_ash`.
- **Equipment (Outputs):** `c_cursed_setlist`, `c_blood_pick`, `c_abyssal_pendant`.
These will follow the existing strict data schemas for `type`, `effectType`, and `rarity`.

### 2.2 Crafting Recipes (`src/data/craftingRecipes.ts`)
We will add new entries to `CRAFTING_RECIPES`:
- `recipe_cursed_setlist`: Requires `c_grimoire_page` x3, `c_void_ash` x1 -> Outputs `c_cursed_setlist`.
- `recipe_blood_pick`: Requires `c_bone_dust` x2, `c_rusty_strings` x1 -> Outputs `c_blood_pick`.

### 2.3 Asset System Hooks
The new equipment items will use existing `effectType` (like `luck`, `harmony_max`) or we can introduce new ones (like `zealotry_gain`, `controversy_gain`) if supported, or rely on existing asset modifier selectors in `src/utils/assetSelectors.ts`.

## 3. UI Updates
No new UI panels are strictly required since we are hooking into the existing `ContrabandStash` and `Workshop` modal. However, we will need to add i18n translation keys for the new item names and descriptions.

## 4. Testing Strategy
- Update/add Node.js tests (`tests/node/`) to ensure the new recipes correctly assemble and that the new equipment applies its modifiers when equipped.
- Validate that the new items don't break the `CONTRABAND_DB` structure.

## 5. N3UR0-FORGE Journal
Update `.jules/N3UR0-FORGE.md` with the new feature entry.

## 6. Implementation Retrospective
The implementation introduced `stress`, `harmony`, and `crit` correctly as effect types that applied via the asset system hooks to the band state when equipping these cursed items. We updated the actual effect mappings in `src/utils/contrabandEffects.ts` by adding them to `EQUIPMENT_APPLY_ON_ADD_EFFECTS` and `ADDITIVE_BAND_EFFECT_FIELDS`, and updating tests accordingly in `tests/node/contrabandEffects.test.js`.
