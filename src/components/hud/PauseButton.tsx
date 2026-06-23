import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '../../ui/shared'

interface PauseButtonProps {
  onTogglePause?: () => void
  isGameOver?: boolean
}

/**
 * Provides the gig pause toggle and disables it once the gig is over.
 * @param props - Props containing `onTogglePause` callback and `isGameOver` disabled state.
 */
export const PauseButton = memo(function PauseButton({
  onTogglePause,
  isGameOver
}: PauseButtonProps) {
  const { t } = useTranslation(['ui'])

  return (
    <div className='absolute top-4 right-4 z-(--z-hud) pointer-events-auto'>
      <Tooltip
        content={t('ui:gig.pause', { defaultValue: 'Pause Game (ESC)' })}
      >
        <button
          type='button'
          onClick={onTogglePause}
          className={`bg-void-black/90 border-2 border-toxic-green text-toxic-green w-12 h-12 flex items-center justify-center transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toxic-green focus-visible:ring-offset-0 ${isGameOver ? 'opacity-50 pointer-events-none border-ash-gray text-ash-gray' : 'hover:bg-toxic-green hover:text-void-black hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px] hover:shadow-blood-red active:translate-y-0 active:translate-x-0 active:shadow-none'}`}
          aria-label={t('ui:gig.pauseAria', { defaultValue: 'Pause Game' })}
          disabled={isGameOver}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='w-5 h-5'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15.75 5.25v13.5m-7.5-13.5v13.5'
            />
          </svg>
        </button>
      </Tooltip>
    </div>
  )
})
