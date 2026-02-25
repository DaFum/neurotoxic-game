// Detailed Character Definitions and Traits
//
// Trait Implementation Status:
// - blast_machine (Marius): Implemented
// - perfektionist (Matze): Implemented
// - gear_nerd (Matze): Implemented (Repair discount + Shop discount)
// - party_animal (Marius): Partially Implemented (Fridge interaction)
// - bandleader (Lars): Implemented
// - social_manager (Lars): Implemented
// - virtuoso (Matze): Implemented
// - road_warrior (Lars): Implemented
// - tech_wizard (Matze): Implemented
// - showman (Marius): Implemented
// - melodic_genius (Lars): Implemented
//
// TODO: Relationship Mechanics
// - Add `relationships` object to each character: { [otherMemberId]: score }
// - Add dynamic events that trigger based on low/high relationship scores
// - Traits like 'Grudge Holder' or 'Peacemaker' could affect these scores
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
      },
      {
        id: 'tech_wizard',
        name: 'Tech Wizard',
        desc: '+10% Score on Technical Songs',
        effect: 'score_bonus_tech',
        unlockHint: 'Get 100% Accuracy on a Technical song.'
      }
    ],
    equipment: {
      guitar: 'Gibson Les Paul Custom',
      amp: 'Mesa Boogie Dual Rectifier'
    }
  },
  Marius: {
    name: 'Marius',
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
      },
      {
        id: 'showman',
        name: 'Showman',
        desc: '+20% Virality Bonus',
        effect: 'viral_bonus_show',
        unlockHint: 'Perform 3 Stage Dives successfully.'
      }
    ],
    equipment: { set: 'Pearl Export', cymbals: 'Zildjian/Sabian Mix' }
  },
  Lars: {
    name: 'Lars',
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
      },
      {
        id: 'melodic_genius',
        name: 'Melodic Genius',
        desc: '+10% Max Combo on Slow Songs',
        effect: 'combo_bonus_slow',
        unlockHint: 'Maintain a 30+ combo in a slow song (<120 BPM).'
      }
    ],
    equipment: { bass: 'Ibanez SR505', amp: 'Ampeg SVT-3 Pro' }
  }
}
