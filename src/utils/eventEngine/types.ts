
export type TemplateContext = Record<string, string>
export type TriggerPoint = string | null
export type EngineEvent = {
  id?: string
  trigger?: string
  category?: string
  chance?: number
  requiredFlag?: string
  title?: string
  description?: string
  tags?: string[]
  condition?: (gameState: EngineGameState) => unknown
  options?: EventChoice[]
  [key: string]: unknown
}
export type EventChoice = {
  effect?: EffectShape
  flags?: string[]
  nextEventId?: string
  skillCheck?: {
    stat: string
    threshold: number
    success: EffectShape
    failure: EffectShape
  }
  outcomeText?: string
}
export type EffectShape = {
  type?: string
  effects?: EffectShape[]
  outcome?: string
  description?: string
  nextEventId?: string
  [key: string]: unknown
}
export type EngineGameState = {
  eventCooldowns?: string[] | Set<string>
  activeStoryFlags?: string[] | Set<string>
  pendingEvents?: string[] | Set<string>
  player?: {
    money?: number
    currentLocation?: string
    time?: number
    fame?: number
    day?: number
    van?: Record<string, unknown>
    stats?: Record<string, number>
    [key: string]: unknown
  }
  band?: {
    harmony?: number
    skill?: number
    luck?: number
    members?: Array<
      Record<string, unknown> & { baseStats?: Record<string, number> }
    >
    inventory?: Record<string, unknown>
    [key: string]: unknown
  }
  social?: Record<string, unknown>
  activeEvent?: {
    id?: string
    tags?: string[]
    context?: Record<string, unknown>
  }
  assets?: Array<{
    condition?: number
    slots?: Array<{ installedModuleId?: string | null }>
  }>
  [key: string]: unknown
}