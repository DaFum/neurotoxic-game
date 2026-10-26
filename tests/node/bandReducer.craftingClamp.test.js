/**
 * @fileoverview Crafting reverts only what a clamped apply-on-add equipment
 * effect recorded (#3324, #3357).
 *
 * No shipped recipe consumes harmony equipment, so the recipe table is
 * replaced with one that consumes `c_abyssal_pendant` (harmony -10, applied on
 * add); the revert path itself is the code under test.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const PENDANT_RECIPE = {
  id: 'recipe_pendant_test',
  inputs: { c_abyssal_pendant: 1 },
  output: 'c_blood_pick',
  labelKey: 'items:crafting.recipe_blood_pick.label',
  descKey: 'items:crafting.recipe_blood_pick.desc'
}

mock.module(
  new URL('../../src/data/craftingRecipes.ts', import.meta.url).href,
  {
    namedExports: {
      getCraftingRecipe: id =>
        id === PENDANT_RECIPE.id ? PENDANT_RECIPE : null,
      CRAFTING_RECIPES: { [PENDANT_RECIPE.id]: PENDANT_RECIPE },
      isCraftingRecipeId: id => id === PENDANT_RECIPE.id
    }
  }
)

const { handleCraftItem } =
  await import('../../src/context/reducers/bandReducer.ts')
const { DEFAULT_BAND_STATE } = await import('../../src/context/initialState.ts')

const craft = (stashEntry, harmony) =>
  handleCraftItem(
    {
      band: {
        ...DEFAULT_BAND_STATE,
        harmony,
        stash: { c_abyssal_pendant: stashEntry }
      },
      toasts: [],
      activeQuests: []
    },
    {
      recipeId: PENDANT_RECIPE.id,
      instanceId: 'crafted-pendant-test',
      toastId: 'craft_toast_pendant_test'
    }
  )

test('crafting reverts only the clamped amount the add recorded', () => {
  // Added at harmony 5: -10 clamped to the floor of 1, so it moved 4 points.
  const next = craft(
    { id: 'c_abyssal_pendant', stacks: null, appliedValue: -4 },
    1
  )

  // Reverting the catalog -10 would give 11; the recorded -4 restores 5.
  assert.equal(next.band.harmony, 5)
  assert.ok(!Object.hasOwn(next.band.stash, 'c_abyssal_pendant'))
})

test('crafting keeps the harmony inside the clamp range after the revert', () => {
  // A recorded delta that would overshoot is clamped to the ceiling of 100.
  const next = craft(
    { id: 'c_abyssal_pendant', stacks: null, appliedValue: -10 },
    98
  )

  assert.equal(next.band.harmony, 100)
})

test('crafting falls back to the catalog value when no delta was recorded', () => {
  const next = craft({ id: 'c_abyssal_pendant', stacks: null }, 40)

  assert.equal(next.band.harmony, 50)
})
