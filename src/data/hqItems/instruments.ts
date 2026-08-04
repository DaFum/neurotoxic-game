import type { PurchaseItem } from '../../types/components'

/**
 * Defines the catalog of purchasable instruments available in the game's HQ store.
 *
 * @remarks
 * Each instrument provides passive statistical modifiers that influence gameplay mechanics,
 * such as performance difficulty, crowd decay rates, or drum combo multipliers. These items
 * range from high-end gear to broken or meme-tier equipment, impacting the band's overall
 * capabilities during gigs.
 */
export const instruments = [
  // Guitars & Strings
  {
    id: 'hq_inst_guitar_custom',
    name: 'items:hq_inst_guitar_custom.name',
    category: 'INSTRUMENT',
    cost: 7500, // High-end instrument
    currency: 'money',
    img: 'ITEM_GUITAR_CUSTOM',
    description: 'items:hq_inst_guitar_custom.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'guitarDifficulty',
      value: -0.15
    }
  },
  {
    id: 'hq_inst_guitar_flying_v',
    name: 'items:hq_inst_guitar_flying_v.name',
    category: 'INSTRUMENT',
    cost: 590, // Mid-range vintage
    currency: 'money',
    img: 'ITEM_GUITAR_V',
    description: 'items:hq_inst_guitar_flying_v.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'crowdDecay',
      value: -0.05
    }
  },
  {
    id: 'hq_inst_bass_sansamp',
    name: 'items:hq_inst_bass_sansamp.name',
    category: 'INSTRUMENT',
    cost: 860, // Pro gear
    currency: 'money',
    img: 'ITEM_BASS_PREAMP',
    description: 'items:hq_inst_bass_sansamp.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'crowdDecay',
      value: -0.1
    }
  },
  // Drums
  {
    id: 'hq_inst_drum_trigger',
    name: 'items:hq_inst_drum_trigger.name',
    category: 'INSTRUMENT',
    cost: 1000, // Pro drum gear
    currency: 'money',
    img: 'ITEM_DRUM_TRIGGER',
    description: 'items:hq_inst_drum_trigger.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'drumMultiplier',
      value: 0.2
    }
  },
  {
    id: 'hq_inst_cowbell_inferno',
    name: 'items:hq_inst_cowbell_inferno.name',
    category: 'INSTRUMENT',
    cost: 250, // Meme instrument
    currency: 'money',
    img: 'ITEM_COWBELL',
    description: 'items:hq_inst_cowbell_inferno.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'drumMultiplier',
      value: 0.05
    }
  },
  // Cheap/Broken Instruments
  {
    id: 'hq_inst_second_guitar',
    name: 'items:hq_inst_second_guitar.name',
    category: 'INSTRUMENT',
    cost: 250, // Backup gear
    currency: 'money',
    img: 'ITEM_GUITAR_CHEAP',
    description: 'items:hq_inst_second_guitar.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'guitarDifficulty',
      value: 0.05
    } // Makes it slightly harder
  },
  {
    id: 'hq_inst_broken_drum_kit',
    name: 'items:hq_inst_broken_drum_kit.name',
    category: 'INSTRUMENT',
    cost: 480, // Beater kit
    currency: 'money',
    img: 'ITEM_DRUM_BROKEN',
    description: 'items:hq_inst_broken_drum_kit.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'drumMultiplier',
      value: -0.1
    }
  },
  {
    id: 'hq_inst_bass_effect_pedal_cheap',
    name: 'items:hq_inst_bass_effect_pedal_cheap.name',
    category: 'INSTRUMENT',
    cost: 80, // Cheap FX
    currency: 'money',
    img: 'ITEM_PEDAL_CHEAP',
    description: 'items:hq_inst_bass_effect_pedal_cheap.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'crowdDecay',
      value: 0.05
    }
  },
  // Weird Instruments
  {
    id: 'hq_inst_theremin_doom',
    name: 'items:hq_inst_theremin_doom.name',
    category: 'INSTRUMENT',
    cost: 1500, // Boutique obscure instrument
    currency: 'money',
    img: 'ITEM_THEREMIN',
    description: 'items:hq_inst_theremin_doom.description',
    effect: {
      type: 'stat_modifier',
      target: 'performance',
      stat: 'crowdDecay',
      value: -0.15
    }
  },
  {
    id: 'hq_inst_didgeridoo',
    name: 'items:hq_inst_didgeridoo.name',
    category: 'INSTRUMENT',
    cost: 450, // Niche instrument
    currency: 'money',
    img: 'ITEM_DIDGERIDOO',
    description: 'items:hq_inst_didgeridoo.description',
    effect: { type: 'stat_modifier', target: 'band', stat: 'luck', value: 2 }
  }
] as const satisfies readonly PurchaseItem[]
