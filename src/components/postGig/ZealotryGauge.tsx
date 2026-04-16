// @ts-nocheck
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { ZEALOTRY_PROMO_THRESHOLD } from '../../utils/economyEngine'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'

export const ZealotryGauge = memo(({ zealotryLevel }) => {
  const { t } = useTranslation()

  if (zealotryLevel <= 0) return null

  return (
    <div className='flex flex-row items-center gap-4 mb-4 p-3 bg-blood-red/10 border border-blood-red/30 rounded relative overflow-hidden'>
      <div className='w-12 h-12 shrink-0 border border-blood-red/50 rounded overflow-hidden'>
        <img
          src={getGenImageUrl(IMG_PROMPTS.ZEALOTRY_CULT)}
          alt={t('ui:postGig.socialPhase.altZealotryCult', {
            defaultValue: 'Zealotry Cult'
          })}
          className='w-full h-full object-cover mix-blend-screen opacity-80'
        />
      </div>
      <div className='flex-1 flex flex-col'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-xs font-bold text-blood-red uppercase tracking-widest'>
            {t('economy:social.cultZealotry', {
              defaultValue: 'CULT ZEALOTRY'
            })}
          </span>
          <span className='text-xs font-mono text-blood-red/80'>
            {zealotryLevel}%
          </span>
        </div>
        <div className='w-full bg-void-black/50 h-2 rounded overflow-hidden'>
          <div
            className='bg-blood-red h-full transition-all duration-500'
            style={{
              width: `${Math.min(100, Math.max(0, zealotryLevel))}%`
            }}
          />
        </div>
        {zealotryLevel >= ZEALOTRY_PROMO_THRESHOLD && (
          <div className='text-[10px] text-blood-red/80 mt-1 uppercase animate-pulse'>
            {t('economy:social.zealotryWarning', {
              defaultValue:
                'WARNING: FANS ARE BECOMING RADICALIZED. POLICE RAID RISK INCREASED.'
            })}
          </div>
        )}
      </div>
    </div>
  )
})

ZealotryGauge.displayName = 'ZealotryGauge'
ZealotryGauge.propTypes = {
  zealotryLevel: PropTypes.number
}
