import { formatCurrency } from '../../utils/numberUtils'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'
import { IMG_PROMPTS, resolveGenImageUrl } from '../../utils/imageGen'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import {
  SPIN_STORY_MONEY_COST,
  SPIN_STORY_CONTROVERSY_REDUCTION
} from '../../utils/postGigUtils'
import { SideEffectsSummary } from './SideEffectsSummary'
import type { CompletePhaseProps } from '../../types/components'

const UNKNOWN_PLATFORM = 'unknown'

/**
 * Shows the post-gig social outcome and optional PR recovery action before continuing.
 * @param props - Post result, player/social state, story-spin and continue handlers, and action-processing state.
 */
export const CompletePhase = ({
  result,
  onContinue,
  onSpinStory,
  player,
  social,
  pedalHarmonyPenalty = 0,
  isProcessingAction = false,
  hasSpun = false
}: CompletePhaseProps) => {
  const { t, i18n } = useTranslation()
  const isOnline = useNetworkStatus()
  const hasPR = player?.hqUpgrades?.includes('pr_manager_contract')
  const isHighControversy = (social?.controversyLevel ?? 0) > 50

  const getOutcomeImagePrompt = () => {
    if (result.success === true) {
      return IMG_PROMPTS.GIG_SUCCESS
    } else if ((result.platform ?? '') === 'tiktok') {
      return IMG_PROMPTS.SOCIAL_POST_LIFESTYLE
    } else {
      return IMG_PROMPTS.GIG_FAILURE
    }
  }

  return (
    <div
      data-testid='post-gig-complete'
      className='relative min-h-80 sm:min-h-96 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 border-2 border-ash-gray/40 overflow-hidden'
    >
      {/* Background Image Watermark */}
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen pointer-events-none z-0'
        style={{
          backgroundImage: `url("${resolveGenImageUrl(getOutcomeImagePrompt(), isOnline)}")`
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='text-center py-2 sm:py-4 relative z-10 w-full max-w-xl'
      >
        <motion.h3
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className={`text-3xl sm:text-4xl font-display mb-3 sm:mb-4 break-words ${
            result.success === true
              ? 'text-toxic-green drop-shadow-[0_0_20px_var(--color-toxic-green)] animate-neon-flicker'
              : 'text-blood-red'
          }`}
        >
          {result.success === true
            ? t('ui:postGig.viralHit', { defaultValue: 'VIRAL HIT!' })
            : t('ui:postGig.flop', { defaultValue: 'FLOPOCOLYPSE' })}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='mb-4 sm:mb-6 text-ash-gray font-mono max-w-md mx-auto break-words'
        >
          {result.message ?? ''}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 tabular-nums font-mono break-words ${
            (result.totalFollowers ?? 0) > 0
              ? 'text-toxic-green'
              : 'text-blood-red'
          }`}
        >
          {(result.totalFollowers ?? 0) > 0 ? '+' : ''}
          {result.totalFollowers ?? 0}{' '}
          {t('ui:postGig.followers', { defaultValue: 'Followers' })}
          <div className='text-sm text-ash-gray/60 mt-1 font-normal tracking-wider'>
            {t(`ui:postGig.platforms.${result.platform ?? UNKNOWN_PLATFORM}`, {
              defaultValue: result.platform ?? UNKNOWN_PLATFORM
            })}
          </div>
        </motion.div>

        {pedalHarmonyPenalty > 0 ? (
          <div className='mb-4 font-mono text-sm text-blood-red'>
            ⚠️{' '}
            {t('ui:postGig.pedalHarmonyWarning', {
              penalty: pedalHarmonyPenalty,
              defaultValue: `NEUROTOXIC PEDAL: -${pedalHarmonyPenalty} Harmony on continue`
            })}
          </div>
        ) : null}

        <SideEffectsSummary result={result} i18n={i18n} t={t} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className='flex w-full flex-col gap-3 sm:gap-4 items-stretch sm:items-center'
        >
          {hasPR && isHighControversy && onSpinStory && (
            <ActionButton
              onClick={onSpinStory}
              disabled={isProcessingAction || hasSpun}
              className='w-full sm:w-auto min-h-11 bg-blood-red text-star-white px-6 py-2 border-2 border-blood-red hover:bg-star-white hover:text-blood-red disabled:opacity-50'
            >
              {t('ui:postGig.spinStory', {
                cost: formatCurrency(
                  -SPIN_STORY_MONEY_COST,
                  i18n.language,
                  'always'
                ),
                controversy: SPIN_STORY_CONTROVERSY_REDUCTION,
                defaultValue: `Spin Story (${formatCurrency(-SPIN_STORY_MONEY_COST, i18n.language, 'always')}, -${SPIN_STORY_CONTROVERSY_REDUCTION} Controversy)`
              })}
            </ActionButton>
          )}

          <ActionButton
            onClick={onContinue}
            disabled={isProcessingAction}
            className='w-full sm:w-auto min-h-11 px-6 sm:px-8 py-3 text-void-black disabled:opacity-50'
          >
            {isProcessingAction
              ? t('ui:postGig.processing', { defaultValue: 'Processing...' })
              : t('ui:postGig.backToTour', { defaultValue: 'Back to Tour >' })}
          </ActionButton>
        </motion.div>
      </motion.div>
    </div>
  )
}
