import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import type { BandMember as GameBandMember } from '../../../types'

export type BandMember = GameBandMember

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
