// TODO: Review this file
import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from './shared/index.jsx'
import { GlitchButton } from './GlitchButton.jsx'
import { useTranslation } from 'react-i18next'
import { useId, memo } from 'react'
import { formatNumber } from '../utils/numberUtils.js'

// Helper component for accessible SVGs
const BaseIcon = memo(
  ({
    className = '',
    viewBox = '0 0 24 24',
    title,
    fill = 'currentColor',
    children,
    ...props
  }) => {
    const titleId = useId()
    const isDecorative = !title || title.trim() === ''
    return (
      <svg
        aria-hidden={isDecorative ? 'true' : undefined}
        focusable={isDecorative ? 'false' : undefined}
        role={isDecorative ? 'presentation' : 'img'}
        aria-labelledby={isDecorative ? undefined : titleId}
        fill={fill}
        xmlns='http://www.w3.org/2000/svg'
        preserveAspectRatio='xMidYMid meet'
        {...props}
        className={className}
        viewBox={viewBox}
      >
        {!isDecorative && <title id={titleId}>{title}</title>}
        {children}
      </svg>
    )
  }
)

const IconStar = memo(({ className = '', title }) => (
  <BaseIcon className={className} title={title}>
    <path d='M11.999 1.439l2.844 7.218 7.718.666-5.859 5.093 1.764 7.584-6.467-3.968-6.467 3.968 1.764-7.584-5.859-5.093 7.718-.666 2.844-7.218z' />
  </BaseIcon>
))
const IconClock = memo(({ className = '', title }) => (
  <BaseIcon
    className={className}
    title={title}
    fill='none'
    stroke='currentColor'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    />
  </BaseIcon>
))
const IconTrophy = memo(({ className = '', title }) => (
  <BaseIcon className={className} title={title}>
    <path d='M21 4h-3V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1H3a1 1 0 00-1 1v3c0 2.2 1.8 4 4 4h1v1.6c0 1.9 1.5 3.4 3.4 3.4H9v3a1 1 0 001 1h4a1 1 0 001-1v-3h-1.4c1.9 0 3.4-1.5 3.4-3.4V12h1c2.2 0 4-1.8 4-4V5a1 1 0 00-1-1zM6 10c-1.1 0-2-.9-2-2V6h2v4zm14-2c0 1.1-.9 2-2 2h-2V6h2v2z' />
  </BaseIcon>
))
const IconCoin = memo(({ className = '', title }) => (
  <BaseIcon className={className} title={title}>
    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.26.28 2.62 1.15 2.84 2.99h-1.96c-.15-.97-.9-1.62-2.31-1.62-1.45 0-2.13.79-2.13 1.48 0 .84.53 1.36 2.88 1.9 2.5.58 3.97 1.68 3.97 3.86 0 1.76-1.12 2.89-3.24 3.53z' />
  </BaseIcon>
))
const IconFire = memo(({ className = '', title }) => (
  <BaseIcon className={className} title={title}>
    <path d='M12 2C8 6 4 9 4 14a8 8 0 0016 0c0-5-4-8-8-12zm1 14a3 3 0 11-6 0c0-2 2-4 3-5 1 1 3 3 3 5z' />
  </BaseIcon>
))
const IconThumbUp = memo(({ className = '', title }) => (
  <BaseIcon className={className} title={title}>
    <path d='M14 9V5a3 3 0 00-3-3l-4 9v11h11.3c1.4 0 2.6-1 2.8-2.3l2-11c.1-.8-.5-1.7-1.4-1.7H14zM4 11H1v11h3V11z' />
  </BaseIcon>
))
const IconCube = memo(({ className = '', title }) => (
  <BaseIcon className={className} title={title}>
    <path
      d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
      stroke='currentColor'
      fill='none'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </BaseIcon>
))

// Get translated reward text
const getRewardText = (quest, t) => {
  const value = quest.rewardData
  switch (quest.rewardType) {
    case 'item':
      return t('ui:rewards.freeItem')
    case 'fame':
      return t('ui:rewards.fameWithAmount', { count: value?.fame || 0 })
    case 'fans':
      return t('ui:rewards.fansWithAmount', { count: value?.fans || 0 })
    case 'money':
      return t('ui:rewards.moneyWithAmount', { count: value?.money || 0 })
    case 'skill_point':
      return t('ui:rewards.skillPointWithAmount', { count: 1 })
    case 'harmony':
      return t('ui:rewards.harmonyWithAmount', { count: value?.harmony || 0 })
    default:
      return t('ui:rewards.special')
  }
}

// Map a reward type to an icon
const getRewardIcon = type => {
  switch (type) {
    case 'item':
      return <IconCube className='w-4 h-4 text-toxic-green' />
    case 'fame':
    case 'fans':
      return <IconStar className='w-4 h-4 text-stamina-green' />
    case 'skill_point':
      return <IconFire className='w-4 h-4 text-blood-red' />
    case 'harmony':
      return <IconThumbUp className='w-4 h-4 text-toxic-green' />
    case 'money':
      return <IconCoin className='w-4 h-4 text-fuel-yellow' />
    default:
      return <IconTrophy className='w-4 h-4 text-fuel-yellow' />
  }
}

export const QuestsModal = ({ onClose, activeQuests, player }) => {
  const { t, i18n } = useTranslation(['ui', 'events'])

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
  }

  const questItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  }

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 z-[100] flex items-center justify-center bg-void-black/80 p-4'
        variants={overlayVariants}
        initial='hidden'
        animate='visible'
        exit='hidden'
        onClick={onClose}
      >
        <motion.div
          className='relative w-full max-w-2xl bg-void-black border-4 border-toxic-green shadow-[0_0_30px_var(--color-toxic-green-20)] p-6 max-h-[90vh] overflow-y-auto'
          variants={modalVariants}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex justify-between items-center mb-6 border-b border-toxic-green pb-2'>
            <h2 className='text-3xl font-[Metal_Mania] text-toxic-green tracking-wider drop-shadow-[0_0_8px_var(--color-toxic-green)]'>
              {t('ui:quests.title')}
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='text-ash-gray hover:text-blood-red transition-colors p-2'
              aria-label={t('ui:quests.closeButton')}
            >
              <svg
                className='w-6 h-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                aria-hidden='true'
                focusable='false'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Quests List */}
          {activeQuests.length === 0 ? (
            <div className='text-center py-12'>
              <IconTrophy className='w-16 h-16 mx-auto text-ash-gray/20 mb-4' />
              <p className='text-ash-gray font-mono italic'>
                {t('ui:quests.empty')}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {activeQuests.map((quest, index) => {
                const isOverdue = quest.deadline && player.day > quest.deadline

                // Safe progress calculation
                let progressPercent = 0
                if (typeof quest.required === 'number' && quest.required > 0) {
                  progressPercent = Math.round(
                    (quest.progress / quest.required) * 100
                  )
                }
                progressPercent = Math.max(
                  0,
                  Math.min(
                    100,
                    Number.isFinite(progressPercent) ? progressPercent : 0
                  )
                )

                const timeRemaining = quest.deadline
                  ? Math.max(0, quest.deadline - player.day)
                  : null

                return (
                  <motion.div
                    key={quest.id}
                    variants={questItemVariants}
                    initial='hidden'
                    animate='visible'
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border-l-4 ${isOverdue ? 'border-blood-red' : 'border-toxic-green'} bg-ash-gray/5`}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <h3 className='text-xl font-bold text-star-white uppercase tracking-wide'>
                        {t(quest.label)}
                      </h3>
                      {timeRemaining !== null && (
                        <div
                          className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded ${timeRemaining <= 2 ? 'bg-blood-red/20 text-blood-red' : 'bg-fuel-yellow/10 text-fuel-yellow'}`}
                        >
                          <IconClock className='w-3 h-3' />
                          <span>
                            {timeRemaining}{' '}
                            {timeRemaining === 1
                              ? t('ui:quests.days.singular')
                              : t('ui:quests.days.plural')}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className='text-sm text-ash-gray mb-4 font-mono'>
                      {t(quest.description)}
                    </p>

                    <div className='mb-3'>
                      <div className='flex justify-between text-xs text-ash-gray mb-1 font-mono'>
                        <span>{t('ui:quests.progress')}</span>
                        <span>
                          {quest.progress} / {quest.required}
                        </span>
                      </div>
                      <ProgressBar
                        value={progressPercent}
                        max={100}
                        color='bg-toxic-green'
                        size='md'
                      />
                    </div>

                    <div className='flex flex-wrap gap-2 mt-4 pt-3 border-t border-ash-gray/10'>
                      <span className='text-xs text-ash-gray uppercase font-bold mr-2 self-center'>
                        {t('ui:quests.rewards')}
                      </span>

                      {quest.moneyReward > 0 && (
                        <span className='inline-flex items-center gap-1 bg-fuel-yellow/10 text-fuel-yellow px-2 py-1 text-xs font-mono rounded'>
                          <IconCoin className='w-3 h-3' />{' '}
                          {t('ui:quests.moneyReward', {
                            amount: formatNumber(
                              quest.moneyReward,
                              i18n?.language
                            )
                          })}
                        </span>
                      )}

                      {quest.rewardType && (
                        <span className='inline-flex items-center gap-1 bg-toxic-green/10 text-toxic-green px-2 py-1 text-xs font-mono rounded'>
                          {getRewardIcon(quest.rewardType)}
                          {getRewardText(quest, t)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className='mt-8 flex justify-center'>
            <GlitchButton variant='primary' size='md' onClick={onClose}>
              {t('ui:quests.closeLabel')}
            </GlitchButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

QuestsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  activeQuests: PropTypes.array.isRequired,
  player: PropTypes.object.isRequired
}
