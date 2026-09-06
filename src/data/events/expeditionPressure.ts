/**
 * The Pressure Director's four events.
 *
 * @remarks
 * Each entry's id matches its {@link EXPEDITION_PRESSURE_EVENTS} registry
 * entry, so the Director's weighting and the event the player actually sees
 * are the same thing. The weighting arrives as a functional `chance`, which is
 * where this repo puts state-derived probability; the condition only decides
 * eligibility. Options name a canonical Expedition *result* and never carry
 * numbers of their own - the result registry owns those.
 */

import type { GameState } from '../../types'
import { getExpeditionPressureEventChance } from '../../domain/expedition/pressure'

const onActiveRun = (state: GameState): boolean =>
  state.expedition?.status === 'active'

const directorChance =
  (eventId: string) =>
  (state: GameState): number =>
    getExpeditionPressureEventChance(state, eventId)

export const EXPEDITION_PRESSURE_EVENTS_DB = [
  {
    id: 'expedition_authority_patrol',
    category: 'transport',
    title: 'events:expedition_authority_patrol.title',
    description: 'events:expedition_authority_patrol.description',
    trigger: 'random',
    chance: directorChance('expedition_authority_patrol'),
    condition: onActiveRun,
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
    chance: directorChance('expedition_underground_invite'),
    condition: onActiveRun,
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
    chance: directorChance('expedition_technical_collapse'),
    condition: onActiveRun,
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
    chance: directorChance('expedition_rival_ambush'),
    // The rival family only makes sense with a Rival on the road.
    condition: (state: GameState): boolean =>
      onActiveRun(state) && Boolean(state.rivalBand),
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
