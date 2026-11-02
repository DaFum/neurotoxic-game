import { GamepadHint } from '../../../ui/gamepad/InputHint'
import { useTranslation } from 'react-i18next'
import { useActiveInputSource } from '../../../utils/gamepad/inputSource'
import type { TourbusHUDProps } from '../../../types/components'

/**
 * Displays tourbus travel distance and raw minigame damage while driving.
 * @param props - Travel distance and damage totals displayed during the tourbus minigame.
 */
export const TourbusHUD = ({ distance, damage }: TourbusHUDProps) => {
  const { t } = useTranslation('minigame')
  const inputSource = useActiveInputSource()

  return (
    <div className='absolute scale-75 sm:scale-100 origin-top-left top-4 left-4 z-(--z-stage-overlay) text-star-white font-mono pointer-events-none'>
      <h2 className='text-2xl text-toxic-green'>
        {t('minigame:tourbus.title', { defaultValue: 'TOURBUS TERROR' })}
      </h2>
      {/* GamepadHint covers controller play; everyone else gets the keys. */}
      {inputSource !== 'gamepad' && (
        <p className='text-xs font-mono text-ash-gray'>
          {t('minigame:tourbus.steerHint', {
            defaultValue: 'Steer: ←/→ or A/D, or click/tap a side'
          })}
        </p>
      )}
      <GamepadHint action='direction'>
        {t('ui:controller.steer', { defaultValue: 'Steer one lane at a time' })}
      </GamepadHint>
      <div className='mt-2'>
        <p>
          {t('minigame:tourbus.distance', { defaultValue: 'DISTANCE:' })}{' '}
          {distance}m
        </p>
        <p>
          {t('minigame:tourbus.damage', { defaultValue: 'DAMAGE:' })} {damage}%
        </p>
      </div>
    </div>
  )
}
