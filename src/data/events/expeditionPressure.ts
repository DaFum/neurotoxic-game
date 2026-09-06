/**
 * The Pressure Director's four events.
 *
 * @remarks
 * Each entry's id matches its {@link EXPEDITION_PRESSURE_EVENTS} registry
 * entry, so the Director's weighting and the event the player actually sees
 * are the same thing - one draw, not two. The Director makes the pick at the
 * route advance and stores it; each event's condition is simply "am I that
 * pick", so the event the player sees is the event whose consequences apply.
 * Options name a canonical Expedition *result* and never carry numbers of
 * their own - the result registry owns those.
 */

import type { GameState } from '../../types'
/**
 * Eligibility for the one event the Director selected for this route step.
 *
 * @remarks
 * The Director already applied the pool rate, per-family weighting and each
 * event's own eligibility when it made the pick, so there is nothing left to
 * roll here: a second probability would be a second draw, and the selected
 * event and the surfaced event could disagree.
 */
const isPendingDirectorEvent =
  (eventId: string) =>
  (state: GameState): boolean =>
    state.expedition?.status === 'active' &&
    state.expedition.pressure?.pendingDirectorEventId === eventId

export const EXPEDITION_PRESSURE_EVENTS_DB = [
  {
    id: 'expedition_authority_patrol',
    category: 'transport',
    title: 'events:expedition_authority_patrol.title',
    description: 'events:expedition_authority_patrol.description',
    trigger: 'random',
    chance: 1,
    condition: isPendingDirectorEvent('expedition_authority_patrol'),
    options: [
      {
        id: 'wave_through',
        label: 'events:expedition_authority_patrol.wave_through.label',
        effect: { type: 'expedition', result: 'attention_drawn' },
        outcomeText: 'events:expedition_authority_patrol.wave_through.outcome'
      },
      {
        id: 'take_the_long_way',
        label: 'events:expedition_authority_patrol.take_the_long_way.label',
        effect: { type: 'expedition', result: 'attention_faded' },
        outcomeText:
          'events:expedition_authority_patrol.take_the_long_way.outcome'
      }
    ]
  },
  {
    id: 'expedition_underground_invite',
    category: 'special',
    title: 'events:expedition_underground_invite.title',
    description: 'events:expedition_underground_invite.description',
    trigger: 'random',
    chance: 1,
    condition: isPendingDirectorEvent('expedition_underground_invite'),
    options: [
      {
        id: 'take_the_address',
        label: 'events:expedition_underground_invite.take_the_address.label',
        effect: { type: 'expedition', result: 'spare_parts_scavenged' },
        outcomeText:
          'events:expedition_underground_invite.take_the_address.outcome'
      },
      {
        id: 'stay_clean',
        label: 'events:expedition_underground_invite.stay_clean.label',
        effect: { type: 'expedition', result: 'attention_faded' },
        outcomeText: 'events:expedition_underground_invite.stay_clean.outcome'
      }
    ]
  },
  {
    id: 'expedition_technical_collapse',
    category: 'transport',
    title: 'events:expedition_technical_collapse.title',
    description: 'events:expedition_technical_collapse.description',
    trigger: 'random',
    chance: 1,
    condition: isPendingDirectorEvent('expedition_technical_collapse'),
    options: [
      {
        id: 'push_the_rig',
        label: 'events:expedition_technical_collapse.push_the_rig.label',
        effect: { type: 'expedition', result: 'pa_overloaded' },
        outcomeText: 'events:expedition_technical_collapse.push_the_rig.outcome'
      },
      {
        id: 'strip_it_down',
        label: 'events:expedition_technical_collapse.strip_it_down.label',
        effect: { type: 'expedition', result: 'equipment_scuffed' },
        outcomeText:
          'events:expedition_technical_collapse.strip_it_down.outcome'
      }
    ]
  },
  {
    id: 'expedition_rival_ambush',
    category: 'band',
    title: 'events:expedition_rival_ambush.title',
    description: 'events:expedition_rival_ambush.description',
    trigger: 'random',
    chance: 1,
    // The Rival requirement lives on the registry entry the Director filters
    // by, so it cannot select this event on a run with no Rival at all.
    condition: isPendingDirectorEvent('expedition_rival_ambush'),
    options: [
      {
        id: 'let_it_go',
        label: 'events:expedition_rival_ambush.let_it_go.label',
        effect: { type: 'expedition', result: 'supplies_spoiled' },
        outcomeText: 'events:expedition_rival_ambush.let_it_go.outcome'
      },
      {
        id: 'guard_the_gear',
        label: 'events:expedition_rival_ambush.guard_the_gear.label',
        effect: { type: 'expedition', result: 'equipment_scuffed' },
        outcomeText: 'events:expedition_rival_ambush.guard_the_gear.outcome'
      }
    ]
  }
]
