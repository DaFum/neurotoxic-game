import { motion } from 'framer-motion'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
import { usePostGigLogic } from '../hooks/usePostGigLogic.js'

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
      <div className='w-full h-full flex flex-col items-center justify-center bg-void-black'>
        <div className="text-3xl text-toxic-green font-['Metal_Mania'] animate-pulse tracking-widest">
          {t('ui:postGig.tallyingReceipts', {
            defaultValue: 'TALLYING RECEIPTS...'
          })}
        </div>
      </div>
    )

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-void-black text-star-white relative'>
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.POST_GIG_BG)}")`
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-4xl w-full border-4 border-toxic-green p-8 bg-void-black relative z-10 shadow-[0_0_50px_var(--color-toxic-green-glow)] flex flex-col gap-6'
      >
        <h2 className="text-5xl text-center font-['Metal_Mania'] text-toxic-green mb-2 text-shadow-[0_0_10px_var(--color-toxic-green)]">
          {t(phaseTitleKey, { defaultValue: phaseTitleDefault })}
        </h2>

        <Suspense
          fallback={
            <div className="text-toxic-green font-['Metal_Mania'] text-xl animate-pulse text-center">
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

          {phase === 'COMPLETE' && (
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

export default PostGig
