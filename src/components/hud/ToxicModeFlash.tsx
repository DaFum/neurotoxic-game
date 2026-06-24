import { memo } from 'react'

/**
 * Properties for the ToxicModeFlash component.
 */
interface ToxicModeFlashProps {
  /** Indicates whether the toxic-mode modifier is currently active. */
  isToxicMode?: boolean
}

/**
 * Shows the full-screen toxic-mode flash when the modifier is active.
 *
 * @returns The flash overlay element if active, or null otherwise.
 */
export const ToxicModeFlash = memo(function ToxicModeFlash({
  isToxicMode
}: ToxicModeFlashProps) {
  if (!isToxicMode) return null
  return (
    <div className='absolute inset-0 z-(--z-base) toxic-border-flash pointer-events-none' />
  )
})
