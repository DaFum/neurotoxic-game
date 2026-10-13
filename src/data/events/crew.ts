import type { GameState } from '../../types'
import type { ExpeditionRelationshipActorRef } from '../../types/expedition'
import { getExpeditionRelationshipTier } from '../../domain/expedition/relationships'

/**
 * Generates a condition that checks if specific crew IDs are in the active expedition loadout.
 *
 * @param crewIds - The array of crew IDs to check.
 * @returns A function that accepts the game state and returns a boolean indicating if the condition is met.
 */
const activeWithCrew =
  (crewIds: readonly string[]) =>
  (state: GameState): boolean =>
    state.expedition.status === 'active' &&
    crewIds.every(id => state.expedition.loadout?.crewIds.includes(id))

const MIKA: ExpeditionRelationshipActorRef = { kind: 'crew', id: 'mika' }
const TOM: ExpeditionRelationshipActorRef = { kind: 'crew', id: 'tom' }
const NOAH: ExpeditionRelationshipActorRef = { kind: 'crew', id: 'noah' }
const YARA: ExpeditionRelationshipActorRef = { kind: 'crew', id: 'yara' }
const MATZE: ExpeditionRelationshipActorRef = { kind: 'band', id: 'matze' }

/** The persisted tier between two actors, `0` for a pair with no history. */
const tierOf = (
  state: GameState,
  first: ExpeditionRelationshipActorRef,
  second: ExpeditionRelationshipActorRef
): number =>
  getExpeditionRelationshipTier(
    state.career?.expeditionRelationshipByPair,
    first,
    second
  )

// Relationship gates (plan 03 Task 4 / Task 11): each pair kind has a tier
// that opens content and one that closes it.
// - Crew<->Crew Mika/Tom: at -1 or worse a reconciliation event opens; at -2
//   they stop arguing (the conflict event closes).
// - Crew<->Crew Noah/Yara: a route dispute only happens while they have not
//   bonded (tier <= 0); a soured pair (tier < 0) no longer shares leads, so the
//   breakthrough closes.
// - Band<->Crew Matze/Tom: at -1 or worse a grudge event opens; at +1 or better
//   Tom can cover for Matze during the injury scare; at +2 the band-tension
//   event closes.
/**
 * A collection of randomized expedition events related to crew interactions and conflicts.
 */
export const EXPEDITION_CREW_EVENTS = [
  {
    id: 'expedition_crew_conflict_mika_tom',
    category: 'band',
    title: 'events:expedition_crew_conflict_mika_tom.title',
    description: 'events:expedition_crew_conflict_mika_tom.description',
    trigger: 'random',
    chance: 0.1,
    condition: (state: GameState): boolean =>
      activeWithCrew(['mika', 'tom'])(state) && tierOf(state, MIKA, TOM) > -2,
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
    id: 'expedition_crew_reconcile_mika_tom',
    category: 'band',
    title: 'events:expedition_crew_reconcile_mika_tom.title',
    description: 'events:expedition_crew_reconcile_mika_tom.description',
    trigger: 'random',
    chance: 0.08,
    condition: (state: GameState): boolean =>
      activeWithCrew(['mika', 'tom'])(state) && tierOf(state, MIKA, TOM) <= -1,
    options: [
      {
        id: 'mediate',
        label: 'events:expedition_crew_reconcile_mika_tom.mediate.label',
        effect: { type: 'expedition', result: 'crew_conflict_mediated' },
        outcomeText: 'events:expedition_crew_reconcile_mika_tom.mediate.outcome'
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
    condition: (state: GameState): boolean =>
      activeWithCrew(['tom'])(state) && tierOf(state, MATZE, TOM) < 2,
    options: [
      {
        id: 'listen',
        label: 'events:expedition_crew_band_tension.listen.label',
        effect: { type: 'expedition', result: 'crew_band_tension_heard' },
        outcomeText: 'events:expedition_crew_band_tension.listen.outcome'
      },
      {
        id: 'brush_off',
        label: 'events:expedition_crew_band_tension.brush_off.label',
        effect: { type: 'expedition', result: 'crew_band_tension_dismissed' },
        outcomeText: 'events:expedition_crew_band_tension.brush_off.outcome'
      }
    ]
  },
  {
    id: 'expedition_crew_band_grudge',
    category: 'band',
    title: 'events:expedition_crew_band_grudge.title',
    description: 'events:expedition_crew_band_grudge.description',
    trigger: 'random',
    chance: 0.08,
    condition: (state: GameState): boolean =>
      activeWithCrew(['tom'])(state) && tierOf(state, MATZE, TOM) <= -1,
    options: [
      {
        id: 'make_amends',
        label: 'events:expedition_crew_band_grudge.make_amends.label',
        effect: { type: 'expedition', result: 'crew_band_grudge_settled' },
        outcomeText: 'events:expedition_crew_band_grudge.make_amends.outcome'
      }
    ]
  },
  {
    id: 'expedition_crew_route_dispute_noah_yara',
    category: 'band',
    title: 'events:expedition_crew_route_dispute_noah_yara.title',
    description: 'events:expedition_crew_route_dispute_noah_yara.description',
    trigger: 'random',
    chance: 0.06,
    condition: (state: GameState): boolean =>
      activeWithCrew(['noah', 'yara'])(state) && tierOf(state, NOAH, YARA) <= 0,
    options: [
      {
        id: 'back_yara',
        label: 'events:expedition_crew_route_dispute_noah_yara.back_yara.label',
        effect: { type: 'expedition', result: 'crew_route_dispute_settled' },
        outcomeText:
          'events:expedition_crew_route_dispute_noah_yara.back_yara.outcome'
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
      activeWithCrew(['noah', 'yara'])(state) && tierOf(state, NOAH, YARA) >= 0,
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
      },
      {
        id: 'tom_covers',
        label: 'events:expedition_crew_injury_scare.tom_covers.label',
        condition: (state: GameState): boolean =>
          activeWithCrew(['tom'])(state) && tierOf(state, MATZE, TOM) >= 1,
        disabledReason: 'events:expedition_crew_injury_scare.tom_covers.locked',
        effect: { type: 'expedition', result: 'crew_injury_scare_covered' },
        outcomeText: 'events:expedition_crew_injury_scare.tom_covers.outcome'
      }
    ]
  }
]
