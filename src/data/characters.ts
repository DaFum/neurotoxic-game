export const CHARACTERS = {
  MATZE: {
    id: 'matze',
    name: 'Matze',
    role: 'Guitar',
    baseStats: { skill: 8, stamina: 7, charisma: 5, technical: 9, improv: 6 },
    relationships: { Marius: 50, Lars: 50 },
    traits: [
      {
        id: 'perfektionist',
        name: 'traits:perfektionist.name',
        desc: 'traits:perfektionist.desc',
        effect: 'score_bonus_high_acc',
        unlockHint: 'traits:perfektionist.unlockHint'
      },
      {
        id: 'gear_nerd',
        name: 'traits:gearNerd.name',
        desc: 'traits:gearNerd.desc',
        effect: 'discount_equip',
        unlockHint: 'traits:gearNerd.unlockHint'
      },
      {
        id: 'virtuoso',
        name: 'traits:virtuoso.name',
        desc: 'traits:virtuoso.desc',
        effect: 'hit_window_bonus',
        unlockHint: 'traits:virtuoso.unlockHint'
      },
      {
        id: 'tech_wizard',
        name: 'traits:techWizard.name',
        desc: 'traits:techWizard.desc',
        effect: 'score_bonus_tech',
        unlockHint: 'traits:techWizard.unlockHint'
      },
      {
        id: 'grudge_holder',
        name: 'traits:grudgeHolder.name',
        desc: 'traits:grudgeHolder.desc',
        effect: 'rel_neg_amp',
        unlockHint: 'traits:grudgeHolder.unlockHint'
      }
    ],
    equipment: {
      guitar: 'Gibson Les Paul Custom',
      amp: 'Mesa Boogie Dual Rectifier'
    }
  },
  MARIUS: {
    id: 'marius',
    name: 'Marius',
    role: 'Drums',
    baseStats: { skill: 9, stamina: 8, charisma: 7, technical: 7, improv: 9 },
    relationships: { Matze: 50, Lars: 50 },
    traits: [
      {
        id: 'party_animal',
        name: 'traits:partyAnimal.name',
        desc: 'traits:partyAnimal.desc',
        effect: 'hangover_risk',
        unlockHint: 'traits:partyAnimal.unlockHint'
      },
      {
        id: 'blast_machine',
        name: 'traits:blastMachine.name',
        desc: 'traits:blastMachine.desc',
        effect: 'score_bonus_fast',
        unlockHint: 'traits:blastMachine.unlockHint'
      },
      {
        id: 'showman',
        name: 'traits:showman.name',
        desc: 'traits:showman.desc',
        effect: 'viral_bonus_show',
        unlockHint: 'traits:showman.unlockHint'
      },
      {
        id: 'clumsy',
        name: 'traits:clumsy.name',
        desc: 'traits:clumsy.desc',
        effect: 'stunt_fail_risk',
        unlockHint: 'traits:clumsy.unlockHint'
      }
    ],
    equipment: { set: 'Pearl Export', cymbals: 'Zildjian/Sabian Mix' }
  },
  LARS: {
    id: 'lars',
    name: 'Lars',
    role: 'Bass/Vocals',
    baseStats: {
      skill: 7,
      stamina: 6,
      charisma: 8,
      technical: 7,
      composition: 7
    },
    relationships: { Matze: 50, Marius: 50 },
    traits: [
      {
        id: 'bandleader',
        name: 'traits:bandleader.name',
        desc: 'traits:bandleader.desc',
        effect: 'conflict_solver',
        unlockHint: 'traits:bandleader.unlockHint'
      },
      {
        id: 'social_manager',
        name: 'traits:socialManager.name',
        desc: 'traits:socialManager.desc',
        effect: 'viral_bonus',
        unlockHint: 'traits:socialManager.unlockHint'
      },
      {
        id: 'road_warrior',
        name: 'traits:roadWarrior.name',
        desc: 'traits:roadWarrior.desc',
        effect: 'fuel_discount',
        unlockHint: 'traits:roadWarrior.unlockHint'
      },
      {
        id: 'melodic_genius',
        name: 'traits:melodicGenius.name',
        desc: 'traits:melodicGenius.desc',
        effect: 'combo_bonus_slow',
        unlockHint: 'traits:melodicGenius.unlockHint'
      },
      {
        id: 'peacemaker',
        name: 'traits:peacemaker.name',
        desc: 'traits:peacemaker.desc',
        effect: 'rel_pos_amp',
        unlockHint: 'traits:peacemaker.unlockHint'
      }
    ],
    equipment: { bass: 'Ibanez SR505', amp: 'Ampeg SVT-3 Pro' }
  },
  CLINIC: {
    id: 'clinic',
    name: 'Clinic',
    role: 'NPC',
    baseStats: { skill: 0, stamina: 0, charisma: 0, technical: 0, improv: 0 },
    relationships: {},
    traits: [
      {
        id: 'cyber_lungs',
        name: 'traits:cyberLungs.name',
        desc: 'traits:cyberLungs.desc',
        effect: 'stamina_regen_bonus',
        unlockHint: 'traits:cyberLungs.unlockHint'
      }
    ],
    equipment: {}
  }
}
