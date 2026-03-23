import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen.js'
import { SideEffectsSummary } from './SideEffectsSummary'

export const CompletePhase = ({
  result,
  onContinue,
  onSpinStory,
  player,
  social
}) => {
  const { t, i18n } = useTranslation()
  const hasPR = player?.hqUpgrades?.includes('pr_manager_contract')
  const isHighControversy = (social?.controversyLevel || 0) > 50

  const getOutcomeImagePrompt = () => {
    if (result.success) {
      return IMG_PROMPTS.GIG_SUCCESS || IMG_PROMPTS.SOCIAL_POST_VIRAL
    } else if (result.platform === 'tiktok') {
      return IMG_PROMPTS.SOCIAL_POST_LIFESTYLE
    } else {
      return IMG_PROMPTS.GIG_FAILURE || IMG_PROMPTS.SOCIAL_POST_DRAMA
    }
  }

  return (
    <div className='relative min-h-[400px] flex flex-col items-center justify-center p-8 border border-ash-gray/20 rounded overflow-hidden'>
      {/* Background Image Watermark */}
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen pointer-events-none z-0'
        style={{
          backgroundImage: `url("${getGenImageUrl(getOutcomeImagePrompt())}")`
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='text-center py-4 relative z-10'
      >
        <motion.h3
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className={`text-4xl font-display mb-4 ${
            result.success
              ? 'text-toxic-green drop-shadow-[0_0_20px_var(--color-toxic-green)] animate-neon-flicker'
              : 'text-blood-red'
          }`}
        >
          {result.success
            ? t('ui:postGig.viralHit', { defaultValue: 'VIRAL HIT!' })
            : t('ui:postGig.flop', { defaultValue: 'FLOPOCOLYPSE' })}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='mb-6 text-ash-gray font-mono max-w-md mx-auto'
        >
          {result.message}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`text-3xl font-bold mb-8 tabular-nums font-mono ${
            result.totalFollowers > 0 ? 'text-toxic-green' : 'text-blood-red'
          }`}
        >
          {result.totalFollowers > 0 ? '+' : ''}
          {result.totalFollowers}{' '}
          {t('ui:postGig.followers', { defaultValue: 'Followers' })}
          <div className='text-sm text-ash-gray/60 mt-1 font-normal tracking-wider'>
            {t(`ui:postGig.platforms.${result.platform}`, {
              defaultValue: result.platform
            })}
          </div>
        </motion.div>

        <SideEffectsSummary result={result} i18n={i18n} t={t} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className='flex flex-col gap-4 items-center'
        >
          {hasPR && isHighControversy && onSpinStory && (
            <ActionButton
              onClick={onSpinStory}
              className='bg-blood-red text-star-white px-6 py-2 border-2 border-blood-red hover:bg-star-white hover:text-blood-red'
            >
              {t('ui:postGig.spinStory', {
                defaultValue: 'Spin Story (-200€, -25 Controversy)'
              })}
            </ActionButton>
          )}

          <ActionButton
            onClick={onContinue}
            variant='primary'
            className='px-8 py-3 text-void-black'
          >
            {t('ui:postGig.backToTour', { defaultValue: 'Back to Tour >' })}
          </ActionButton>
        </motion.div>
      </motion.div>
    </div>
  )
}

CompletePhase.propTypes = {
  result: PropTypes.shape({
    success: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    totalFollowers: PropTypes.number.isRequired,
    platform: PropTypes.string.isRequired,
    moneyChange: PropTypes.number,
    harmonyChange: PropTypes.number,
    controversyChange: PropTypes.number,
    loyaltyChange: PropTypes.number,
    staminaChange: PropTypes.number,
    moodChange: PropTypes.number,
    targetMember: PropTypes.string
  }).isRequired,
  onContinue: PropTypes.func.isRequired,
  onSpinStory: PropTypes.func,
  player: PropTypes.object,
  social: PropTypes.object
}
