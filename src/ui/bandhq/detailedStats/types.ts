import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'

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
