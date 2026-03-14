import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { Panel, ActionButton } from '../../ui/shared'
import { ZEALOTRY_PROMO_THRESHOLD } from '../../utils/economyEngine'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'

const SocialOptionButton = memo(({ opt, index, onSelect }) => {
  const { t } = useTranslation()
  const handleClick = useCallback(() => onSelect(opt), [onSelect, opt])

  const getImagePromptForCategory = (category, badges) => {
    if (badges?.includes('🔥')) return IMG_PROMPTS.SOCIAL_POST_VIRAL
    if (category === 'Drama') return IMG_PROMPTS.SOCIAL_POST_DRAMA
    if (category === 'Performance') return IMG_PROMPTS.SOCIAL_POST_MUSIC
    if (category === 'Commercial') return IMG_PROMPTS.SOCIAL_POST_COMMERCIAL
    if (category === 'Lifestyle') return IMG_PROMPTS.SOCIAL_POST_LIFESTYLE
    return IMG_PROMPTS.SOCIAL_POST_TECH
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.15 }}
      className='h-full'
    >
      <ActionButton
        onClick={handleClick}
        className='flex flex-col h-full items-start justify-start p-4 min-h-[180px] text-left relative overflow-hidden w-full group'
      >
        {/* Background Image Watermark */}
        <div
          className='absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-cover bg-center mix-blend-screen pointer-events-none'
          style={{
            backgroundImage: `url("${getGenImageUrl(getImagePromptForCategory(opt.category, opt.badges))}")`
          }}
        />

        <div className='flex justify-between items-start mb-2 w-full z-10 relative'>
          <div className='font-bold text-lg leading-tight pr-2 transition-colors'>
            {t(`ui:postOptions.${opt.id}.name`, { defaultValue: opt.name })}
          </div>
          <div className='flex gap-1 text-sm bg-void-black/50 px-1 rounded backdrop-blur-sm'>
            {opt.badges?.map(b => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
        <div className='text-xs text-ash-gray font-mono space-y-1 mb-2 w-full z-10 relative'>
          <div className='flex justify-between border-b border-ash-gray/20 pb-1'>
            <span>
              {t('economy:social.platform', { defaultValue: 'Platform' })}
            </span>
            <span className='text-star-white/60'>{opt.platform}</span>
          </div>
          <div className='flex justify-between pt-1'>
            <span>
              {t('economy:social.category', { defaultValue: 'Category' })}
            </span>
            <span className='text-star-white/60'>{opt.category}</span>
          </div>
        </div>

        {/* Side Effects Preview */}
        <div className='mt-auto pt-2 text-[10px] uppercase font-mono tracking-wider w-full z-10 relative'>
          <div className='flex flex-wrap gap-2'>
            {opt.badges?.includes('⚠️') && (
              <span className='text-blood-red'>
                {t('economy:social.highVariance', {
                  defaultValue: 'High Variance Risk'
                })}
              </span>
            )}
            {opt.badges?.includes('🛡️') && (
              <span className='text-toxic-green'>
                {t('economy:social.consistentGrowth', {
                  defaultValue: 'Consistent Growth'
                })}
              </span>
            )}
          </div>
        </div>
      </ActionButton>
    </motion.div>
  )
})

SocialOptionButton.displayName = 'SocialOptionButton'
SocialOptionButton.propTypes = {
  opt: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    platform: PropTypes.string.isRequired,
    category: PropTypes.string,
    badges: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired
}

export const SocialPhase = ({
  options,
  onSelect,
  trend,
  zealotryLevel = 0
}) => {
  const { t } = useTranslation()
  return (
    <Panel contentClassName='space-y-6'>
      {/* Zealotry Gauge UI */}
      {zealotryLevel > 0 && (
        <div className='flex flex-row items-center gap-4 mb-4 p-3 bg-blood-red/10 border border-blood-red/30 rounded relative overflow-hidden'>
          <div className='w-12 h-12 shrink-0 border border-blood-red/50 rounded overflow-hidden'>
            <img
              src={getGenImageUrl(IMG_PROMPTS.ZEALOTRY_CULT)}
              alt='Zealotry Cult'
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
      )}

      <div className='text-center mb-2'>
        <h3 className='text-xl font-mono tracking-widest'>
          {t('economy:social.postToSocial', {
            defaultValue: 'POST TO SOCIAL MEDIA'
          })}
        </h3>
        {trend && (
          <div className='text-sm text-toxic-green tracking-widest mt-1 font-bold animate-pulse'>
            {t('economy:social.currentTrend', {
              defaultValue: 'CURRENT TREND:'
            })}{' '}
            {trend}
          </div>
        )}
        <div className='text-[10px] text-ash-gray tracking-wider mt-1'>
          {t('economy:social.chooseStrategy', {
            defaultValue: 'CHOOSE YOUR STRATEGY'
          })}
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {options.map((opt, i) => (
          <SocialOptionButton
            key={opt.id}
            opt={opt}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Panel>
  )
}

SocialPhase.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      platform: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  trend: PropTypes.string,
  zealotryLevel: PropTypes.number
}
