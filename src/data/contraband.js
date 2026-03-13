/**
 * Contraband & Relics Data Catalog
 * Artifacts gathered from the void during tour.
 * They either grant immediate consumable effects or passive buffs.
 * @module contraband
 */

export const CONTRABAND_DB = [
  // ursprüngliche Items (bewahrt)
  {
    id: 'c_void_energy',
    name: 'Void Energy Drink',
    type: 'consumable',
    effectType: 'stamina',
    value: 50,
    description: 'A black liquid that tastes like battery acid. Instantly restores 50 Stamina to a band member.',
    rarity: 'common',
    icon: 'icon_void_energy',
    stackable: true,
    maxStacks: 5
  },
  {
    id: 'c_rusty_strings',
    name: 'Rusty Strings',
    type: 'equipment',
    effectType: 'luck',
    value: 5,
    description: 'They cut your fingers, but the blood summons better gig modifiers (+5 Luck).',
    rarity: 'uncommon',
    icon: 'icon_rusty_strings',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_cursed_pick',
    name: 'Cursed Pick of Destiny',
    type: 'consumable',
    effectType: 'guitar_difficulty',
    value: -0.2,
    description: 'A glowing pick that whispers. Lowers Guitar Difficulty by 0.2 for one gig.',
    rarity: 'rare',
    duration: 1,
    icon: 'icon_cursed_pick',
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'c_mystery_pills',
    name: 'Mystery Gas Station Pills',
    type: 'consumable',
    effectType: 'mood',
    value: 30,
    description: 'Questionable origin. Boosts a members Mood by 30.',
    rarity: 'common',
    icon: 'icon_pills',
    stackable: true,
    maxStacks: 10
  },
  {
    id: 'c_blood_pact',
    name: 'Blood Pact Contract',
    type: 'consumable',
    effectType: 'harmony',
    value: 15,
    description: 'Binds the band together in dark synergy. +15 Harmony.',
    rarity: 'rare',
    icon: 'icon_blood_pact',
    stackable: false
  },

  // viele neue Items
  {
    id: 'c_phase_metronome',
    name: 'Phase Metronome',
    type: 'consumable',
    effectType: 'tempo',
    value: 0.15,
    duration: 1,
    description: 'Shifts the bands internal tempo. Next gig tempo-related difficulties reduced by 15%.',
    rarity: 'uncommon',
    icon: 'icon_metronome',
    stackable: true,
    maxStacks: 2
  },
  {
    id: 'c_shattered_ear',
    name: 'Shattered Ear Talisman',
    type: 'equipment',
    effectType: 'crit',
    value: 0.05,
    description: 'A shard that sharpens perception. +5% critical performance rolls while equipped.',
    rarity: 'rare',
    icon: 'icon_talisman',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_amped_synth',
    name: 'Amped Synth Module',
    type: 'equipment',
    effectType: 'stamina_max',
    value: 10,
    description: 'An arcane module that increases member stamina cap by +10 while active.',
    rarity: 'uncommon',
    icon: 'icon_synth',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_gig_program',
    name: 'Gig Program',
    type: 'consumable',
    effectType: 'tour_success',
    value: 0.2,
    duration: 1,
    description: 'Optimizes routing & PR for the next tour leg (+20% chance of positive tour outcome).',
    rarity: 'rare',
    icon: 'icon_program',
    stackable: true,
    maxStacks: 1
  },
  {
    id: 'c_sticky_plectrum',
    name: 'Sticky Plectrum',
    type: 'consumable',
    effectType: 'guitar_difficulty',
    value: -0.1,
    duration: 1,
    description: 'Improves pick control, slightly easing guitar difficulty for one gig.',
    rarity: 'common',
    icon: 'icon_plectrum',
    stackable: true,
    maxStacks: 8
  },
  {
    id: 'c_night_vision_glasses',
    name: 'Night Vision Glasses',
    type: 'equipment',
    effectType: 'crowd_control',
    value: 0.08,
    description: 'See the crowds mood more clearly; slight passive boost to crowd control/effects.',
    rarity: 'uncommon',
    icon: 'icon_glasses',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_sonic_resonator',
    name: 'Sonic Resonator',
    type: 'relic',
    effectType: 'gig_modifier',
    value: 0.12,
    duration: 2,
    description: 'A relic that improves overall gig outcomes for a limited time.',
    rarity: 'rare',
    icon: 'icon_resonator',
    stackable: false
  },
  {
    id: 'c_weekender_coffee',
    name: 'Weekender Coffee',
    type: 'consumable',
    effectType: 'stamina',
    value: 25,
    description: 'Quick caffeine hit. Restores 25 Stamina to a member.',
    rarity: 'common',
    icon: 'icon_coffee',
    stackable: true,
    maxStacks: 5
  },
  {
    id: 'c_blackout_mask',
    name: 'Blackout Mask',
    type: 'consumable',
    effectType: 'mood',
    value: 50,
    description: 'Temporary confidence from anonymity. Restores 50 Mood, but side-effects possible.',
    rarity: 'rare',
    icon: 'icon_mask',
    stackable: false
  },
  {
    id: 'c_phantom_strings',
    name: 'Phantom Strings',
    type: 'equipment',
    effectType: 'guitar_difficulty',
    value: -0.35,
    description: 'Ethereal strings; significantly lower guitar difficulty while equipped.',
    rarity: 'epic',
    icon: 'icon_phantom_strings',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_merch_manifest',
    name: 'Merch Manifest',
    type: 'consumable',
    effectType: 'tour_success',
    value: 0.1,
    duration: 1,
    description: 'A shady manifest that improves merch sales and tour income briefly.',
    rarity: 'uncommon',
    icon: 'icon_manifest',
    stackable: true,
    maxStacks: 2
  },
  {
    id: 'c_motivational_gramophone',
    name: 'Motivational Gramophone',
    type: 'relic',
    effectType: 'practice_gain',
    value: 10,
    duration: 3,
    description: 'Plays a tune that accelerates practice gains for several days.',
    rarity: 'rare',
    icon: 'icon_gramophone',
    stackable: false
  },
  {
    id: 'c_warped_tape',
    name: 'Warped Tape',
    type: 'consumable',
    effectType: 'luck',
    value: 10,
    description: 'A looped tape that bends probabilities. +10 Luck when used once.',
    rarity: 'uncommon',
    icon: 'icon_tape',
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'c_gutter_amulet',
    name: 'Gutter Amulet',
    type: 'equipment',
    effectType: 'affinity',
    value: 5,
    description: 'Weird charm increasing social affinity with niche crowds.',
    rarity: 'uncommon',
    icon: 'icon_amulet',
    applyOnAdd: true,
    stackable: false
  },
  {
    id: 'c_lucky_coin',
    name: 'Lucky Coin',
    type: 'consumable',
    effectType: 'luck',
    value: 20,
    description: 'Flip this coin before a gig — big luck boost for one event.',
    rarity: 'rare',
    icon: 'icon_coin',
    stackable: true,
    maxStacks: 2
  },
  {
    id: 'c_radiant_pick',
    name: 'Radiant Pick',
    type: 'equipment',
    effectType: 'guitar_difficulty',
    value: -0.15,
    description: 'A radiant pick that eases playing and grants steady performance.',
    rarity: 'uncommon',
    icon: 'icon_radiant_pick',
    applyOnAdd: true
  },
  {
    id: 'c_forgotten_road_map',
    name: 'Forgotten Road Map',
    type: 'consumable',
    effectType: 'tour_success',
    value: 0.3,
    duration: 1,
    description: 'Maps to hidden routes. Greatly increases chance of smooth tour logistics once.',
    rarity: 'epic',
    icon: 'icon_map',
    stackable: false
  },
  {
    id: 'c_sticky_logo_sticker',
    name: 'Sticky Logo Sticker',
    type: 'consumable',
    effectType: 'crowd_control',
    value: 0.05,
    description: 'Stick on an amp or stage fixture — slight crowd control buff for next gig.',
    rarity: 'common',
    icon: 'icon_sticker',
    stackable: true,
    maxStacks: 6
  },
  {
    id: 'c_neon_patch',
    name: 'Neon Patch',
    type: 'equipment',
    effectType: 'style',
    value: 3,
    description: 'A patch that pumps up band style rating. Aesthetic but effective.',
    rarity: 'common',
    icon: 'icon_patch',
    applyOnAdd: true,
    stackable: true,
    maxStacks: 4
  },
  {
    id: 'c_abyssal_microphone',
    name: 'Abyssal Microphone',
    type: 'relic',
    effectType: 'gig_modifier',
    value: 0.2,
    duration: 2,
    description: 'A powerful relic mic that heavily improves gig outcomes for a short time.',
    rarity: 'epic',
    icon: 'icon_mic',
    stackable: false
  },
  {
    id: 'c_silver_tongue',
    name: 'Silver Tongue',
    type: 'consumable',
    effectType: 'mood',
    value: 20,
    description: 'Boosts charisma for interviews; +20 Mood for member when used.',
    rarity: 'uncommon',
    icon: 'icon_tongue',
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'c_broken_compass',
    name: 'Broken Compass',
    type: 'equipment',
    effectType: 'tour_success',
    value: 0.05,
    description: 'Strangely points to profitable choices; small persistent tour benefit.',
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
