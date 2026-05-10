import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AmpHUDProps } from '../../../types/components'

export const AmpHUD = memo(function AmpHUD({
  timeLeft,
  score,
  heat,
  isOverheat,
  voidResonance = 0,
  isAnomalyActive = false,
  interference = 0,
  isHijackActive = false,
  hijacksOverridden = 0
}: AmpHUDProps) {
  const { t } = useTranslation(['ui'])

  return (
    <div className='absolute top-4 left-4 z-30 text-star-white font-mono pointer-events-none bg-void-black/80 p-4 border-2 border-toxic-green shadow-[0_0_15px_var(--color-toxic-green)]'>
      <h2 className='text-2xl font-bold text-toxic-green tracking-widest uppercase mb-2'>
        {t('ui:minigames.amp.title', { defaultValue: 'AMP CALIBRATION' })}
      </h2>
      <div className='flex flex-col gap-1 text-sm'>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('ui:minigames.amp.hud.time', { defaultValue: 'TIME:' })}
          </span>
          <span
            className={
              timeLeft < 5
                ? 'text-blood-red animate-pulse font-bold'
                : 'text-toxic-green'
            }
          >
            {timeLeft.toFixed(1)}s
          </span>
        </div>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('ui:minigames.amp.hud.stability', {
              defaultValue: 'STABILITY:'
            })}
          </span>
          <span className='text-toxic-green'>{Math.floor(score)}%</span>
        </div>

        {(voidResonance > 0 || isAnomalyActive) && (
          <div className='mt-2 w-48'>
            <div className='flex justify-between items-center mb-1'>
              <span
                className={`uppercase text-xs ${isAnomalyActive ? 'text-electric-blue animate-pulse font-bold' : 'text-ash-gray'}`}
              >
                {isAnomalyActive
                  ? t('ui:minigames.amp.hud.anomaly', {
                      defaultValue: 'VOID ANOMALY DETECTED'
                    })
                  : t('ui:minigames.amp.hud.resonance', {
                      defaultValue: 'VOID RESONANCE'
                    })}
              </span>
              <span className='text-electric-blue text-xs'>
                {Math.floor(voidResonance)}%
              </span>
            </div>
            <div className='h-2 w-full bg-void-black border border-electric-blue overflow-hidden shadow-[0_0_5px_var(--color-electric-blue)]'>
              <div
                className={`h-full bg-electric-blue transition-all duration-100 ${isAnomalyActive ? 'animate-pulse' : ''}`}
                style={{ width: `${voidResonance}%` }}
              />
            </div>
          </div>
        )}

        <div className='mt-2 w-48'>
          <div className='flex justify-between items-center mb-1'>
            <span
              className={`uppercase text-xs ${isOverheat ? 'text-blood-red animate-pulse font-bold' : 'text-ash-gray'}`}
            >
              {isOverheat
                ? t('ui:minigames.amp.hud.overheat', {
                    defaultValue: 'OVERHEAT!'
                  })
                : t('ui:minigames.amp.hud.heat', { defaultValue: 'HEAT' })}
            </span>
            <span
              className={`text-xs ${isOverheat ? 'text-blood-red' : 'text-warning-yellow'}`}
            >
              {Math.floor(heat)}%
            </span>
          </div>
          <div className='h-2 w-full bg-void-black border border-ash-gray overflow-hidden'>
            <div
              className={`h-full transition-all duration-100 ${isOverheat ? 'bg-blood-red animate-pulse' : 'bg-warning-yellow'}`}
              style={{ width: `${heat}%` }}
            />
          </div>
        </div>

        {(isHijackActive || hijacksOverridden > 0) && (
          <div className='mt-2 w-48 border border-blood-red p-2 bg-void-black/50'>
            <div className='flex justify-between items-center'>
              <span
                className={`uppercase text-xs font-bold ${isHijackActive ? 'text-blood-red animate-pulse' : 'text-ash-gray'}`}
              >
                {t('ui:minigames.amp.hud.hijack', { defaultValue: 'HIJACK:' })}
              </span>
              <span
                className={`text-xs ${isHijackActive ? 'text-blood-red font-bold' : 'text-ash-gray'}`}
              >
                {isHijackActive
                  ? t('ui:minigames.amp.hud.hijackActive', {
                      defaultValue: 'ACTIVE'
                    })
                  : t('ui:minigames.amp.hud.hijackClear', {
                      defaultValue: 'CLEAR'
                    })}
              </span>
            </div>
            <div className='flex justify-between items-center mt-1'>
              <span className='uppercase text-xs text-ash-gray'>
                {t('ui:minigames.amp.hud.overrides', {
                  defaultValue: 'OVERRIDES:'
                })}
              </span>
              <span className='text-toxic-green text-xs font-bold'>
                {hijacksOverridden}
              </span>
            </div>
          </div>
        )}

        {interference > 0 && (
          <div className='mt-2 w-48'>
            <div className='flex justify-between items-center mb-1'>
              <span className='uppercase text-xs text-blood-red animate-pulse font-bold'>
                {t('ui:minigames.amp.hud.interference', {
                  defaultValue: 'INTERFERENCE'
                })}
              </span>
              <span className='text-blood-red text-xs'>
                {Math.floor(interference)}%
              </span>
            </div>
            <div className='h-2 w-full bg-void-black border border-blood-red overflow-hidden shadow-[0_0_5px_var(--color-blood-red)]'>
              <div
                className='h-full bg-blood-red transition-all duration-100'
                style={{ width: `${interference}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
