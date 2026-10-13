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
  },
  {
    eventId: 'expedition_crew_reconcile_mika_tom',
    optionId: 'mediate',
    resultId: 'crew_conflict_mediated',
    relationship: {
      first: { kind: 'crew', id: 'mika' },
      second: { kind: 'crew', id: 'tom' },
      tierDelta: 1
    }
  },
  {
    eventId: 'expedition_crew_band_tension',
    optionId: 'brush_off',
    resultId: 'crew_band_tension_dismissed',
    stress: { crewId: 'tom', sourceType: 'crew_event' },
    relationship: {
      first: { kind: 'band', id: 'matze' },
      second: { kind: 'crew', id: 'tom' },
      tierDelta: -1
    }
  },
  {
    eventId: 'expedition_crew_band_grudge',
    optionId: 'make_amends',
    resultId: 'crew_band_grudge_settled',
    relationship: {
      first: { kind: 'band', id: 'matze' },
      second: { kind: 'crew', id: 'tom' },
      tierDelta: 1
    }
  },
  {
    eventId: 'expedition_crew_route_dispute_noah_yara',
    optionId: 'back_yara',
    resultId: 'crew_route_dispute_settled',
    stress: { crewId: 'noah', sourceType: 'crew_event' },
    relationship: {
      first: { kind: 'crew', id: 'noah' },
      second: { kind: 'crew', id: 'yara' },
      tierDelta: -1
    }
  },
  {
    // Tom takes Matze's load, so the scare costs the Crew, not the Band.
    eventId: 'expedition_crew_injury_scare',
    optionId: 'tom_covers',
    resultId: 'crew_injury_scare_covered',
    stress: { crewId: 'tom', sourceType: 'crew_event' },
    crewInjuryId: 'ines'
  }
]

/**
 * Every actor pair a Crew event can move, in registry order and without
 * duplicates.
 *
 * @remarks
 * The crew-status display lists exactly these pairs, so a pair no event can
 * change never shows as a permanently neutral row.
 */
export const EXPEDITION_RELATIONSHIP_PAIRS: readonly (readonly [
  ExpeditionRelationshipActorRef,
  ExpeditionRelationshipActorRef
])[] = (() => {
  const seen = new Set<string>()
  const pairs: (readonly [
    ExpeditionRelationshipActorRef,
    ExpeditionRelationshipActorRef
  ])[] = []
  for (const outcome of EXPEDITION_CREW_EVENT_OUTCOMES) {
    if (!outcome.relationship) continue
    const { first, second } = outcome.relationship
    const key = `${first.kind}:${first.id}|${second.kind}:${second.id}`
    if (seen.has(key)) continue
    seen.add(key)
    pairs.push([first, second])
  }
  return pairs
})()

const getCrewEventOutcome = (
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
