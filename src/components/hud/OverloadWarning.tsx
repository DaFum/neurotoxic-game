// TODO: Review this file
import { memo } from 'react'
import { VoidSkullIcon } from '../../ui/shared/Icons'

interface OverloadWarningProps {
  overload: number
  isToxicMode: boolean
}

export const OverloadWarning = memo(function OverloadWarning({
  overload,
  isToxicMode
}: OverloadWarningProps) {
  if (overload <= 90 && !isToxicMode) return null

  return (
    <div className='absolute top-1/4 right-8 z-20 opacity-50 pointer-events-none'>
      <VoidSkullIcon className='w-32 h-32 text-blood-red animate-pulse' />
    </div>
  )
})
