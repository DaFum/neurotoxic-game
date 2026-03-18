// TODO: Review this file
/**
 * Contraband & Relics Data Catalog
 * Artifacts gathered from the void during tour.
 * They either grant immediate consumable effects or passive buffs.
 * @module contraband
 */

const CONTRABAND_DB = [
  // ursprüngliche Items (bewahrt)
  {
    id: 'c_void_energy',
    imagePrompt: 'ITEM_VOID_ENERGY',
    name: 'items:contraband.c_void_energy.name',
    type: 'consumable',
    effectType: 'stamina',
    value: 50,
    description: 'items:contraband.c_void_energy.description',
    rarity: 'common',
    icon: 'icon_void_energy',
    stackable: true,
    maxStacks: 5
  },
  {
    id: 'c_rusty_strings',
    imagePrompt: 'ITEM_RUSTY_STRINGS',
    name: 'items:contraband.c_rusty_strings.name',
    type: 'equipment',
    effectType: 'luck',
    value: 5,
    description: 'items:contraband.c_rusty_strings.description',
    rarity: 'uncommon',
    icon: 'icon_rusty_strings',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_cursed_pick',
    imagePrompt: 'ITEM_CURSED_PICK',
    name: 'items:contraband.c_cursed_pick.name',
    type: 'consumable',
    effectType: 'guitar_difficulty',
    value: -0.2,
    description: 'items:contraband.c_cursed_pick.description',
    rarity: 'rare',
    duration: 1,
    icon: 'icon_cursed_pick',
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'c_mystery_pills',
    imagePrompt: 'ITEM_MYSTERY_PILLS',
    name: 'items:contraband.c_mystery_pills.name',
    type: 'consumable',
    effectType: 'mood',
    value: 30,
    description: 'items:contraband.c_mystery_pills.description',
    rarity: 'common',
    icon: 'icon_pills',
    stackable: true,
    maxStacks: 10
  },
  {
    id: 'c_blood_pact',
    imagePrompt: 'ITEM_BLOOD_PACT',
    name: 'items:contraband.c_blood_pact.name',
    type: 'consumable',
    effectType: 'harmony',
    value: 15,
    description: 'items:contraband.c_blood_pact.description',
    rarity: 'rare',
    icon: 'icon_blood_pact',
    stackable: false
  },

  // viele neue Items
  {
    id: 'c_phase_metronome',
    imagePrompt: 'ITEM_PHASE_METRONOME',
    name: 'items:contraband.c_phase_metronome.name',
    type: 'consumable',
    effectType: 'tempo',
    value: 0.15,
    duration: 1,
    description: 'items:contraband.c_phase_metronome.description',
    rarity: 'uncommon',
    icon: 'icon_metronome',
    stackable: true,
    maxStacks: 2
  },
  {
    id: 'c_shattered_ear',
    imagePrompt: 'ITEM_SHATTERED_EAR',
    name: 'items:contraband.c_shattered_ear.name',
    type: 'equipment',
    effectType: 'crit',
    value: 0.05,
    description: 'items:contraband.c_shattered_ear.description',
    rarity: 'rare',
    icon: 'icon_talisman',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_amped_synth',
    imagePrompt: 'ITEM_AMPED_SYNTH',
    name: 'items:contraband.c_amped_synth.name',
    type: 'equipment',
    effectType: 'stamina_max',
    value: 10,
    description: 'items:contraband.c_amped_synth.description',
    rarity: 'uncommon',
    icon: 'icon_synth',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_gig_program',
    imagePrompt: 'ITEM_GIG_PROGRAM',
    name: 'items:contraband.c_gig_program.name',
    type: 'consumable',
    effectType: 'tour_success',
    value: 0.2,
    duration: 1,
    description: 'items:contraband.c_gig_program.description',
    rarity: 'rare',
    icon: 'icon_program',
    stackable: true,
    maxStacks: 1
  },
  {
    id: 'c_sticky_plectrum',
    imagePrompt: 'ITEM_STICKY_PLECTRUM',
    name: 'items:contraband.c_sticky_plectrum.name',
    type: 'consumable',
    effectType: 'guitar_difficulty',
    value: -0.1,
    duration: 1,
    description: 'items:contraband.c_sticky_plectrum.description',
    rarity: 'common',
    icon: 'icon_plectrum',
    stackable: true,
    maxStacks: 8
  },
  {
    id: 'c_night_vision_glasses',
    imagePrompt: 'ITEM_NIGHT_VISION_GLASSES',
    name: 'items:contraband.c_night_vision_glasses.name',
    type: 'equipment',
    effectType: 'crowd_control',
    value: 0.08,
    description: 'items:contraband.c_night_vision_glasses.description',
    rarity: 'uncommon',
    icon: 'icon_glasses',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_sonic_resonator',
    imagePrompt: 'ITEM_SONIC_RESONATOR',
    name: 'items:contraband.c_sonic_resonator.name',
    type: 'relic',
    effectType: 'gig_modifier',
    value: 0.12,
    duration: 2,
    description: 'items:contraband.c_sonic_resonator.description',
    rarity: 'rare',
    icon: 'icon_resonator',
    stackable: false
  },
  {
    id: 'c_weekender_coffee',
    imagePrompt: 'ITEM_WEEKENDER_COFFEE',
    name: 'items:contraband.c_weekender_coffee.name',
    type: 'consumable',
    effectType: 'stamina',
    value: 25,
    description: 'items:contraband.c_weekender_coffee.description',
    rarity: 'common',
    icon: 'icon_coffee',
    stackable: true,
    maxStacks: 5
  },
  {
    id: 'c_blackout_mask',
    imagePrompt: 'ITEM_BLACKOUT_MASK',
    name: 'items:contraband.c_blackout_mask.name',
    type: 'consumable',
    effectType: 'mood',
    value: 50,
    description: 'items:contraband.c_blackout_mask.description',
    rarity: 'rare',
    icon: 'icon_mask',
    stackable: false
  },
  {
    id: 'c_phantom_strings',
    imagePrompt: 'ITEM_PHANTOM_STRINGS',
    name: 'items:contraband.c_phantom_strings.name',
    type: 'equipment',
    effectType: 'guitar_difficulty',
    value: -0.35,
    description: 'items:contraband.c_phantom_strings.description',
    rarity: 'epic',
    icon: 'icon_phantom_strings',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_merch_manifest',
    imagePrompt: 'ITEM_MERCH_MANIFEST',
    name: 'items:contraband.c_merch_manifest.name',
    type: 'consumable',
    effectType: 'tour_success',
    value: 0.1,
    duration: 1,
    description: 'items:contraband.c_merch_manifest.description',
    rarity: 'uncommon',
    icon: 'icon_manifest',
    stackable: true,
    maxStacks: 2
  },
  {
    id: 'c_motivational_gramophone',
    imagePrompt: 'ITEM_MOTIVATIONAL_GRAMOPHONE',
    name: 'items:contraband.c_motivational_gramophone.name',
    type: 'relic',
    effectType: 'practice_gain',
    value: 10,
    duration: 3,
    description: 'items:contraband.c_motivational_gramophone.description',
    rarity: 'rare',
    icon: 'icon_gramophone',
    stackable: false
  },
  {
    id: 'c_warped_tape',
    imagePrompt: 'ITEM_WARPED_TAPE',
    name: 'items:contraband.c_warped_tape.name',
    type: 'consumable',
    effectType: 'luck',
    value: 10,
    description: 'items:contraband.c_warped_tape.description',
    rarity: 'uncommon',
    icon: 'icon_tape',
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'c_gutter_amulet',
    imagePrompt: 'ITEM_GUTTER_AMULET',
    name: 'items:contraband.c_gutter_amulet.name',
    type: 'equipment',
    effectType: 'affinity',
    value: 5,
    description: 'items:contraband.c_gutter_amulet.description',
    rarity: 'uncommon',
    icon: 'icon_amulet',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_lucky_coin',
    imagePrompt: 'ITEM_LUCKY_COIN',
    name: 'items:contraband.c_lucky_coin.name',
    type: 'consumable',
    effectType: 'luck',
    value: 20,
    description: 'items:contraband.c_lucky_coin.description',
    rarity: 'rare',
    icon: 'icon_coin',
    stackable: true,
    maxStacks: 2
  },
  {
    id: 'c_radiant_pick',
    imagePrompt: 'ITEM_RADIANT_PICK',
    name: 'items:contraband.c_radiant_pick.name',
    type: 'equipment',
    effectType: 'guitar_difficulty',
    value: -0.15,
    description: 'items:contraband.c_radiant_pick.description',
    rarity: 'uncommon',
    icon: 'icon_radiant_pick',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_forgotten_road_map',
    imagePrompt: 'ITEM_FORGOTTEN_ROAD_MAP',
    name: 'items:contraband.c_forgotten_road_map.name',
    type: 'consumable',
    effectType: 'tour_success',
    value: 0.3,
    duration: 1,
    description: 'items:contraband.c_forgotten_road_map.description',
    rarity: 'epic',
    icon: 'icon_map',
    stackable: false
  },
  {
    id: 'c_sticky_logo_sticker',
    imagePrompt: 'ITEM_STICKY_LOGO_STICKER',
    name: 'items:contraband.c_sticky_logo_sticker.name',
    type: 'consumable',
    effectType: 'crowd_control',
    value: 0.05,
    duration: 1,
    description: 'items:contraband.c_sticky_logo_sticker.description',
    rarity: 'common',
    icon: 'icon_sticker',
    stackable: true,
    maxStacks: 6
  },
  {
    id: 'c_neon_patch',
    imagePrompt: 'ITEM_NEON_PATCH',
    name: 'items:contraband.c_neon_patch.name',
    type: 'equipment',
    effectType: 'style',
    value: 3,
    description: 'items:contraband.c_neon_patch.description',
    rarity: 'common',
    icon: 'icon_patch',
    applyOnAdd: true,
    stackable: true,
    maxStacks: 4
  },
  {
    id: 'c_abyssal_microphone',
    imagePrompt: 'ITEM_ABYSSAL_MICROPHONE',
    name: 'items:contraband.c_abyssal_microphone.name',
    type: 'relic',
    effectType: 'gig_modifier',
    value: 0.2,
    duration: 2,
    description: 'items:contraband.c_abyssal_microphone.description',
    rarity: 'epic',
    icon: 'icon_mic',
    stackable: false
  },
  {
    id: 'c_silver_tongue',
    imagePrompt: 'ITEM_SILVER_TONGUE',
    name: 'items:contraband.c_silver_tongue.name',
    type: 'consumable',
    effectType: 'mood',
    value: 20,
    description: 'items:contraband.c_silver_tongue.description',
    rarity: 'uncommon',
    icon: 'icon_tongue',
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'c_broken_compass',
    imagePrompt: 'ITEM_BROKEN_COMPASS',
    name: 'items:contraband.c_broken_compass.name',
    type: 'equipment',
    effectType: 'tour_success',
    value: 0.05,
    description: 'items:contraband.c_broken_compass.description',
    rarity: 'rare',
    icon: 'icon_compass',
    applyOnAdd: true,
    stackable: false
  }
]

export const CONTRABAND_RARITY_WEIGHTS = {
  common: 70,
  uncommon: 25,
  rare: 4,
  epic: 1
}

/**
 * O(1) Lookup Map for Contraband Items
 * @type {Map<string, Object>}
 */
export const CONTRABAND_BY_ID = new Map(
  CONTRABAND_DB.map(item => [item.id, item])
)

export const CONTRABAND_BY_RARITY = {
  common: CONTRABAND_DB.filter(i => i.rarity === 'common'),
  uncommon: CONTRABAND_DB.filter(i => i.rarity === 'uncommon'),
  rare: CONTRABAND_DB.filter(i => i.rarity === 'rare'),
  epic: CONTRABAND_DB.filter(i => i.rarity === 'epic')
}

/**
 * Internal DB export for schema and integrity tests only.
 * DO NOT USE in application logic. Use CONTRABAND_BY_ID or CONTRABAND_BY_RARITY instead.
 * @internal
 */
export { CONTRABAND_DB as _CONTRABAND_DB_FOR_TESTING }
