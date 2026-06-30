import { memo } from 'react'
import { VoidSkullIcon } from '../../ui/shared/Icons'

interface OverloadWarningProps {
  overload: number
  isToxicMode: boolean
}

/**
 * Displays the skull warning only when overload is critical or toxic mode is active.
 *
 * @param overload - The current system overload percentage.
 * @param isToxicMode - Whether the game is currently in toxic mode.
 * @returns A React node rendering the warning visual if thresholds are met, or null otherwise.
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
