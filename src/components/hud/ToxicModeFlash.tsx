import { memo } from 'react'

interface ToxicModeFlashProps {
  isToxicMode?: boolean
}

export const ToxicModeFlash = memo(function ToxicModeFlash({
  isToxicMode
}: ToxicModeFlashProps) {
  if (!isToxicMode) return null
  return (
    <div className='absolute inset-0 z-0 toxic-border-flash pointer-events-none' />
  )
})
