import { BlockMeter } from '../../../ui/shared'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AmpHUDProps } from '../../../types/components'
import type { TranslationCallback } from '../../../types/callbacks'

type IndicatorProps = {
  t: TranslationCallback
}

function VoidResonanceIndicator({
  voidResonance,
  isAnomalyActive,
  t
}: IndicatorProps & { voidResonance: number; isAnomalyActive: boolean }) {
  if (voidResonance <= 0 && !isAnomalyActive) return null

  return (
    <div className='mt-2 w-48'>
      <BlockMeter
        label={
          isAnomalyActive
            ? String(
                t('ui:minigames.amp.hud.anomaly', {
                  defaultValue: 'VOID ANOMALY DETECTED'
                })
              )
            : String(
                t('ui:minigames.amp.hud.resonance', {
                  defaultValue: 'VOID RESONANCE'
                })
              )
        }
        value={Math.floor(voidResonance)}
        max={100}
        colorClass='bg-electric-blue'
        textClass={
          isAnomalyActive
            ? 'text-electric-blue motion-safe:animate-pulse font-bold'
            : 'text-ash-gray'
        }
        borderClass='border-electric-blue shadow-[0_0_5px_var(--color-electric-blue)]'
      />
    </div>
  )
}

function HeatIndicator({
  heat,
  isOverheat,
  t
}: IndicatorProps & { heat: number; isOverheat: boolean }) {
  return (
    <div className='mt-2 w-48'>
      <BlockMeter
        label={
          isOverheat
            ? String(
                t('ui:minigames.amp.hud.overheat', {
                  defaultValue: 'OVERHEAT!'
                })
              )
            : String(t('ui:minigames.amp.hud.heat', { defaultValue: 'HEAT' }))
        }
        value={Math.floor(heat)}
        max={100}
        isDanger={isOverheat}
        colorClass={
          isOverheat
            ? 'bg-error-red motion-safe:animate-pulse'
            : 'bg-warning-yellow'
        }
      />
    </div>
  )
}

function HijackIndicator({
  isHijackActive,
  hijacksOverridden,
  t
}: IndicatorProps & { isHijackActive: boolean; hijacksOverridden: number }) {
  if (!isHijackActive && hijacksOverridden <= 0) return null

  return (
    <div className='mt-2 w-48 border border-error-red p-2 bg-void-black/50'>
      <div className='flex justify-between items-center'>
        <span
          className={`uppercase text-xs font-bold ${isHijackActive ? 'text-error-red motion-safe:animate-pulse' : 'text-ash-gray'}`}
        >
          {t('ui:minigames.amp.hud.hijack', { defaultValue: 'HIJACK:' })}
        </span>
        <span
          className={`text-xs ${isHijackActive ? 'text-error-red font-bold' : 'text-ash-gray'}`}
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
  )
}

function InterferenceIndicator({
  interference,
  t
}: IndicatorProps & { interference: number }) {
  if (interference <= 0) return null

  return (
    <div className='mt-2 w-48'>
      <BlockMeter
        label={String(
          t('ui:minigames.amp.hud.interference', {
            defaultValue: 'INTERFERENCE'
          })
        )}
        value={Math.floor(interference)}
        max={100}
        isDanger={true}
        colorClass='bg-error-red'
        borderClass='border-error-red shadow-[0_0_5px_var(--color-error-red)]'
        textClass='text-error-red motion-safe:animate-pulse font-bold'
      />
    </div>
  )
}

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
    <div className='absolute scale-75 sm:scale-100 origin-top-left top-4 left-4 z-(--z-stage-overlay) text-star-white font-mono pointer-events-none bg-void-black/80 p-4 border-2 border-toxic-green shadow-[0_0_15px_var(--color-toxic-green)]'>
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
                ? 'text-error-red motion-safe:animate-pulse font-bold'
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

        <VoidResonanceIndicator
          voidResonance={voidResonance}
          isAnomalyActive={isAnomalyActive}
          t={t}
        />

        <HeatIndicator heat={heat} isOverheat={isOverheat} t={t} />

        <HijackIndicator
          isHijackActive={isHijackActive}
          hijacksOverridden={hijacksOverridden}
          t={t}
        />

        <InterferenceIndicator interference={interference} t={t} />
      </div>
    </div>
  )
})
