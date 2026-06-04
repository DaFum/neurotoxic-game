import { memo } from 'react'
import { VoidSkullIcon } from '../../ui/shared/Icons'

interface OverloadWarningProps {
  overload: number
  isToxicMode: boolean
}

/**
 * Displays the skull warning only when overload is critical or toxic mode is active.
 * @param props - Overload value and toxic-mode state used to decide warning visibility.
 */
export const OverloadWarning = memo(function OverloadWarning({
  overload,
  isToxicMode
}: OverloadWarningProps) {
  if (overload <= 90 && !isToxicMode) return null

  return (
    <div className='absolute top-1/4 right-4 sm:right-8 z-(--z-stage-overlay) opacity-50 pointer-events-none'>
      <VoidSkullIcon className='w-16 h-16 sm:w-32 sm:h-32 text-blood-red animate-pulse' />
    </div>
  )
})
