import { logger } from '../../utils/logger'
import { logger } from '../../utils/logger'
// TODO: Review this file
import type { GameState, BandMember } from '../../types/game'

type RelPair = { member1: string; member2: string; score: number }

const getFlatRelationships = (members: BandMember[]): RelPair[] => {
  const flat: RelPair[] = []
  const len = members.length
  for (let i = 0; i < len; i++) {
    const m1 = members[i]
    if (!m1 || !m1.relationships || typeof m1.name !== 'string') continue
    for (const [m2Name, score] of Object.entries(m1.relationships)) {
      if (m2Name === m1.name) {
        logger.warn('EventEngine', `Band member ${m1.name} contains a self-relationship. This corrupts gameplay systems.`);
        continue
      }
      flat.push({
        member1: m1.name,
        member2: m2Name,
        score: score ?? 0
      })
    }
  }
  return flat
}

export const RELATIONSHIP_EVENTS = [
  {
    id: 'toxic_infighting',
    category: 'band',
    tags: ['conflict', 'relationship_low'],
    title: 'events:toxic_infighting.title',
    description: 'events:toxic_infighting.desc',
    trigger: 'random',
    chance: 0.1,
    condition: (state: GameState) => {
      // Find two members with relationship < 20
      const members = state.band?.members
      if (!members) return false

      const rels = getFlatRelationships(members)
      const len = rels.length
      for (let i = 0; i < len; i++) {
        const rel = rels[i]
        if (rel && rel.score < 20)
          return { member1: rel.member1, member2: rel.member2 }
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
    condition: (state: GameState) => {
      // Find two members with relationship > 80
      const members = state.band?.members
      if (!members) return false

      const rels = getFlatRelationships(members)
      const len = rels.length
      for (let i = 0; i < len; i++) {
        const rel = rels[i]
        if (rel && rel.score > 80)
          return { member1: rel.member1, member2: rel.member2 }
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
