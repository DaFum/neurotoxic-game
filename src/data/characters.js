// Detailed Character Definitions and Traits
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
        effect: 'score_bonus_high_acc'
      },
      {
        id: 'gear_nerd',
        name: 'Gear Nerd',
        desc: '-20% Equipment Costs',
        effect: 'discount_equip'
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
        effect: 'hangover_risk'
      },
      {
        id: 'blast_machine',
        name: 'Blast Beat Machine',
        desc: '+25% Score on fast sections',
        effect: 'score_bonus_fast'
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
        effect: 'conflict_solver'
      },
      {
        id: 'social_manager',
        name: 'Social Nerd',
        desc: '+15% Viral Chance',
        effect: 'viral_bonus'
      }
    ],
    equipment: { bass: 'Ibanez SR505', amp: 'Ampeg SVT-3 Pro' }
  }
}
