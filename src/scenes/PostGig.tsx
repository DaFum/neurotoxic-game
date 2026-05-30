import { motion } from 'framer-motion'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import { usePostGigLogic } from '../hooks/usePostGigLogic'

import { lazy, Suspense } from 'react'
const ReportPhase = lazy(() =>
  import('../components/postGig/ReportPhase').then(m => ({
    default: m.ReportPhase
  }))
)
const SocialPhase = lazy(() =>
  import('../components/postGig/SocialPhase').then(m => ({
    default: m.SocialPhase
  }))
)
const DealsPhase = lazy(() =>
  import('../components/postGig/DealsPhase').then(m => ({
    default: m.DealsPhase
  }))
)
const CompletePhase = lazy(() =>
  import('../components/postGig/CompletePhase').then(m => ({
    default: m.CompletePhase
  }))
)

export const PostGig = () => {
  const {
    t,
    phase,
    financials,
    postOptions,
    postResult,
    brandOffers,
    phaseTitleKey,
    phaseTitleDefault,
    social,
    player,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  } = usePostGigLogic()
  if (!financials)
    return (
      <div className='w-full h-full flex flex-col items-center justify-center bg-void-black px-4 text-center'>
        <div className='text-2xl sm:text-3xl text-toxic-green font-display animate-pulse tracking-widest'>
          {t('ui:postGig.tallyingReceipts', {
            defaultValue: 'TALLYING RECEIPTS...'
          })}
        </div>
      </div>
    )

  return (
    <div
      data-testid='post-gig-screen'
      className='w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 lg:p-8 bg-void-black text-star-white relative'
    >
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none'
        style={{
          backgroundImage: `url("${resolveGenImageUrl(IMG_PROMPTS.POST_GIG_BG)}")`
        }}
      />

      <motion.div
        data-testid='post-gig-panel'
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-4xl w-full max-h-[calc(100svh-1.5rem)] sm:max-h-[calc(100svh-3rem)] border-4 border-toxic-green p-3 sm:p-6 lg:p-8 bg-void-black relative z-10 shadow-[0_0_24px_var(--color-toxic-green-glow)] sm:shadow-[0_0_50px_var(--color-toxic-green-glow)] flex flex-col gap-4 sm:gap-6 overflow-y-auto'
      >
        <h2 className='text-3xl sm:text-5xl text-center font-display text-toxic-green mb-1 sm:mb-2 break-words text-shadow-[0_0_10px_var(--color-toxic-green)]'>
          {t(phaseTitleKey, { defaultValue: phaseTitleDefault })}
        </h2>

        <Suspense
          fallback={
            <div className='text-toxic-green font-display text-xl animate-pulse text-center'>
              {t('ui:loading', 'LOADING...')}
            </div>
          }
        >
          {phase === 'REPORT' && (
            <ReportPhase financials={financials} onNext={handleNextPhase} />
          )}

          {phase === 'SOCIAL' && (
            <SocialPhase
              options={postOptions}
              onSelect={handlePostSelection}
              trend={social.trend}
              zealotryLevel={social?.zealotry || 0}
            />
          )}

          {phase === 'DEALS' && (
            <DealsPhase
              offers={brandOffers}
              onAccept={handleAcceptDeal}
              onSkip={handleRejectDeals}
            />
          )}

          {phase === 'COMPLETE' && postResult && (
            <CompletePhase
              result={postResult}
              onContinue={handleContinue}
              onSpinStory={handleSpinStory}
              player={player}
              social={social}
            />
          )}
        </Suspense>
      </motion.div>
    </div>
  )
}
