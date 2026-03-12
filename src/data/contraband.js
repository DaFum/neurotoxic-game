/**
 * Contraband & Relics Data Catalog
 * Artifacts gathered from the void during tour.
 * They either grant immediate consumable effects or passive buffs.
 * @module contraband
 */

export const CONTRABAND_DB = [
  {
    id: 'c_void_energy',
    name: 'Void Energy Drink',
    type: 'consumable',
    effectType: 'stamina',
    value: 50,
    description: 'A black liquid that tastes like battery acid. Instantly restores 50 Stamina to a band member.',
    rarity: 'common'
  },
  {
    id: 'c_rusty_strings',
    name: 'Rusty Strings',
    type: 'equipment',
    effectType: 'luck',
    value: 5,
    description: 'They cut your fingers, but the blood summons better gig modifiers (+5 Luck).',
    rarity: 'uncommon'
  },
  {
    id: 'c_cursed_pick',
    name: 'Cursed Pick of Destiny',
    type: 'consumable',
    effectType: 'guitar_difficulty',
    value: -0.2, // Lowers difficulty
    description: 'A glowing pick that whispers. Lowers Guitar Difficulty by 0.2 for one gig.',
    rarity: 'rare'
  },
  {
    id: 'c_mystery_pills',
    name: 'Mystery Gas Station Pills',
    type: 'consumable',
    effectType: 'mood',
    value: 30,
    description: 'Questionable origin. Boosts a member\'s Mood by 30.',
    rarity: 'common'
  },
  {
    id: 'c_blood_pact',
    name: 'Blood Pact Contract',
    type: 'consumable',
    effectType: 'harmony',
    value: 15,
    description: 'Binds the band together in dark synergy. +15 Harmony.',
    rarity: 'rare'
  }
]

/**
 * O(1) Lookup Map for Contraband Items
 * @type {Map<string, Object>}
 */
export const CONTRABAND_BY_ID = new Map(
  CONTRABAND_DB.map(item => [item.id, item])
)
