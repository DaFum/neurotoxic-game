import { logger } from '../../utils/logger'

import type { GameState, BandMember } from '../../types'

type RelPair = { member1: string; member2: string; score: number }

const warnedSelfRelationshipNames = new Set<string>()

const findRelationshipPairByScore = (
  state: GameState,
  predicate: (score: number) => boolean
): { member1: string; member2: string } | false => {
  const members = state.band?.members
  if (!members) return false
  const rels = getFlatRelationships(members)
  for (let i = 0; i < rels.length; i++) {
    const rel = rels[i]
    if (rel && predicate(rel.score))
      return { member1: rel.member1, member2: rel.member2 }
  }
  return false
}

const getFlatRelationships = (members: BandMember[]): RelPair[] => {
  const flat: RelPair[] = []
  const len = members.length
  for (let i = 0; i < len; i++) {
    const m1 = members[i]
    if (!m1 || !m1.relationships || typeof m1.name !== 'string') continue
    for (const [m2Name, score] of Object.entries(m1.relationships)) {
      if (m2Name === m1.name) {
        if (!warnedSelfRelationshipNames.has(m1.name)) {
          logger.warn(
            'EventEngine',
            `Band member ${m1.name} contains a self-relationship. This corrupts gameplay systems.`
          )
          warnedSelfRelationshipNames.add(m1.name)
        }
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
    condition: (state: GameState) =>
      findRelationshipPairByScore(state, score => score < 20),
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
    condition: (state: GameState) =>
      findRelationshipPairByScore(state, score => score > 80),
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
  },
  {
    id: 'patch_the_rift',
    category: 'band',
    tags: ['conflict', 'relationship_low'],
    title: 'events:patch_the_rift.title',
    description: 'events:patch_the_rift.desc',
    trigger: 'random',
    chance: 0.07,
    condition: (state: GameState) =>
      findRelationshipPairByScore(state, score => score < 30),
    options: [
      {
        label: 'events:patch_the_rift.opt1.label',
        skillCheck: {
          stat: 'composition',
          threshold: 6,
          success: { type: 'stat', stat: 'harmony', value: 12 },
          failure: { type: 'stat', stat: 'harmony', value: -5 }
        },
        outcomeText: 'events:patch_the_rift.opt1.outcome'
      },
      {
        label: 'events:patch_the_rift.opt2.label',
        effect: { type: 'stat', stat: 'mood', value: -3 },
        outcomeText: 'events:patch_the_rift.opt2.outcome'
      }
    ]
  },
  {
    id: 'backstage_mediation',
    category: 'band',
    tags: ['relationship_low'],
    title: 'events:backstage_mediation.title',
    description: 'events:backstage_mediation.desc',
    trigger: 'post_gig',
    chance: 0.15,
    condition: (state: GameState) =>
      findRelationshipPairByScore(state, score => score < 40),
    options: [
      {
        label: 'events:backstage_mediation.opt1.label',
        skillCheck: {
          stat: 'improv',
          threshold: 6,
          success: { type: 'stat', stat: 'harmony', value: 8 },
          failure: { type: 'stat', stat: 'mood', value: -5 }
        },
        outcomeText: 'events:backstage_mediation.opt1.outcome'
      },
      {
        label: 'events:backstage_mediation.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -3 },
        outcomeText: 'events:backstage_mediation.opt2.outcome'
      }
    ]
  },
  {
    id: 'old_beef_resurfaces',
    category: 'band',
    tags: ['conflict'],
    title: 'events:old_beef_resurfaces.title',
    description: 'events:old_beef_resurfaces.desc',
    trigger: 'random',
    chance: 0.05,
    condition: (state: GameState) =>
      findRelationshipPairByScore(state, score => score < 35),
    options: [
      {
        label: 'events:old_beef_resurfaces.opt1.label',
        skillCheck: {
          stat: 'charisma',
          threshold: 7,
          success: { type: 'stat', stat: 'harmony', value: 10 },
          failure: {
            type: 'composite',
            effects: [
              { type: 'stat', stat: 'harmony', value: -10 },
              { type: 'stat', stat: 'mood', value: -8 }
            ]
          }
        },
        outcomeText: 'events:old_beef_resurfaces.opt1.outcome'
      },
      {
        label: 'events:old_beef_resurfaces.opt2.label',
        effect: { type: 'stat', stat: 'harmony', value: -5 },
        outcomeText: 'events:old_beef_resurfaces.opt2.outcome'
      }
    ]
  }
]
