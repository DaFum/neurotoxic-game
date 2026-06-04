import { useTranslation } from 'react-i18next'
import type { TourbusControlsProps } from '../../../types/components'

/**
 * Renders the Tourbus Controls component from onMoveLeft and onMoveRight.
 * @param props - Left and right movement callbacks for the tourbus minigame.
 * @returns The rendered Tourbus Controls UI.
 */
export const TourbusControls = ({
  onMoveLeft,
  onMoveRight
}: TourbusControlsProps) => {
  const { t } = useTranslation('minigame')

  return (
    <div className='absolute inset-0 z-(--z-stage-controls) flex justify-between pointer-events-auto'>
      <button
        type='button'
        aria-label={t('minigame:tourbus.moveLeft', {
          defaultValue: 'Move Left'
        })}
        className='w-1/2 h-full active:bg-star-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset flex items-center justify-center text-transparent [@media(pointer:coarse)]:text-star-white/30 text-4xl'
        onClick={onMoveLeft}
      >
        {'<'}
      </button>
      <button
        type='button'
        aria-label={t('minigame:tourbus.moveRight', {
          defaultValue: 'Move Right'
        })}
        className='w-1/2 h-full active:bg-star-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset flex items-center justify-center text-transparent [@media(pointer:coarse)]:text-star-white/30 text-4xl'
        onClick={onMoveRight}
      >
        {'>'}
      </button>
    </div>
  )
}
