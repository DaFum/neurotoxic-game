/**
 * @fileoverview Crafting reverts only what a clamped apply-on-add equipment
 * effect recorded (#3324, #3357).
 *
 * No shipped recipe consumes harmony equipment, so the recipe table is
 * replaced with one that consumes `c_abyssal_pendant` (harmony -10, applied on
 * add); the revert path itself is the code under test. No shipped item is
 * stress equipment either, so the contraband catalog gets one synthetic entry
 * (`test_stress_equipment`, stress -10, applied on add) and a recipe for it.
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

const STRESS_ITEM_ID = 'test_stress_equipment'
const STRESS_RECIPE = {
  id: 'recipe_stress_test',
  inputs: { [STRESS_ITEM_ID]: 1 },
  output: 'c_blood_pick',
  labelKey: 'items:crafting.recipe_blood_pick.label',
  descKey: 'items:crafting.recipe_blood_pick.desc'
}
const RECIPES = {
  [PENDANT_RECIPE.id]: PENDANT_RECIPE,
  [STRESS_RECIPE.id]: STRESS_RECIPE
}

mock.module(
  new URL('../../src/data/craftingRecipes.ts', import.meta.url).href,
  {
    namedExports: {
      getCraftingRecipe: id =>
        Object.hasOwn(RECIPES, id) ? RECIPES[id] : null,
      CRAFTING_RECIPES: RECIPES,
      isCraftingRecipeId: id => Object.hasOwn(RECIPES, id)
    }
  }
)

// A copy of the real catalog plus one stress equipment entry; the real map is
// never mutated.
const realContraband = await import('../../src/data/contraband.ts')
const CONTRABAND_BY_ID = new Map(realContraband.CONTRABAND_BY_ID)
CONTRABAND_BY_ID.set(STRESS_ITEM_ID, {
  id: STRESS_ITEM_ID,
  name: 'test',
  type: 'equipment',
  effectType: 'stress',
  value: -10,
  stackable: false,
  maxStacks: 1,
  applyOnAdd: true
})
mock.module(new URL('../../src/data/contraband.ts', import.meta.url).href, {
  namedExports: { ...realContraband, CONTRABAND_BY_ID }
})

const { handleCraftItem } =
  await import('../../src/context/reducers/bandReducer.ts')
const { DEFAULT_BAND_STATE } = await import('../../src/context/initialState.ts')
const { addContrabandToBand } =
  await import('../../src/utils/contrabandStashUtils.ts')

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

const stateOf = band => ({ band, toasts: [], activeQuests: [] })
const craftFrom = (band, recipeId) =>
  handleCraftItem(stateOf(band), {
    recipeId,
    instanceId: 'crafted-test',
    toastId: 'craft_toast_test'
  })
const addPendant = harmony =>
  addContrabandToBand(
    { ...DEFAULT_BAND_STATE, harmony, stash: {} },
    { contrabandId: 'c_abyssal_pendant', instanceId: 'pendant-1' }
  )

test('a pendant added at harmony 5 is restored to 5 by crafting (add to craft)', () => {
  const added = addPendant(5)
  assert.equal(added.harmony, 1)
  assert.ok(Object.hasOwn(added.stash, 'c_abyssal_pendant'))
  assert.equal(added.stash.c_abyssal_pendant.appliedValue, -4)
  assert.equal(added.stash.c_abyssal_pendant.applied, true)

  const crafted = craftFrom(added, PENDANT_RECIPE.id)

  // Nominal reversal would give 11; the recorded -4 gives 5.
  assert.equal(crafted.band.harmony, 5)
  assert.ok(!Object.hasOwn(crafted.band.stash, 'c_abyssal_pendant'))
  assert.ok(Object.hasOwn(crafted.band.stash, 'c_blood_pick'))
})

test('a recorded zero is reverted as zero, not as the nominal value', () => {
  const added = addPendant(1)
  assert.equal(added.harmony, 1)
  assert.equal(added.stash.c_abyssal_pendant.appliedValue, 0)

  // Nominal or truthiness-based fallback reversal would give 11.
  assert.equal(craftFrom(added, PENDANT_RECIPE.id).band.harmony, 1)
})

test('an invalid recorded value falls back to the nominal revert', () => {
  const added = addPendant(5)
  const withRecorded = recorded => {
    const entry = { ...added.stash.c_abyssal_pendant }
    if (recorded === undefined) delete entry.appliedValue
    else entry.appliedValue = recorded
    return craftFrom(
      { ...added, stash: { c_abyssal_pendant: entry } },
      PENDANT_RECIPE.id
    ).band.harmony
  }

  // Control: the valid recording is honoured.
  assert.equal(withRecorded(-4), 5)
  for (const invalid of [undefined, NaN, Infinity, 4, -1000000]) {
    assert.equal(withRecorded(invalid), 11, String(invalid))
  }
})

test('stress equipment reverts its recorded delta and clamps the result', () => {
  const addStress = stress =>
    addContrabandToBand(
      { ...DEFAULT_BAND_STATE, stress, stash: {} },
      { contrabandId: STRESS_ITEM_ID, instanceId: 'stress-1' }
    )

  // Added at stress 4: -10 clamped to the floor of 0, so it moved 4 points.
  const low = addStress(4)
  assert.equal(low.stress, 0)
  assert.equal(low.stash[STRESS_ITEM_ID].appliedValue, -4)
  // Nominal reversal would give 10; the recorded -4 gives 4.
  assert.equal(craftFrom(low, STRESS_RECIPE.id).band.stress, 4)

  // Recorded equals nominal here, so only the clamp can keep this at 100.
  const high = addStress(50)
  assert.equal(high.stress, 40)
  assert.equal(high.stash[STRESS_ITEM_ID].appliedValue, -10)
  assert.equal(
    craftFrom({ ...high, stress: 98 }, STRESS_RECIPE.id).band.stress,
    100
  )
})
