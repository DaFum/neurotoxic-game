import PropTypes from 'prop-types'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import {
  calculateGigFinancials,
  shouldTriggerBankruptcy
} from '../utils/economyEngine'
import {
  calculateViralityScore,
  generatePostOptions,
  resolvePost,
  calculateSocialGrowth,
  checkViralEvent
} from '../utils/socialEngine'

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 500

export const PostGig = () => {
  const {
    currentGig,
    player,
    updatePlayer,
    gigModifiers,
    triggerEvent,
    activeEvent,
    band,
    updateSocial,
    social,
    lastGigStats,
    addToast,
    changeScene
  } = useGameState()
  const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, COMPLETE
  const [financials, setFinancials] = useState(null)
  const [postOptions, setPostOptions] = useState([])
  const [postResult, setPostResult] = useState(null)

  const perfScore = useMemo(() => {
    const rawScore = lastGigStats?.score || 0
    return Math.min(
      PERF_SCORE_MAX,
      Math.max(PERF_SCORE_MIN, rawScore / PERF_SCORE_SCALER)
    )
  }, [lastGigStats])

  useEffect(() => {
    if (!currentGig) return

    if (!activeEvent) {
      const financialEvent = triggerEvent('financial', 'post_gig')
      if (!financialEvent) {
        const specialEvent = triggerEvent('special', 'post_gig')
        if (!specialEvent) {
          triggerEvent('band', 'post_gig')
        }
      }
    }
  }, [currentGig, activeEvent, triggerEvent])

  // Initialize Results once (simulated)
  useEffect(() => {
    if (!financials && currentGig && lastGigStats) {
      const result = calculateGigFinancials({
        gigData: currentGig,
        performanceScore: perfScore,
        modifiers: gigModifiers,
        bandInventory: band.inventory,
        playerState: player,
        gigStats: lastGigStats
      })
      setFinancials(result)

      const vScore = calculateViralityScore(perfScore, [], currentGig, band)
      setPostOptions(generatePostOptions({ viralityScore: vScore }))
    }
  }, [
    financials,
    currentGig,
    lastGigStats,
    gigModifiers,
    player,
    band, // Corrected dependency for virality calculation
    perfScore
  ])

  const handlePostSelection = option => {
    const result = resolvePost(option, Math.random())

    // Use checkViralEvent for bonus viral flag based on actual gig stats
    const isGigViral = lastGigStats && checkViralEvent(lastGigStats)
    const gigViralBonus = isGigViral ? 1 : 0

    // Use calculateSocialGrowth for platform-aware organic growth on top of post
    const organicGrowth = calculateSocialGrowth(
      result.platform,
      perfScore,
      social[result.platform] || 0,
      isGigViral // Use actual gig viral status, not post result.success
    )
    const totalFollowers = result.followers + organicGrowth

    const finalResult = { ...result, totalFollowers }
    setPostResult(finalResult)

    updateSocial({
      [result.platform]: (social[result.platform] || 0) + totalFollowers,
      viral: social.viral + (result.success ? 1 : 0) + gigViralBonus,
      lastGigDay: player.day
    })

    setPhase('COMPLETE')
  }

  const handleContinue = () => {
    if (!financials) return

    const fameGain = 50 + Math.floor(perfScore * 1.5)
    const newMoney = Math.max(0, player.money + financials.net)

    updatePlayer({
      money: newMoney,
      fame: player.fame + fameGain
    })

    if (shouldTriggerBankruptcy(newMoney, financials.net)) {
      addToast('GAME OVER: BANKRUPT! The tour is over.', 'error')
      changeScene('GAMEOVER')
    } else {
      changeScene('OVERWORLD')
    }
  }

  if (!financials)
    return (
      <div className='w-full h-full flex flex-col items-center justify-center bg-(--void-black)'>
        <div className="text-3xl text-(--toxic-green) font-['Metal_Mania'] animate-pulse tracking-widest">
          TALLYING RECEIPTS...
        </div>
      </div>
    )

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-(--void-black) text-(--star-white) relative'>
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.POST_GIG_BG)}")`
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-4xl w-full border-4 border-(--toxic-green) p-8 bg-(--void-black) relative z-10 shadow-[0_0_50px_var(--toxic-green-glow)] flex flex-col gap-6'
      >
        <h2 className="text-5xl text-center font-['Metal_Mania'] text-(--toxic-green) mb-2 text-shadow-[0_0_10px_var(--toxic-green)]">
          {phase === 'REPORT'
            ? 'GIG REPORT'
            : phase === 'SOCIAL'
              ? 'SOCIAL MEDIA STRATEGY'
              : 'TOUR UPDATE'}
        </h2>

        {phase === 'REPORT' && (
          <ReportPhase
            financials={financials}
            onNext={() => setPhase('SOCIAL')}
          />
        )}

        {phase === 'SOCIAL' && (
          <SocialPhase options={postOptions} onSelect={handlePostSelection} />
        )}

        {phase === 'COMPLETE' && (
          <CompletePhase result={postResult} onContinue={handleContinue} />
        )}
      </motion.div>
    </div>
  )
}

const ReportPhase = ({ financials, onNext }) => (
  <div className='space-y-6'>
    <div className='grid grid-cols-2 gap-8'>
      {/* Income Column */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className='text-lg border-b-2 border-(--toxic-green) mb-4 pb-2 tracking-widest font-mono text-(--toxic-green)'>
          INCOME
        </h3>
        <ul className='space-y-2.5 text-sm font-mono'>
          {financials.income.breakdown.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className='flex justify-between items-center'
            >
              <span className='text-(--star-white)/70'>{item.label}</span>
              <span className='text-(--toxic-green) font-bold tabular-nums'>
                +{item.value}€
              </span>
            </motion.li>
          ))}
        </ul>
        <div className='mt-4 pt-2 border-t border-(--toxic-green)/40 flex justify-between font-bold text-(--toxic-green)'>
          <span className='text-sm tracking-wider'>TOTAL</span>
          <span className='tabular-nums'>{financials.income.total}€</span>
        </div>
      </motion.div>

      {/* Expenses Column */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className='text-lg border-b-2 border-(--blood-red) text-(--blood-red) mb-4 pb-2 tracking-widest font-mono'>
          EXPENSES
        </h3>
        <ul className='space-y-2.5 text-sm font-mono'>
          {financials.expenses.breakdown.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className='flex justify-between items-center'
            >
              <span className='text-(--star-white)/70'>{item.label}</span>
              <span className='text-(--blood-red) font-bold tabular-nums'>
                -{item.value}€
              </span>
            </motion.li>
          ))}
        </ul>
        <div className='mt-4 pt-2 border-t border-(--blood-red)/40 flex justify-between font-bold text-(--blood-red)'>
          <span className='text-sm tracking-wider'>TOTAL</span>
          <span className='tabular-nums'>{financials.expenses.total}€</span>
        </div>
      </motion.div>
    </div>

    {/* Net Result */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring' }}
      className='text-center py-6 border-y-2 border-(--ash-gray)/30'
    >
      <div className='text-[10px] text-(--ash-gray) tracking-widest mb-2'>
        NET PROFIT
      </div>
      <div
        className={`text-5xl font-bold font-[Metal_Mania] tabular-nums ${
          financials.net >= 0
            ? 'text-(--toxic-green) drop-shadow-[0_0_20px_var(--toxic-green)]'
            : 'text-(--blood-red) drop-shadow-[0_0_20px_var(--blood-red)]'
        }`}
      >
        {financials.net > 0 ? '+' : ''}
        {financials.net}€
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className='text-center'
    >
      <button
        onClick={onNext}
        className='bg-(--toxic-green) text-(--void-black) px-8 py-3 font-bold hover:bg-(--star-white) transition-colors uppercase tracking-wider shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
      >
        Continue to Socials &gt;
      </button>
    </motion.div>
  </div>
)

const financialCategoryShape = PropTypes.shape({
  total: PropTypes.number.isRequired,
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      detail: PropTypes.string
    })
  ).isRequired
})

ReportPhase.propTypes = {
  financials: PropTypes.shape({
    income: financialCategoryShape.isRequired,
    expenses: financialCategoryShape.isRequired,
    net: PropTypes.number.isRequired
  }).isRequired,
  onNext: PropTypes.func.isRequired
}

const SocialPhase = ({ options, onSelect }) => (
  <div className='space-y-6'>
    <div className='text-center mb-2'>
      <h3 className='text-xl font-mono tracking-widest'>
        POST TO SOCIAL MEDIA
      </h3>
      <div className='text-[10px] text-(--ash-gray) tracking-wider mt-1'>
        CHOOSE YOUR STRATEGY
      </div>
    </div>
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {options.map((opt, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.15 }}
          onClick={() => onSelect(opt)}
          className='border-2 border-(--toxic-green)/40 p-4 hover:bg-(--toxic-green)/10 hover:border-(--toxic-green) text-left group transition-all relative overflow-hidden'
        >
          <div className='font-bold mb-2 group-hover:text-(--toxic-green) transition-colors'>
            {opt.title}
          </div>
          <div className='text-xs text-(--ash-gray) font-mono space-y-1'>
            <div className='flex justify-between'>
              <span>Platform</span>
              <span className='text-(--star-white)/60'>{opt.platform}</span>
            </div>
            <div className='flex justify-between'>
              <span>Viral Chance</span>
              <span className='text-(--warning-yellow)'>
                {Math.round((opt.viralChance ?? 0) * 100)}%
              </span>
            </div>
          </div>
          <div className='absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:animate-[shimmer_0.8s_ease-out] skew-x-12 pointer-events-none' />
        </motion.button>
      ))}
    </div>
  </div>
)

SocialPhase.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      platform: PropTypes.string.isRequired,
      viralChance: PropTypes.number
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired
}

const CompletePhase = ({ result, onContinue }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className='text-center py-4'
  >
    <motion.h3
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      className={`text-4xl font-[Metal_Mania] mb-4 ${
        result.success
          ? 'text-(--toxic-green) drop-shadow-[0_0_20px_var(--toxic-green)] animate-neon-flicker'
          : 'text-(--blood-red)'
      }`}
    >
      {result.success ? 'VIRAL HIT!' : 'FLOPOCOLYPSE'}
    </motion.h3>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className='mb-6 text-(--ash-gray) font-mono max-w-md mx-auto'
    >
      {result.message}
    </motion.p>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={`text-3xl font-bold mb-8 tabular-nums font-mono ${
        result.totalFollowers > 0
          ? 'text-(--toxic-green)'
          : 'text-(--blood-red)'
      }`}
    >
      {result.totalFollowers > 0 ? '+' : ''}
      {result.totalFollowers} Followers
      <div className='text-sm text-(--ash-gray)/60 mt-1 font-normal tracking-wider'>
        {result.platform}
      </div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      <button
        onClick={onContinue}
        className='bg-(--toxic-green) text-(--void-black) px-8 py-3 font-bold hover:bg-(--star-white) uppercase tracking-wider shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all'
      >
        Back to Tour &gt;
      </button>
    </motion.div>
  </motion.div>
)

CompletePhase.propTypes = {
  result: PropTypes.shape({
    success: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    followers: PropTypes.number,
    totalFollowers: PropTypes.number.isRequired,
    platform: PropTypes.string.isRequired
  }).isRequired,
  onContinue: PropTypes.func.isRequired
}
