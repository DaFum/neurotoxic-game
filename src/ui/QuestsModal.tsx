import {
  IconChevronDown,
  IconChevronUp,
  IconStar,
  IconClock,
  IconTrophy,
  IconCoin,
  IconFire,
  IconThumbUp,
  IconCube
} from './shared/Icons'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { ProgressBar } from './shared/index.tsx'
import { GlitchButton } from './GlitchButton.tsx'
import { Modal } from './shared/Modal'
import { useTranslation } from 'react-i18next'
import {
  deadlineCount,
  getQuestDeadlineView,
  getQuestNextStepHint,
  getQuestPrimaryHint,
  getQuestScopeHint,
  type QuestDisplayState
} from './questHintViewModel'
import { memo, useState } from 'react'
import { formatCurrency } from '../utils/numberUtils'
import { getQuestDefinition } from '../data/questRegistry'
import { getQuestPenalties } from '../domain/questPenalties'
import { getQuestRewards } from '../domain/questRewards'
import type { Variants } from 'motion/react'
import type { PlayerState, QuestReward } from '../types'

const getRewardText = (
  reward: QuestReward,
  t: (key: string, options?: Record<string, unknown>) => string,
  language: string
) => {
  switch (reward.type) {
    case 'item.add':
      return t('ui:rewards.freeItem')
    case 'fame':
      return t('ui:rewards.fameWithAmount', { count: reward.amount })
    case 'social.followers':
      return t('ui:rewards.fansWithAmount', { count: reward.amount })
    case 'money':
      return t('ui:quests.moneyReward', {
        amount: formatCurrency(reward.amount, language, 'always')
      })
    case 'skill_point':
      return t('ui:rewards.skillPointWithAmount', { count: 1 })
    case 'band.harmony':
      return t('ui:rewards.harmonyWithAmount', { count: reward.amount })
    case 'social.loyalty':
      return t('ui:rewards.loyaltyWithAmount', { count: reward.amount })
    case 'social.controversy':
      return t('ui:rewards.controversyReduction', {
        count: Math.abs(reward.amount)
      })
    default:
      return t('ui:rewards.special')
  }
}

// Map a reward type to an icon
const getRewardIcon = (type: string) => {
  switch (type) {
    case 'item.add':
      return <IconCube className='w-4 h-4 text-toxic-green' />
    case 'fame':
    case 'social.followers':
      return <IconStar className='w-4 h-4 text-stamina-green' />
    case 'skill_point':
      return <IconFire className='w-4 h-4 text-error-red' />
    case 'band.harmony':
    case 'social.loyalty':
      return <IconThumbUp className='w-4 h-4 text-toxic-green' />
    case 'social.controversy':
      return <IconThumbUp className='w-4 h-4 text-stamina-green' />
    case 'money':
      return <IconCoin className='w-4 h-4 text-fuel-yellow' />
    default:
      return <IconTrophy className='w-4 h-4 text-fuel-yellow' />
  }
}

// Human-readable failure-penalty chips derived from the quest's penalty config.
const getPenaltyTexts = (
  quest: QuestDisplayState,
  t: (key: string, options?: Record<string, unknown>) => string
): string[] => {
  return getQuestPenalties(quest)
    .map(penalty => {
      if (!('amount' in penalty) || penalty.amount === 0) return ''
      switch (penalty.type) {
        case 'band.harmony':
          return t('ui:quests.penalty.harmony', { count: penalty.amount })
        case 'social.controversy':
          return t('ui:quests.penalty.controversy', { count: penalty.amount })
        case 'social.loyalty':
          return t('ui:quests.penalty.loyalty', { count: penalty.amount })
        default:
          return ''
      }
    })
    .filter(Boolean)
}

// Display order: story first, then by ascending deadline (no deadline last),
// then repeatables. Stable for equal keys so React doesn't churn.
const KIND_RANK: Record<string, number> = {
  story: 0,
  side: 1,
  repeatable: 2,
  tutorial: 3
}
const sortQuests = (quests: QuestDisplayState[]): QuestDisplayState[] =>
  [...quests].sort((a, b) => {
    const rankA = KIND_RANK[a.kind ?? 'side'] ?? 1
    const rankB = KIND_RANK[b.kind ?? 'side'] ?? 1
    if (rankA !== rankB) return rankA - rankB
    const da = a.deadline ?? Number.POSITIVE_INFINITY
    const db = b.deadline ?? Number.POSITIVE_INFINITY
    return da - db
  })

const questItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

const QuestItem = memo(
  ({
    quest,
    index,
    player,
    variants
  }: {
    quest: QuestDisplayState
    index: number
    player: PlayerState
    variants: Variants
  }) => {
    const { t, i18n } = useTranslation(['ui', 'events'])
    const [showDetails, setShowDetails] = useState(false)

    const currentDay = player?.day ?? 1
    const deadlineView = getQuestDeadlineView(quest, currentDay)
    const isOverdue = deadlineView.level === 'overdue'

    const safeProgress = quest.progress ?? 0
    const safeRequired = quest.required ?? 0

    // Safe progress calculation
    let progressPercent = 0
    if (safeRequired > 0) {
      progressPercent = Math.round((safeProgress / safeRequired) * 100)
    }
    progressPercent = Math.max(
      0,
      Math.min(100, Number.isFinite(progressPercent) ? progressPercent : 0)
    )

    const rewardChips = getQuestRewards(quest)
    const penaltyTexts = getPenaltyTexts(quest, t)

    const nextStepHint = getQuestNextStepHint(quest, t)
    const scopeHint = getQuestScopeHint(quest, player)
    const primaryHint = getQuestPrimaryHint({
      deadlineView,
      scopeHint,
      nextStepHint,
      t
    })

    const hasUrgentDeadline =
      deadlineView.level === 'urgent' ||
      deadlineView.level === 'lastChance' ||
      deadlineView.level === 'today' ||
      deadlineView.level === 'overdue'

    return (
      <m.div
        key={quest.id}
        variants={variants}
        initial='hidden'
        animate='visible'
        transition={{ delay: index * 0.1 }}
        className={`p-4 border-l-4 ${isOverdue ? 'border-blood-red' : 'border-toxic-green'} bg-ash-gray/5 flex flex-col gap-3`}
      >
        {/* 1. Titel + Kategorie + Repeat/Scope-Chips */}
        <div className='flex justify-between items-start'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-xl font-bold text-star-white uppercase tracking-wide'>
              {quest.label ? t(quest.label) : ''}
            </h3>
            <div className='flex flex-wrap gap-1'>
              {quest.kind && (
                <span className='inline-block bg-toxic-green/10 text-toxic-green px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide'>
                  {t(`ui:quests.kind.${quest.kind}`)}
                </span>
              )}
              {quest.repeatPolicy && (
                <span className='inline-block bg-ash-gray/10 text-ash-gray px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide'>
                  {quest.repeatPolicy === 'never'
                    ? t('ui:quests.oneTime')
                    : t('ui:quests.repeatable')}
                </span>
              )}
              {quest.scopeKey && (
                <span className='inline-block bg-fuel-yellow/10 text-fuel-yellow px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide'>
                  {t(
                    quest.repeatPolicy === 'perVenue'
                      ? 'ui:quests.scope.venue'
                      : 'ui:quests.scope.region',
                    { scope: quest.scopeKey }
                  )}
                </span>
              )}
            </div>
          </div>
          {deadlineView.level !== 'none' && (
            <div
              className={`flex items-center gap-1 text-xs font-mono px-2 py-1 ${hasUrgentDeadline ? 'bg-error-red/20 text-error-red' : 'bg-fuel-yellow/10 text-fuel-yellow'}`}
            >
              <IconClock className='w-3 h-3' />
              <span>
                {deadlineView.text
                  ? t(deadlineView.text, deadlineCount(deadlineView))
                  : ''}
              </span>
            </div>
          )}
        </div>

        {/* 2. Statuszeile: Was ist gerade wichtig? */}
        {primaryHint && (
          <div
            className={`text-sm font-mono flex items-center gap-2 p-2 rounded ${
              primaryHint.type === 'error'
                ? 'bg-blood-red/10 text-blood-red border border-blood-red/20'
                : primaryHint.type === 'warning'
                  ? 'bg-fuel-yellow/10 text-fuel-yellow border border-fuel-yellow/20'
                  : 'bg-toxic-green/5 text-toxic-green/90'
            }`}
          >
            <span className='font-bold'>{t('ui:quests.hint.nextLabel')}</span>{' '}
            {primaryHint.text}
          </div>
        )}

        {/* 3. Progressbar + Fortschrittswert */}
        <div>
          <div className='flex justify-between text-xs text-ash-gray mb-1 font-mono'>
            <span>
              {safeProgress} / {safeRequired}
            </span>
          </div>
          <ProgressBar
            value={progressPercent}
            max={100}
            color='bg-toxic-green'
            size='md'
          />
        </div>

        {/* 4. Rewards und Penalties */}
        <div className='flex flex-wrap gap-2 mt-1 pt-2 border-t border-ash-gray/10'>
          {rewardChips.map((reward, rewardIndex) => (
            <span
              key={`reward-${reward.type}-${rewardIndex}`} /* eslint-disable-line @eslint-react/no-array-index-key */
              className='inline-flex items-center gap-1 bg-toxic-green/10 text-toxic-green px-2 py-1 text-xs font-mono '
            >
              {getRewardIcon(reward.type)}
              {getRewardText(reward, t, i18n.language)}
            </span>
          ))}

          {penaltyTexts.map(text => (
            <span
              key={text}
              className='inline-flex items-center gap-1 bg-blood-red/10 text-blood-red px-2 py-1 text-xs font-mono'
            >
              {text}
            </span>
          ))}
        </div>

        {/* Optionaler Details-Toggle */}
        <div className='mt-2'>
          <button
            type='button'
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls={`quest-details-${quest.id}`}
            aria-label={
              showDetails
                ? t('ui:quests.details.hideAria', {
                    quest: quest.label ? t(quest.label) : '',
                    defaultValue:
                      'Hide details for ' +
                      (quest.label ? t(quest.label) : 'quest')
                  })
                : t('ui:quests.details.showAria', {
                    quest: quest.label ? t(quest.label) : '',
                    defaultValue:
                      'Show details for ' +
                      (quest.label ? t(quest.label) : 'quest')
                  })
            }
            className='min-w-11 min-h-11 text-xs text-ash-gray/70 hover:text-toxic-green font-mono flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          >
            {showDetails ? (
              <IconChevronUp className='w-3 h-3' />
            ) : (
              <IconChevronDown className='w-3 h-3' />
            )}
            {showDetails
              ? t('ui:quests.details.hide')
              : t('ui:quests.details.show')}
          </button>

          <AnimatePresence>
            {showDetails && (
              <m.div
                id={`quest-details-${quest.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className='overflow-hidden'
              >
                <div className='pt-3 pb-1 text-xs text-ash-gray/90 font-mono space-y-2'>
                  <p className='font-bold text-ash-gray'>
                    {t('ui:quests.details.title')}
                  </p>
                  <p>{quest.description ? t(quest.description) : ''}</p>
                  {quest.progressSource && (
                    <p className='italic text-toxic-green/70'>
                      {quest.progressSource === 'harmony_recovered' &&
                      typeof quest.required === 'number' &&
                      quest.required > 1
                        ? t('ui:quests.progressSource.harmony_threshold', {
                            target: quest.required
                          })
                        : t(`ui:quests.progressSource.${quest.progressSource}`)}
                    </p>
                  )}
                  {quest.repeatPolicy === 'cooldown' &&
                    typeof quest.cooldownDays === 'number' &&
                    quest.cooldownDays > 0 && (
                      <p>
                        {t('ui:quests.repeatableAfter', {
                          count: quest.cooldownDays
                        })}
                      </p>
                    )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>
    )
  }
)

/**
 * Displays active quest progress, deadlines, rewards, and close controls.
 * @param props - Quest list, player context, and close handler for the quest modal.
 */
export const QuestsModal = ({
  onClose,
  activeQuests,
  player
}: {
  onClose: () => void
  activeQuests: QuestDisplayState[]
  player: PlayerState
}) => {
  const { t } = useTranslation(['ui', 'events'])
  const displayQuests = activeQuests.map(quest => {
    const definition = getQuestDefinition(quest.id)
    return definition ? { ...definition, ...quest } : quest
  })

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel={t('ui:quests.title')}
      className='max-w-4xl'
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-6 border-b border-toxic-green pb-2'>
        <h2 className='text-3xl font-display text-toxic-green tracking-wider drop-shadow-[0_0_8px_var(--color-toxic-green)]'>
          {t('ui:quests.title')}
        </h2>
      </div>

      {/* Quests List */}
      {displayQuests.length === 0 ? (
        <div className='text-center py-12 flex flex-col items-center'>
          <IconTrophy className='w-16 h-16 mx-auto text-ash-gray/20 mb-4' />
          <p className='text-ash-gray font-mono italic mb-6'>
            {t('ui:quests.empty')}
          </p>
        </div>
      ) : (
        <div className='space-y-6'>
          {sortQuests(displayQuests).map(
            (quest: QuestDisplayState, index: number) => (
              <QuestItem
                key={quest.id}
                quest={quest}
                index={index}
                player={player}
                variants={questItemVariants}
              />
            )
          )}
        </div>
      )}

      {/* Footer */}
      <div className='mt-8 flex justify-center'>
        <GlitchButton variant='primary' onClick={onClose}>
          {t('ui:quests.closeLabel', { defaultValue: '[CLOSE]' })}
        </GlitchButton>
      </div>
    </Modal>
  )
}
