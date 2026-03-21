import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const RoadieControls = memo(function RoadieControls({
  showControls,
  setShowControls,
  handleMoveUp,
  handleMoveLeft,
  handleMoveDown,
  handleMoveRight
}) {
  const { t } = useTranslation(['ui'])

  return (
    <>
      {/* Controls Toggle (Desktop Mode Support) */}
      <button
        type='button'
        className='absolute top-4 right-4 z-50 p-2 bg-void-black/50 text-toxic-green border border-toxic-green rounded hover:bg-toxic-green/20 pointer-events-auto text-xs font-mono hidden md:block'
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

      {/* Mobile D-Pad */}
      <div
        className={`absolute bottom-24 right-8 z-40 grid grid-cols-3 gap-2 pointer-events-auto ${showControls ? '' : 'md:hidden'}`}
      >
        <div />
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveUp}
          aria-label={t('ui:moveUp', { defaultValue: 'Move Up' })}
        >
          ▲
        </button>
        <div />
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveLeft}
          aria-label={t('ui:moveLeft', { defaultValue: 'Move Left' })}
        >
          ◄
        </button>
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveDown}
          aria-label={t('ui:moveDown', { defaultValue: 'Move Down' })}
        >
          ▼
        </button>
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveRight}
          aria-label={t('ui:moveRight', { defaultValue: 'Move Right' })}
        >
          ►
        </button>
      </div>
    </>
  )
})
