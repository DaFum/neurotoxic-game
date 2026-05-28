import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ZEALOTRY_PROMO_THRESHOLD } from '../../utils/economyEngine'
import { clampZealotry } from '../../utils/gameStateUtils'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../utils/imageGen'

type ZealotryGaugeProps = { zealotryLevel?: number }

export const ZealotryGauge = memo(
  ({ zealotryLevel = 0 }: ZealotryGaugeProps) => {
    const { t } = useTranslation()

    if (zealotryLevel <= 0) return null

    return (
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 p-3 bg-blood-red/10 border-2 border-blood-red/50 relative overflow-hidden'>
        <div className='w-12 h-12 shrink-0 border-2 border-blood-red/50 overflow-hidden'>
          <img
            src={resolveGenImageUrl(IMG_PROMPTS.ZEALOTRY_CULT)}
            alt={t('ui:postGig.socialPhase.altZealotryCult', {
              defaultValue: 'Zealotry Cult'
            })}
            className='w-full h-full object-cover mix-blend-screen opacity-80'
          />
        </div>
        <div className='w-full flex-1 flex flex-col'>
          <div className='flex justify-between items-center gap-3 mb-1'>
            <span className='min-w-0 text-xs font-bold text-blood-red uppercase tracking-widest break-words'>
              {t('economy:social.cultZealotry', {
                defaultValue: 'CULT ZEALOTRY'
              })}
            </span>
            <span className='shrink-0 text-xs font-mono text-blood-red-bright'>
              {zealotryLevel}%
            </span>
          </div>
          <div className='w-full bg-void-black/50 h-2 overflow-hidden'>
            <div
              className='bg-blood-red h-full transition-all duration-500'
              style={{
                width: `${clampZealotry(zealotryLevel)}%`
              }}
            />
          </div>
          {zealotryLevel >= ZEALOTRY_PROMO_THRESHOLD && (
            <div className='text-[10px] text-blood-red-bright mt-1 uppercase animate-pulse break-words'>
              {t('economy:social.zealotryWarning', {
                defaultValue:
                  'WARNING: FANS ARE BECOMING RADICALIZED. POLICE RAID RISK INCREASED.'
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
)

ZealotryGauge.displayName = 'ZealotryGauge'
