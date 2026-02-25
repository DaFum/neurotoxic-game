export const RELATIONSHIP_EVENTS = [
  {
    id: 'toxic_infighting',
    category: 'band',
    tags: ['conflict', 'relationship_low'],
    title: '{MEMBER1} AND {MEMBER2} AT EACH OTHER\'S THROATS',
    description: 'The tension between {member1} and {member2} finally boils over. They are screaming at each other in the {venue}.',
    trigger: 'random',
    chance: 0.1,
    condition: (state) => {
      // Find two members with relationship < 20
      if (!state.band?.members) return false
      for (const m1 of state.band.members) {
        if (!m1.relationships) continue
        for (const [m2Name, score] of Object.entries(m1.relationships)) {
          if (score < 20) return { member1: m1.name, member2: m2Name }
        }
      }
      return false
    },
    options: [
      {
        label: 'Intervene [Charisma]',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'stat', stat: 'harmony', value: 10, description: 'You talked them down.' },
          failure: { type: 'composite', effects: [
            { type: 'stat', stat: 'harmony', value: -15 },
            { type: 'stat', stat: 'mood', value: -10 }
          ], description: 'You just made it worse.'}
        },
        outcomeText: 'You stepped in.'
      },
      {
        label: 'Let them fight it out',
        effect: { type: 'stat', stat: 'harmony', value: -20 },
        outcomeText: 'Sometimes toxicity has to run its course.'
      }
    ]
  },
  {
    id: 'synergy_moment',
    category: 'band',
    tags: ['relationship_high'],
    title: 'PERFECT SYNERGY',
    description: '{member1} and {member2} are totally in sync. The positive energy at the {venue} is infectious.',
    trigger: 'random',
    chance: 0.1,
    condition: (state) => {
      // Find two members with relationship > 80
      if (!state.band?.members) return false
      for (const m1 of state.band.members) {
        if (!m1.relationships) continue
        for (const [m2Name, score] of Object.entries(m1.relationships)) {
          if (score > 80) return { member1: m1.name, member2: m2Name }
        }
      }
      return false
    },
    options: [
      {
        label: 'Ride the wave [+10 Harmony, +10 Mood]',
        effect: { type: 'composite', effects: [
          { type: 'stat', stat: 'harmony', value: 10 },
          { type: 'stat', stat: 'mood', value: 10 }
        ]},
        outcomeText: 'What a moment.'
      }
    ]
  }
]
