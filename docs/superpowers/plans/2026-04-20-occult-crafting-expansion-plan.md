# Implementation Plan: Occult Crafting Expansion

## Step 1: Data Definitions & Localization
- Open `src/data/contraband.ts`.
- Append new consumable materials (`c_bone_dust`, `c_grimoire_page`, `c_void_ash`) and equipment (`c_cursed_setlist`, `c_blood_pick`, `c_abyssal_pendant`) to `CONTRABAND_DB`.
- Open `public/locales/en/items.json` and `public/locales/de/items.json`.
- Add name and description keys for the new contraband items.
- Run `pnpm run test` to verify the DB loads without breaking schemas.

## Step 2: Crafting Recipes & Localization
- Open `src/data/craftingRecipes.ts`.
- Append `recipe_cursed_setlist` and `recipe_blood_pick` to `CRAFTING_RECIPES`.
- Open `public/locales/en/items.json` and `public/locales/de/items.json`.
- Add label and desc keys for the new crafting recipes under the `crafting` namespace.
- Run `pnpm run typecheck:core` and `pnpm run test` to ensure the recipes are valid and break no type definitions.

## Step 3: Tests
- Open `tests/node/logic/crafting.test.ts` (or create it if it doesn't exist, checking where crafting is currently tested, likely `tests/node/reducers/bandReducer.test.ts` or a dedicated file).
- Add a specific test case that asserts crafting a `recipe_cursed_setlist` correctly consumes `c_grimoire_page` and `c_void_ash` and produces `c_cursed_setlist`.
- Run `pnpm run test:node` to verify the test passes.

## Step 4: Asset Modifiers Verification
- Verify that the `effectType` used in the new equipment correctly applies during gig/overworld calculations. We will rely on existing `effectType` handlers (e.g., `luck`, `harmony_max`) as defined in `src/utils/assetSelectors.ts`.
- Run `pnpm run test:node` to verify no logic regressions.

## Step 5: N3UR0-FORGE Journal
- Open `.jules/N3UR0-FORGE.md`.
- Append the new feature entry following the mandated format.
