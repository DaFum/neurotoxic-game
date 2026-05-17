export interface EventOption {
  id?: string
  text?: string
  textKey?: string
  effects?: UnknownRecord
  [key: string]: unknown
}

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

export type EventDelta = {
  score?: number
  player: Record<string, unknown> & {
    money?: number
    time?: number
    fame?: number
    score?: number
    day?: number
    location?: string
    currentNodeId?: string
    stats?: Record<string, string | number | boolean>
    van?: Record<string, unknown> & {
      fuel?: number
      condition?: number
      [key: string]: unknown
    }
  }
  band: Record<string, unknown> & {
    harmony?: number
    inventory?: Record<string, unknown>
    members?: unknown
    membersDelta?: unknown
    relationshipChange?: import('./game').RelationshipChange[]
    luck?: number
    skill?: number
    stashRemove?: string[]
  }
  social: Record<string, unknown> & {
    controversyLevel?: number
    viral?: number
    loyalty?: number
  }
  flags: Record<string, unknown> & {
    queueEvent?: string
    unlock?: unknown
    gameOver?: boolean
    addStoryFlag?: unknown
    addCooldown?: unknown
    addQuest?: unknown[]
  }
  [key: string]: unknown
}
