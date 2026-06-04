import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoadieControlsProps } from '../../../types/components'
import { RoadieTouchSurface } from './RoadieTouchSurface'
import { RoadieDPad } from './RoadieDPad'

/**
 * Renders the Roadie Controls component from showControls, setShowControls, handleMoveUp, handleMoveLeft, handleMoveDown, and handleMoveRight.
 * @param props - Roadie touch-control visibility state, visibility setter, and directional movement callbacks.
 * @returns The rendered Roadie Controls UI.
 */
export const RoadieControls = memo(function RoadieControls({
  showControls,
  setShowControls,
  handleMoveUp,
  handleMoveLeft,
  handleMoveDown,
  handleMoveRight
}: RoadieControlsProps) {
  const { t } = useTranslation(['ui'])

  return (
    <>
      <RoadieTouchSurface
        handleMoveUp={handleMoveUp}
        handleMoveLeft={handleMoveLeft}
        handleMoveDown={handleMoveDown}
        handleMoveRight={handleMoveRight}
      />

      {/* Controls Toggle (Desktop Mode Support) */}
      <button
        type='button'
        className='absolute top-4 right-4 z-50 p-2 bg-void-black/50 text-toxic-green border-2 border-toxic-green hover:bg-toxic-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green pointer-events-auto text-xs font-mono hidden md:block'
        onClick={() => setShowControls(prev => !prev)}
        aria-label={t('ui:roadieRun.controls.toggleAria')}
      >
        {showControls
          ? t('ui:roadieRun.controls.hide')
          : t('ui:roadieRun.controls.show')}
      </button>

      {/* Controls Hint */}
      <div className='absolute bottom-4 left-8 text-star-white/50 text-sm font-mono pointer-events-none hidden md:block'>
        {t('ui:roadieRun.controls.movementHint')}
      </div>

      <div className='absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-(--z-stage-overlay) px-3 py-1 border border-star-white/20 bg-void-black/60 text-star-white/60 text-xs font-mono pointer-events-none md:hidden'>
        {t('ui:roadieRun.controls.touchHint')}
      </div>

      <RoadieDPad
        showControls={showControls}
        handleMoveUp={handleMoveUp}
        handleMoveLeft={handleMoveLeft}
        handleMoveDown={handleMoveDown}
        handleMoveRight={handleMoveRight}
      />
    </>
  )
})
