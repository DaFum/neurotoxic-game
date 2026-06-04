import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface RoadieDPadProps {
  showControls: boolean
  handleMoveUp: () => void
  handleMoveLeft: () => void
  handleMoveDown: () => void
  handleMoveRight: () => void
}

/**
 * Renders the Roadie D Pad component from showControls, handleMoveUp, handleMoveLeft, handleMoveDown, and handleMoveRight.
 * @param props - Roadie control visibility flag and directional movement callbacks.
 * @returns The rendered Roadie D Pad UI.
 */
export const RoadieDPad = memo(function RoadieDPad({
  showControls,
  handleMoveUp,
  handleMoveLeft,
  handleMoveDown,
  handleMoveRight
}: RoadieDPadProps) {
  const { t } = useTranslation(['ui'])

  return (
    <div
      className={`absolute bottom-24 right-8 z-(--z-stage-controls) hidden grid-cols-3 gap-2 pointer-events-auto ${showControls ? 'md:grid' : ''}`}
    >
      <div />
      <button
        type='button'
        className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border-2 border-star-white/30 flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
        onClick={handleMoveUp}
        aria-label={t('ui:moveUp')}
      >
        ▲
      </button>
      <div />
      <button
        type='button'
        className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border-2 border-star-white/30 flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
        onClick={handleMoveLeft}
        aria-label={t('ui:moveLeft')}
      >
        ◄
      </button>
      <button
        type='button'
        className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border-2 border-star-white/30 flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
        onClick={handleMoveDown}
        aria-label={t('ui:moveDown')}
      >
        ▼
      </button>
      <button
        type='button'
        className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border-2 border-star-white/30 flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
        onClick={handleMoveRight}
        aria-label={t('ui:moveRight')}
      >
        ►
      </button>
    </div>
  )
})
