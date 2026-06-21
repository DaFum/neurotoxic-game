/**
 * Crafting Recipes
 *
 * Recipes combine common contraband from the band's stash into more useful
 * artifacts. Inputs and outputs reference `CONTRABAND_BY_ID` ids. The
 * `handleCraftItem` reducer is the authority: it verifies inputs are present,
 * consumes them, and only then adds the output (aborting without consuming if
 * the output cannot be added, e.g. a non-stackable already owned).
 */

export interface CraftingRecipe {
  id: string
  /** Map of contraband id to required stack count. */
  inputs: Record<string, number>
  /** Contraband id produced (one unit). */
  output: string
  /** i18n keys for the workshop UI. */
  labelKey: string
  descKey: string
}

/**
 * Static crafting recipe registry keyed by recipe id.
 */
export const CRAFTING_RECIPES = {
  recipe_amped_synth: {
    id: 'recipe_amped_synth',
    inputs: { c_void_energy: 3 },
    output: 'c_amped_synth',
    labelKey: 'items:crafting.recipe_amped_synth.label',
    descKey: 'items:crafting.recipe_amped_synth.desc'
  },
  recipe_cursed_pick: {
    id: 'recipe_cursed_pick',
    inputs: { c_sticky_plectrum: 2 },
    output: 'c_cursed_pick',
    labelKey: 'items:crafting.recipe_cursed_pick.label',
    descKey: 'items:crafting.recipe_cursed_pick.desc'
  },
  recipe_blood_pact: {
    id: 'recipe_blood_pact',
    inputs: { c_mystery_pills: 2, c_void_energy: 1 },
    output: 'c_blood_pact',
    labelKey: 'items:crafting.recipe_blood_pact.label',
    descKey: 'items:crafting.recipe_blood_pact.desc'
  },
  recipe_cursed_setlist: {
    id: 'recipe_cursed_setlist',
    inputs: { c_grimoire_page: 3, c_void_ash: 1 },
    output: 'c_cursed_setlist',
    labelKey: 'items:crafting.recipe_cursed_setlist.label',
    descKey: 'items:crafting.recipe_cursed_setlist.desc'
  },
  recipe_blood_pick: {
    id: 'recipe_blood_pick',
    inputs: { c_bone_dust: 2, c_rusty_strings: 1 },
    output: 'c_blood_pick',
    labelKey: 'items:crafting.recipe_blood_pick.label',
    descKey: 'items:crafting.recipe_blood_pick.desc'
  }
} as const satisfies Record<string, CraftingRecipe>

/**
 * Valid key in the crafting recipe registry.
 */
export type CraftingRecipeId = keyof typeof CRAFTING_RECIPES

/**
 * Checks whether a string is a registered crafting recipe id.
 *
 * @param id - Candidate recipe id.
 * @returns True when the recipe id exists in `CRAFTING_RECIPES`.
 */
export const isCraftingRecipeId = (id: string): id is CraftingRecipeId =>
  Object.hasOwn(CRAFTING_RECIPES, id)

/**
 * Looks up a crafting recipe by id.
 *
 * @param id - Candidate recipe id.
 * @returns Matching recipe, or undefined when the id is unknown.
 */
export const getCraftingRecipe = (id: string): CraftingRecipe | undefined =>
  isCraftingRecipeId(id) ? CRAFTING_RECIPES[id] : undefined
