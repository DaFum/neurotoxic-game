import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import type {
  PlayerState,
  BandState,
  SocialState,
  BandMember as GameBandMember,
  QuestState,
  CharacterTrait
} from '../../../types'

export interface CharacterDefinition {
  name: string
  role?: string
  traits?: CharacterTrait[]
}

export type BandMember = GameBandMember
export type PlayerData = PlayerState
export type SocialData = SocialState
export type BandData = BandState
export type ActiveQuest = QuestState

export interface DetailRowProps {
  label: ReactNode
  value: ReactNode
  subtext?: ReactNode
  locked?: boolean
  className?: string
}

export interface BasicTProps {
  t: TFunction
}
