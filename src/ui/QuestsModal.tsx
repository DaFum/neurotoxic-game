import { IconClose, IconChevronDown, IconChevronUp } from './shared/Icons'
import { motion, AnimatePresence } from 'framer-motion'
import { ProgressBar } from './shared/index.tsx'
import { GlitchButton } from './GlitchButton.tsx'
import { useTranslation } from 'react-i18next'
import { getRegionKeyForLocation } from '../utils/mapUtils'
import { useId, memo, useState, type MouseEvent, type ReactNode } from 'react'
import { formatCurrency } from '../utils/numberUtils'
import { getQuestDefinition } from '../data/questRegistry'
import { getQuestPenalties } from '../domain/questPenalties'
import { getQuestRewards } from '../domain/questRewards'
import type { Variants } from 'framer-motion'
import type { PlayerState, QuestReward, QuestState } from '../types'

type IconProps = {
  className?: string
  title?: string
  fill?: string
  stroke?: string
}

// Helper component for accessible SVGs
const BaseIcon = memo(
  ({
    className = '',
    viewBox = '0 0 24 24',
    title,
    fill = 'currentColor',
    children,
    ...props
  }: {
    className?: string
    viewBox?: string
    title?: string
    fill?: string
    children?: ReactNode
    stroke?: string
    [key: string]: unknown
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

const makeIcon = (
  children: ReactNode,
  extraBaseProps: Partial<{ fill: string; stroke: string }> = {}
) =>
  memo(({ className = '', title }: IconProps) => (
    <BaseIcon className={className} title={title} {...extraBaseProps}>
      {children}
    </BaseIcon>
  ))

const IconStar = makeIcon(
  <path d='M11.999 1.439l2.844 7.218 7.718.666-5.859 5.093 1.764 7.584-6.467-3.968-6.467 3.968 1.764-7.584-5.859-5.093 7.718-.666 2.844-7.218z' />
)
const IconClock = makeIcon(
  <path
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
  />,
  { fill: 'none', stroke: 'currentColor' }
)
const IconTrophy = makeIcon(
  <path d='M21 4h-3V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1H3a1 1 0 00-1 1v3c0 2.2 1.8 4 4 4h1v1.6c0 1.9 1.5 3.4 3.4 3.4H9v3a1 1 0 001 1h4a1 1 0 001-1v-3h-1.4c1.9 0 3.4-1.5 3.4-3.4V12h1c2.2 0 4-1.8 4-4V5a1 1 0 00-1-1zM6 10c-1.1 0-2-.9-2-2V6h2v4zm14-2c0 1.1-.9 2-2 2h-2V6h2v2z' />
)
const IconCoin = makeIcon(
  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.26.28 2.62 1.15 2.84 2.99h-1.96c-.15-.97-.9-1.62-2.31-1.62-1.45 0-2.13.79-2.13 1.48 0 .84.53 1.36 2.88 1.9 2.5.58 3.97 1.68 3.97 3.86 0 1.76-1.12 2.89-3.24 3.53z' />
)
const IconFire = makeIcon(
  <path d='M12 2C8 6 4 9 4 14a8 8 0 0016 0c0-5-4-8-8-12zm1 14a3 3 0 11-6 0c0-2 2-4 3-5 1 1 3 3 3 5z' />
)
const IconThumbUp = makeIcon(
  <path d='M14 9V5a3 3 0 00-3-3l-4 9v11h11.3c1.4 0 2.6-1 2.8-2.3l2-11c.1-.8-.5-1.7-1.4-1.7H14zM4 11H1v11h3V11z' />
)
const IconCube = makeIcon(
  <path
    d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
    stroke='currentColor'
    fill='none'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  />
)

type QuestDisplayState = QuestState & {
  description?: string
  moneyReward?: number
}

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

const getRewardIconType = (reward: QuestReward): string => {
  switch (reward.type) {
    case 'item.add':
      return 'item'
    case 'social.followers':
      return 'fans'
    case 'band.harmony':
      return 'harmony'
    case 'social.loyalty':
      return 'loyalty'
    case 'social.controversy':
      return 'controversy_reduction'
    default:
      return reward.type
  }
}

// Map a reward type to an icon
const getRewardIcon = (type: string) => {
  switch (type) {
    case 'item':
      return <IconCube className='w-4 h-4 text-toxic-green' />
    case 'fame':
    case 'fans':
      return <IconStar className='w-4 h-4 text-stamina-green' />
    case 'skill_point':
      return <IconFire className='w-4 h-4 text-error-red' />
    case 'harmony':
    case 'loyalty':
      return <IconThumbUp className='w-4 h-4 text-toxic-green' />
    case 'controversy_reduction':
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
  const texts: string[] = []
  for (const penalty of getQuestPenalties(quest)) {
    switch (penalty.type) {
      case 'band.harmony':
        if (penalty.amount !== 0) {
          texts.push(t('ui:quests.penalty.harmony', { count: penalty.amount }))
        }
        break
      case 'social.controversy':
        if (penalty.amount !== 0) {
          texts.push(
            t('ui:quests.penalty.controversy', { count: penalty.amount })
          )
        }
        break
      case 'social.loyalty':
        if (penalty.amount !== 0) {
          texts.push(t('ui:quests.penalty.loyalty', { count: penalty.amount }))
        }
        break
    }
  }
  return texts
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

export type QuestDeadlineView =
  | { level: 'none'; text: null }
  | { level: 'safe'; text: string; count: number }
  | { level: 'soon'; text: string; count: number }
  | { level: 'urgent'; text: string; count: number }
  | { level: 'lastChance'; text: string }
  | { level: 'today'; text: string }
  | { level: 'overdue'; text: string }

export const getQuestDeadlineView = (
  quest: QuestDisplayState,
  currentDay: number
): QuestDeadlineView => {
  if (quest.deadline == null) return { level: 'none', text: null }

  const timeRemaining = quest.deadline - currentDay

  if (timeRemaining < 0) {
    return { level: 'overdue', text: 'ui:quests.hint.deadline.overdue' }
  }
  if (timeRemaining === 0) {
    return { level: 'today', text: 'ui:quests.hint.deadline.today' }
  }
  if (timeRemaining === 1) {
    return { level: 'lastChance', text: 'ui:quests.hint.deadline.lastChance' }
  }
  if (timeRemaining === 2) {
    return { level: 'urgent', text: 'ui:quests.hint.deadline.urgent', count: 2 }
  }
  if (timeRemaining <= 5) {
    return {
      level: 'soon',
      text: 'ui:quests.hint.deadline.soon',
      count: timeRemaining
    }
  }
  return {
    level: 'safe',
    text: 'ui:quests.hint.deadline.safe',
    count: timeRemaining
  }
}

const deadlineCount = (
  view: QuestDeadlineView
): { count: number } | undefined =>
  'count' in view ? { count: view.count } : undefined

export const getQuestScopeHint = (
  quest: QuestDisplayState,
  player: PlayerState
): {
  matching: boolean
  text: string
  options?: Record<string, unknown>
} | null => {
  if (!quest.scopeKey) return null

  if (quest.repeatPolicy === 'perRegion') {
    const normalizedLocation = player?.location
      ? getRegionKeyForLocation(player.location)
      : undefined
    const isMatching = normalizedLocation === quest.scopeKey
    return {
      matching: isMatching,
      text: isMatching
        ? 'ui:quests.hint.scope.region.matching'
        : 'ui:quests.hint.scope.region.mismatch',
      options: { scope: quest.scopeKey }
    }
  }

  if (quest.repeatPolicy === 'perVenue') {
    // Determine the current venue (gig node id takes precedence, falling back to location if it's a venue)
    const isMatching =
      player?.currentNodeId === quest.scopeKey ||
      player?.location === quest.scopeKey
    return {
      matching: isMatching,
      text: isMatching
        ? 'ui:quests.hint.scope.venue.only'
        : 'ui:quests.hint.scope.venue.mismatch',
      options: { scope: quest.scopeKey }
    }
  }

  return null
}

export const getQuestNextStepHint = (
  quest: QuestDisplayState,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null => {
  if (quest.progressSource) {
    const translatedNextStep = t(
      `ui:quests.hint.nextStep.${quest.progressSource}`,
      { defaultValue: '' }
    )
    if (translatedNextStep) {
      return translatedNextStep
    }
  }
  return t('ui:quests.hint.nextStep.default')
}

export const getQuestPrimaryHint = ({
  deadlineView,
  scopeHint,
  nextStepHint,
  t
}: {
  deadlineView: QuestDeadlineView
  scopeHint: ReturnType<typeof getQuestScopeHint>
  nextStepHint: string | null
  t: (key: string, options?: Record<string, unknown>) => string
}): { text: string; type: 'error' | 'warning' | 'info' | 'success' } | null => {
  // 1. Overdue / heute fällig
  if (deadlineView.level === 'overdue' || deadlineView.level === 'today') {
    return {
      text: t(deadlineView.text, deadlineCount(deadlineView)),
      type: 'error'
    }
  }

  // 2. Falscher Scope
  if (scopeHint && !scopeHint.matching) {
    return {
      text: t(scopeHint.text, scopeHint.options),
      type: 'warning'
    }
  }

  // 3. Deadline bald
  if (deadlineView.level === 'urgent' || deadlineView.level === 'lastChance') {
    return {
      text: t(deadlineView.text, deadlineCount(deadlineView)),
      type: 'warning'
    }
  }

  // 4. Normaler nächster Schritt
  if (nextStepHint) {
    return {
      text: nextStepHint,
      type: 'info'
    }
  }

  return null
}

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
      <motion.div
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
              {getRewardIcon(getRewardIconType(reward))}
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
            className='min-w-[44px] min-h-[44px] text-xs text-ash-gray/70 hover:text-toxic-green font-mono flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
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
              <motion.div
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
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

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
  }

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 z-(--z-modal) flex items-center justify-center bg-void-black/80 backdrop-blur-sm p-4'
        variants={overlayVariants}
        initial='hidden'
        animate='visible'
        exit='hidden'
        onClick={onClose}
      >
        <motion.div
          className='relative w-full max-w-4xl border-4 border-toxic-green p-3 sm:p-6 bg-void-black shadow-[4px_4px_0px_var(--color-toxic-green)] sm:shadow-[8px_8px_0px_var(--color-toxic-green)] max-h-[calc(100svh-4rem)] overflow-y-auto'
          variants={modalVariants}
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex justify-between items-center mb-6 border-b border-toxic-green pb-2'>
            <h2 className='text-3xl font-display text-toxic-green tracking-wider drop-shadow-[0_0_8px_var(--color-toxic-green)]'>
              {t('ui:quests.title')}
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='text-ash-gray hover:text-error-red transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-red focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
              aria-label={t('ui:quests.closeButton')}
            >
              <IconClose />
            </button>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
