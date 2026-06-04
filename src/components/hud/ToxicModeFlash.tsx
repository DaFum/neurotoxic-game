import { memo } from 'react'

interface ToxicModeFlashProps {
  isToxicMode?: boolean
}

/**
 * Renders the Toxic Mode Flash component from isToxicMode.
 * @param props - Toxic-mode state used to show the flash overlay.
 * @returns The rendered Toxic Mode Flash UI.
 */
export const ToxicModeFlash = memo(function ToxicModeFlash({
  isToxicMode
}: ToxicModeFlashProps) {
  if (!isToxicMode) return null
  return (
    <div className='absolute inset-0 z-(--z-base) toxic-border-flash pointer-events-none' />
  )
})
