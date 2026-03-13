/**
 * Contraband & Relics Data Catalog
 * Artifacts gathered from the void during tour.
 * They either grant immediate consumable effects or passive buffs.
 * @module contraband
 */

export const CONTRABAND_DB = [
  {
    id: 'c_void_energy',
    name: 'items:contraband.c_void_energy.name',
    type: 'consumable',
    effectType: 'stamina',
    value: 50,
    description: 'items:contraband.c_void_energy.description',
    rarity: 'common'
  },
  {
    id: 'c_rusty_strings',
    name: 'items:contraband.c_rusty_strings.name',
    type: 'equipment',
    effectType: 'luck',
    value: 5,
    description: 'items:contraband.c_rusty_strings.description',
    rarity: 'uncommon'
  },
  {
    id: 'c_cursed_pick',
    name: 'items:contraband.c_cursed_pick.name',
    type: 'consumable',
    effectType: 'guitar_difficulty',
    value: -0.2, // Lowers difficulty
    description: 'items:contraband.c_cursed_pick.description',
    rarity: 'rare'
  },
  {
    id: 'c_mystery_pills',
    name: 'items:contraband.c_mystery_pills.name',
    type: 'consumable',
    effectType: 'mood',
    value: 30,
    description: 'items:contraband.c_mystery_pills.description',
    rarity: 'common'
  },
  {
    id: 'c_blood_pact',
    name: 'items:contraband.c_blood_pact.name',
    type: 'consumable',
    effectType: 'harmony',
    value: 15,
    description: 'items:contraband.c_blood_pact.description',
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
