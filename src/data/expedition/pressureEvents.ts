import type { ExpeditionPressureEvent } from '../../domain/expedition/pressure'
export const EXPEDITION_PRESSURE_EVENTS: readonly ExpeditionPressureEvent[] = [
  {
    id: 'expedition_authority_patrol',
    severity: 'normal',
    pressureFamily: 'authority',
    baseWeight: 10,
    negative: true
  },
  {
    id: 'expedition_underground_invite',
    severity: 'normal',
    pressureFamily: 'social',
    baseWeight: 4,
    negative: false
  },
  {
    id: 'expedition_technical_collapse',
    severity: 'severe',
    pressureFamily: 'technical',
    baseWeight: 3,
    negative: true
  },
  {
    id: 'expedition_rival_ambush',
    severity: 'severe',
    pressureFamily: 'rival',
    baseWeight: 3,
    negative: true
  }
]
