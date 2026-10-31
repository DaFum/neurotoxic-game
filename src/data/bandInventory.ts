/**
 * Default band inventory: every inventory id the game knows, with its starting
 * value. `DEFAULT_BAND_STATE.inventory` (`src/context/initialState.ts`) copies
 * it, and the event `item` effect allow-list (`isValidItemTarget` in
 * `src/utils/eventEngine/effectTargets.ts`) is derived from its keys.
 */
export const DEFAULT_BAND_INVENTORY: Readonly<
  Record<string, number | boolean>
> = Object.freeze({
  shirts: 50,
  hoodies: 20,
  patches: 100,
  cds: 30,
  vinyl: 10,
  neuro_cutting_board: 0,
  neuro_lunchbox: 0,
  neuro_mug: 0,
  neuro_bowl: 0,
  strings: true,
  cables: true,
  drum_parts: true,
  golden_pick: false,
  neurotoxicPedal: false,
  neuroDecimator: false,
  // HQ shop / quest-reward items; effects live in `data/inventoryItems.ts`.
  sleeping_bags: false,
  tape_glue: 0,
  broken_pedal: false,
  cheap_mics: 0,
  diy_patch_kit: false,
  canned_food: 0,
  beer_bulk: 0,
  lucky_pick: false,
  energy_drink: false
})
