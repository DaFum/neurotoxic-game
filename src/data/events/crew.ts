import type { GameState } from '../../types'
import { getExpeditionRelationshipPairKey } from '../../domain/expedition/relationships'

const activeWithCrew =
  (crewIds: readonly string[]) =>
  (state: GameState): boolean =>
    state.expedition.status === 'active' &&
    crewIds.every(id => state.expedition.loadout?.crewIds.includes(id))

export const EXPEDITION_CREW_EVENTS = [
  {
    id: 'expedition_crew_conflict_mika_tom',
    category: 'band',
    title: 'events:expedition_crew_conflict_mika_tom.title',
    description: 'events:expedition_crew_conflict_mika_tom.description',
    trigger: 'random',
    chance: 0.1,
    condition: activeWithCrew(['mika', 'tom']),
    options: [
      {
        id: 'separate',
        label: 'events:expedition_crew_conflict_mika_tom.separate.label',
        effect: { type: 'expedition', result: 'crew_conflict_separated' },
        outcomeText: 'events:expedition_crew_conflict_mika_tom.separate.outcome'
      }
    ]
  },
  {
    id: 'expedition_crew_band_tension',
    category: 'band',
    title: 'events:expedition_crew_band_tension.title',
    description: 'events:expedition_crew_band_tension.description',
    trigger: 'random',
    chance: 0.1,
    condition: activeWithCrew(['tom']),
    options: [
      {
        id: 'listen',
        label: 'events:expedition_crew_band_tension.listen.label',
        effect: { type: 'expedition', result: 'crew_band_tension_heard' },
        outcomeText: 'events:expedition_crew_band_tension.listen.outcome'
      }
    ]
  },
  {
    id: 'expedition_crew_breakthrough',
    category: 'band',
    title: 'events:expedition_crew_breakthrough.title',
    description: 'events:expedition_crew_breakthrough.description',
    trigger: 'random',
    chance: 0.08,
    condition: (state: GameState): boolean =>
      activeWithCrew(['noah', 'yara'])(state) &&
      (state.career.expeditionRelationshipByPair[
        getExpeditionRelationshipPairKey(
          { kind: 'crew', id: 'noah' },
          { kind: 'crew', id: 'yara' }
        )
      ] ?? 0) >= 0,
    options: [
      {
        id: 'follow_lead',
        label: 'events:expedition_crew_breakthrough.follow_lead.label',
        effect: { type: 'expedition', result: 'crew_breakthrough_followed' },
        outcomeText: 'events:expedition_crew_breakthrough.follow_lead.outcome'
      }
    ]
  },
  {
    id: 'expedition_crew_injury_scare',
    category: 'band',
    title: 'events:expedition_crew_injury_scare.title',
    description: 'events:expedition_crew_injury_scare.description',
    trigger: 'random',
    chance: 0.06,
    condition: activeWithCrew(['ines']),
    options: [
      {
        id: 'push_on',
        label: 'events:expedition_crew_injury_scare.push_on.label',
        effect: { type: 'expedition', result: 'crew_injury_scare_pushed' },
        outcomeText: 'events:expedition_crew_injury_scare.push_on.outcome'
      }
    ]
  }
]
