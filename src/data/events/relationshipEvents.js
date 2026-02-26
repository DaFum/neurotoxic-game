export const RELATIONSHIP_EVENTS = [
  {
    id: 'toxic_infighting',
    category: 'band',
    tags: ['conflict', 'relationship_low'],
    title: "events:toxic_infighting.title",
    description: 'events:toxic_infighting.desc',
    trigger: 'random',
    chance: 0.1,
    condition: state => {
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
        label: 'events:toxic_infighting.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: {
            type: 'stat',
            stat: 'harmony',
            value: 10,
            description: 'events:toxic_infighting.opt1.d_b5f9'
          },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'harmony', value: -15 },
              { type: 'stat', stat: 'mood', value: -10 }
            ],
            description: 'events:toxic_infighting.opt1.d_50d4'
          }
        },
        outcomeText: 'events:toxic_infighting.opt1.outcome'
      },
      {
        label: 'events:toxic_infighting.opt2.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: -20 },
            {
              type: 'relationship',
              member1: '{member1}',
              member2: '{member2}',
              value: -15
            }
          ]
        },
        outcomeText: 'events:toxic_infighting.opt2.outcome'
      }
    ]
  },
  {
    id: 'synergy_moment',
    category: 'band',
    tags: ['relationship_high'],
    title: 'events:synergy_moment.title',
    description: 'events:synergy_moment.desc',
    trigger: 'random',
    chance: 0.1,
    condition: state => {
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
        label: 'events:synergy_moment.opt1.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'stat', stat: 'harmony', value: 10 },
            { type: 'stat', stat: 'mood', value: 10 },
            {
              type: 'relationship',
              member1: '{member1}',
              member2: '{member2}',
              value: 10
            }
          ]
        },
        outcomeText: 'events:synergy_moment.opt1.outcome'
      }
    ]
  }
]
