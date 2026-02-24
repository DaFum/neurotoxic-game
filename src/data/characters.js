// Detailed Character Definitions and Traits
//
// Trait Implementation Status:
// - blast_machine (Lars): Implemented
// - perfektionist (Matze): Implemented
// - gear_nerd (Matze): Implemented (Repair discount + Shop discount)
// - party_animal (Lars): Partially Implemented (Fridge interaction)
// - bandleader (Marius): Implemented
// - social_manager (Marius): Implemented
// - virtuoso (Matze): Implemented
// - road_warrior (Marius): Implemented
export const CHARACTERS = {
  MATZE: {
    name: 'Matze',
    role: 'Guitar',
    baseStats: { skill: 8, stamina: 7, charisma: 5, technical: 9, improv: 6 },
    traits: [
      {
        id: 'perfektionist',
        name: 'Perfektionist',
        desc: '+15% Score if >85% Hit Rate',
        effect: 'score_bonus_high_acc',
        unlockHint: 'Hit 100% Accuracy in a single gig.'
      },
      {
        id: 'gear_nerd',
        name: 'Gear Nerd',
        desc: '-20% Equipment Costs',
        effect: 'discount_equip',
        unlockHint: 'Purchase 5 different gear items.'
      },
      {
        id: 'virtuoso',
        name: 'Virtuoso',
        desc: '+10% Hit Window',
        effect: 'hit_window_bonus',
        unlockHint: 'Complete a solo without missing a note.'
      }
    ],
    equipment: {
      guitar: 'Gibson Les Paul Custom',
      amp: 'Mesa Boogie Dual Rectifier'
    }
  },
  LARS: {
    name: 'Lars',
    role: 'Drums',
    baseStats: { skill: 9, stamina: 8, charisma: 7, technical: 7, improv: 9 },
    traits: [
      {
        id: 'party_animal',
        name: 'Party Animal',
        desc: 'Random hangover (-Stamina) but +Mood when drinking',
        effect: 'hangover_risk',
        unlockHint: 'Buy the beer fridge and drain it.'
      },
      {
        id: 'blast_machine',
        name: 'Blast Beat Machine',
        desc: '+25% Score on fast sections',
        effect: 'score_bonus_fast',
        unlockHint: 'Maintain a 50+ combo during a fast section (>160 BPM).'
      }
    ],
    equipment: { set: 'Pearl Export', cymbals: 'Zildjian/Sabian Mix' }
  },
  MARIUS: {
    name: 'Marius',
    role: 'Bass/Vocals',
    baseStats: {
      skill: 7,
      stamina: 6,
      charisma: 8,
      technical: 7,
      composition: 7
    },
    traits: [
      {
        id: 'bandleader',
        name: 'Bandleader',
        desc: '+50% chance to solve conflicts',
        effect: 'conflict_solver',
        unlockHint: 'Successfully resolve 3 band conflicts.'
      },
      {
        id: 'social_manager',
        name: 'Social Nerd',
        desc: '+15% Viral Chance',
        effect: 'viral_bonus',
        unlockHint: 'Reach 1000 followers on any platform.'
      },
      {
        id: 'road_warrior',
        name: 'Road Warrior',
        desc: '-15% Fuel Consumption',
        effect: 'fuel_discount',
        unlockHint: 'Travel 5000km in total.'
      }
    ],
    equipment: { bass: 'Ibanez SR505', amp: 'Ampeg SVT-3 Pro' }
  }
}
