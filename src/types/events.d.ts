import type { UnknownRecord } from './game'
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
