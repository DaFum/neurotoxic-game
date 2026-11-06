import type { UnknownRecord } from './game'

/**
 * Selectable option on a game event.
 */
export interface EventOption {
  id?: string
  text?: string
  textKey?: string
  effects?: UnknownRecord
  [key: string]: unknown
}

/**
 * Runtime event definition shown to the player.
 */
export interface GameEvent {
  id: string
  category?: string
  title?: string
  titleKey?: string
  description?: string
  descriptionKey?: string
  options?: EventOption[]
  effects?: UnknownRecord
  [key: string]: unknown
}

/**
 * State delta containers produced by event resolution.
 */
export interface EventPlayerDelta {
  money?: number
  time?: number
  fame?: number
  score?: number
  day?: number
  location?: string
  currentNodeId?: string
  stats?: Record<string, string | number | boolean>
  van?: {
    fuel?: number
    condition?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface EventBandDelta {
  harmony?: number
  inventory?: Record<string, unknown>
  members?: unknown
  membersDelta?: unknown
  relationshipChange?: import('./game').RelationshipChange[]
  luck?: number
  skill?: number
  stashRemove?: string[]
  /** Catalogue contraband to add to the stash, with a pre-generated instance id. */
  stashAdd?: Array<{ contrabandId: string; instanceId?: string }>
  [key: string]: unknown
}

export interface EventSocialDelta {
  controversyLevel?: number
  viral?: number
  loyalty?: number
  zealotry?: number
  egoFocus?: string | null
  trend?: string
  instagram?: number
  tiktok?: number
  youtube?: number
  newsletter?: number
  reputationCooldown?: number
  scenePresence?: number
  [key: string]: unknown
}

export interface EventFlagsDelta {
  queueEvent?: string
  unlock?: unknown
  gameOver?: boolean
  addStoryFlag?: string
  addCooldown?: string
  addQuest?: unknown[]
  [key: string]: unknown
}

/**
 * State delta containers produced by event resolution.
 */
export type EventDelta = {
  score?: number
  player: EventPlayerDelta
  band: EventBandDelta
  social: EventSocialDelta
  /**
   * Expedition results the event requested, as ids only.
   *
   * @remarks
   * The engine writes this from the `expedition` effect handler and the
   * resolver forwards it as its own typed action, because the Expedition
   * reducer — not `applyEventDelta` — is the authority over run state.
   */
  expedition?: import('./expedition').ExpeditionEventIntent
  flags: EventFlagsDelta
}
