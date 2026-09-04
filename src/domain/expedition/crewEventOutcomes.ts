import type {
  ExpeditionCrewStressSourceType,
  ExpeditionEventResultId,
  ExpeditionRelationshipActorRef
} from '../../types/expedition'

export interface ExpeditionCrewEventOutcome {
  eventId: string
  optionId: string
  resultId: ExpeditionEventResultId
  stress?: { crewId: string; sourceType: ExpeditionCrewStressSourceType }
  relationship?: {
    first: ExpeditionRelationshipActorRef
    second: ExpeditionRelationshipActorRef
    tierDelta: -1 | 1
  }
  crewInjuryId?: string
  bandInjuryId?: string
  contactIntel?: boolean
}

const EXPEDITION_CREW_EVENT_OUTCOMES: readonly ExpeditionCrewEventOutcome[] = [
  {
    eventId: 'expedition_crew_conflict_mika_tom',
    optionId: 'separate',
    resultId: 'crew_conflict_separated',
    stress: { crewId: 'mika', sourceType: 'crew_event' },
    relationship: {
      first: { kind: 'crew', id: 'mika' },
      second: { kind: 'crew', id: 'tom' },
      tierDelta: -1
    }
  },
  {
    eventId: 'expedition_crew_band_tension',
    optionId: 'listen',
    resultId: 'crew_band_tension_heard',
    stress: { crewId: 'tom', sourceType: 'crew_event' },
    relationship: {
      first: { kind: 'band', id: 'matze' },
      second: { kind: 'crew', id: 'tom' },
      tierDelta: 1
    }
  },
  {
    eventId: 'expedition_crew_breakthrough',
    optionId: 'follow_lead',
    resultId: 'crew_breakthrough_followed',
    stress: { crewId: 'noah', sourceType: 'successful_gig' },
    relationship: {
      first: { kind: 'crew', id: 'noah' },
      second: { kind: 'crew', id: 'yara' },
      tierDelta: 1
    },
    contactIntel: true
  },
  {
    eventId: 'expedition_crew_injury_scare',
    optionId: 'push_on',
    resultId: 'crew_injury_scare_pushed',
    stress: { crewId: 'ines', sourceType: 'crew_event' },
    crewInjuryId: 'ines',
    bandInjuryId: 'matze'
  }
]

export const getCrewEventOutcome = (
  eventId: string,
  optionId: string
): ExpeditionCrewEventOutcome | null =>
  EXPEDITION_CREW_EVENT_OUTCOMES.find(
    outcome => outcome.eventId === eventId && outcome.optionId === optionId
  ) ?? null
export const getCrewEventOutcomeBySourceId = (
  sourceId: string
): ExpeditionCrewEventOutcome | null => {
  const separator = sourceId.lastIndexOf(':')
  return separator < 1
    ? null
    : getCrewEventOutcome(
        sourceId.slice(0, separator),
        sourceId.slice(separator + 1)
      )
}
