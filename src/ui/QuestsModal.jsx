import PropTypes from 'prop-types'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from './shared/index.jsx'
import { GlitchButton } from './GlitchButton.jsx'
import { useTranslation } from 'react-i18next'
import { useId } from 'react'

// Helper component for accessible SVGs
const BaseIcon = ({ className = '', viewBox = '0 0 24 24', title, children, ...props }) => {
  const titleId = useId()
  return (
    <svg
      aria-hidden={!title}
      focusable={title ? undefined : 'false'}
      role={title ? 'img' : 'presentation'}
      aria-labelledby={title ? titleId : undefined}
      {...props}
      className={className}
      viewBox={viewBox}
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='xMidYMid meet'
    >
      {title && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  )
}

const IconStar = ({ className = '', title }) => (
  <BaseIcon className={className} title={title}><path d="M11.999 1.439l2.844 7.218 7.718.666-5.859 5.093 1.764 7.584-6.467-3.968-6.467 3.968 1.764-7.584-5.859-5.093 7.718-.666 2.844-7.218z" /></BaseIcon>
)
const IconClock = ({ className = '', title }) => (
  <BaseIcon className={className} title={title} fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></BaseIcon>
)
const IconTrophy = ({ className = '', title }) => (
  <BaseIcon className={className} title={title}><path d="M21 4h-3V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1H3a1 1 0 00-1 1v3c0 2.2 1.8 4 4 4h1v1.6c0 1.9 1.5 3.4 3.4 3.4H9v3a1 1 0 001 1h4a1 1 0 001-1v-3h-1.4c1.9 0 3.4-1.5 3.4-3.4V12h1c2.2 0 4-1.8 4-4V5a1 1 0 00-1-1zM6 10c-1.1 0-2-.9-2-2V6h2v4zm14-2c0 1.1-.9 2-2 2h-2V6h2v2z" /></BaseIcon>
)
const IconFire = ({ className = '', title }) => (
  <BaseIcon className={className} title={title}><path d="M12 2C8 6 4 9 4 14a8 8 0 0016 0c0-5-4-8-8-12zm1 14a3 3 0 11-6 0c0-2 2-4 3-5 1 1 3 3 3 5z" /></BaseIcon>
)
const IconThumbUp = ({ className = '', title }) => (
  <BaseIcon className={className} title={title}><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.3c1.4 0 2.6-1 2.8-2.3l2-11c.1-.8-.5-1.7-1.4-1.7H14zM4 11H1v11h3V11z" /></BaseIcon>
)
const IconCube = ({ className = '', title }) => (
  <BaseIcon className={className} title={title}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></BaseIcon>
)

// Map a reward type to an icon
const getRewardIcon = (type) => {
  switch (type) {
    case 'item': return <IconCube className="w-4 h-4 text-(--toxic-green)" />
    case 'fans': return <IconStar className="w-4 h-4 text-(--stamina-green)" />
    case 'skill_point': return <IconFire className="w-4 h-4 text-(--blood-red)" />
    case 'harmony': return <IconThumbUp className="w-4 h-4 text-(--toxic-green)" />
    default: return <IconTrophy className="w-4 h-4 text-(--fuel-yellow)" />
  }
}

export const QuestsModal = ({ onClose, activeQuests, player }) => {
  const { t } = useTranslation(['ui', 'events'])

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
  }

  const questItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  }

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 z-[100] flex items-center justify-center bg-(--void-black)/80 p-4'
        variants={overlayVariants}
        initial='hidden'
        animate='visible'
        exit='hidden'
      >
        <motion.div
          className='relative w-full max-w-2xl bg-(--void-black) border-4 border-(--toxic-green) shadow-[0_0_30px_var(--toxic-green-20)] p-6 max-h-[90vh] overflow-y-auto'
          variants={modalVariants}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex justify-between items-center mb-6 border-b border-(--toxic-green) pb-2'>
            <h2 className='text-3xl font-[Metal_Mania] text-(--toxic-green) tracking-wider drop-shadow-[0_0_8px_var(--toxic-green)]'>
              {t('ui:quests.title', { defaultValue: 'ACTIVE QUESTS' })}
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='text-(--ash-gray) hover:text-(--blood-red) transition-colors p-2'
              aria-label='Close Quests'
            >
              <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          {/* Quests List */}
          {activeQuests.length === 0 ? (
            <div className='text-center py-12'>
              <IconTrophy className="w-16 h-16 mx-auto text-(--ash-gray)/20 mb-4" />
              <p className='text-(--ash-gray) font-mono italic'>
                {t('ui:quests.empty', { defaultValue: 'No active quests. Hit the road to find some!' })}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {activeQuests.map((quest, index) => {
                const isOverdue = quest.deadline && player.day > quest.deadline
                const progressPercent = Math.min(100, Math.round((quest.progress / quest.required) * 100))
                const timeRemaining = quest.deadline ? Math.max(0, quest.deadline - player.day) : null

                return (
                  <motion.div
                    key={quest.id}
                    variants={questItemVariants}
                    initial='hidden'
                    animate='visible'
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border-l-4 ${isOverdue ? 'border-(--blood-red)' : 'border-(--toxic-green)'} bg-(--ash-gray)/5`}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <h3 className='text-xl font-bold text-(--star-white) uppercase tracking-wide'>
                        {t(`events:${quest.id}.title`, { defaultValue: quest.label })}
                      </h3>
                      {timeRemaining !== null && (
                        <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded ${timeRemaining <= 2 ? 'bg-(--blood-red)/20 text-(--blood-red)' : 'bg-(--fuel-yellow)/10 text-(--fuel-yellow)'}`}>
                          <IconClock className="w-3 h-3" />
                          <span>{timeRemaining} {timeRemaining === 1 ? t('ui:quests.days.singular') : t('ui:quests.days.plural')}</span>
                        </div>
                      )}
                    </div>

                    <p className='text-sm text-(--ash-gray) mb-4 font-mono'>
                      {t(`events:${quest.id}.desc`, { defaultValue: quest.description })}
                    </p>

                    <div className='mb-3'>
                      <div className='flex justify-between text-xs text-(--ash-gray) mb-1 font-mono'>
                        <span>{t('ui:quests.progress')}</span>
                        <span>{quest.progress} / {quest.required}</span>
                      </div>
                      <ProgressBar
                        value={progressPercent}
                        max={100}
                        color='bg-(--toxic-green)'
                        size='md'
                      />
                    </div>

                    <div className='flex flex-wrap gap-2 mt-4 pt-3 border-t border-(--ash-gray)/10'>
                      <span className='text-xs text-(--ash-gray) uppercase font-bold mr-2 self-center'>{t('ui:quests.rewards')}</span>

                      {quest.moneyReward > 0 && (
                        <span className='inline-flex items-center gap-1 bg-(--fuel-yellow)/10 text-(--fuel-yellow) px-2 py-1 text-xs font-mono rounded'>
                          <IconTrophy className="w-3 h-3" /> +{quest.moneyReward}€
                        </span>
                      )}

                      {quest.rewardType && (
                        <span className='inline-flex items-center gap-1 bg-(--toxic-green)/10 text-(--toxic-green) px-2 py-1 text-xs font-mono rounded'>
                          {getRewardIcon(quest.rewardType)}
                          {quest.rewardType === 'item' ? t('ui:rewards.freeItem') :
                           quest.rewardType === 'fans' ? `+${quest.rewardData?.fame || 0} ${t('ui:rewards.fans')}` :
                           quest.rewardType === 'skill_point' ? `+1 ${t('ui:rewards.skillPoint')}` :
                           quest.rewardType === 'harmony' ? `+${quest.rewardData?.harmony || 0} ${t('ui:rewards.harmony')}` : t('ui:rewards.special')}
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
              [CLOSE]
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
