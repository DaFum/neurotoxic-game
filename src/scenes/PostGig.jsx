import React, { useState } from 'react'
import { useGameState } from '../context/GameState'
import { motion } from 'framer-motion'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { calculateGigFinancials } from '../utils/economyEngine'
import { calculateViralityScore, generatePostOptions, resolvePost } from '../utils/socialEngine'
import { ChatterOverlay } from '../components/ChatterOverlay'

/**
 * Report Phase Component
 */
const ReportPhase = ({ financials, onNext }) => (
  <>
    <div className='grid grid-cols-2 gap-8 text-sm md:text-base font-mono'>
      <div>
        <h3 className='text-(--toxic-green) border-b border-gray-700 mb-2'>INCOME</h3>
        {financials.income.breakdown.map((item, i) => (
          <div key={i} className='flex justify-between'>
            <span>{item.label}</span>
            <span className='text-green-400'>+{item.value}€</span>
          </div>
        ))}
        <div className='mt-2 pt-2 border-t border-gray-800 flex justify-between font-bold'>
          <span>TOTAL</span>
          <span>{financials.income.total}€</span>
        </div>
      </div>
      <div>
        <h3 className='text-red-500 border-b border-gray-700 mb-2'>EXPENSES</h3>
        {financials.expenses.breakdown.map((item, i) => (
          <div key={i} className='flex justify-between'>
            <span>{item.label}</span>
            <span className='text-red-400'>-{item.value}€</span>
          </div>
        ))}
        <div className='mt-2 pt-2 border-t border-gray-800 flex justify-between font-bold'>
          <span>TOTAL</span>
          <span>{financials.expenses.total}€</span>
        </div>
      </div>
    </div>

    <div className='text-center mt-4'>
      <div className='text-sm text-gray-500'>NET PROFIT</div>
      <div className={`text-4xl font-bold glitch-text ${financials.net >= 0 ? 'text-(--toxic-green)' : 'text-red-600'}`}>
        {financials.net >= 0 ? '+' : ''}{financials.net}€
      </div>
    </div>

    <button onClick={onNext} className='mt-4 w-full py-4 bg-(--toxic-green) text-black font-bold uppercase hover:bg-white transition-colors'>
      NEXT: SOCIAL MEDIA
    </button>
  </>
)

/**
 * Social Phase Component
 */
const SocialPhase = ({ options, onSelect }) => (
  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
    {options.map((opt) => (
      <button
        key={opt.id}
        onClick={() => onSelect(opt)}
        className='p-4 border border-gray-700 hover:border-(--toxic-green) hover:bg-(--toxic-green)/10 text-left transition-all group'
      >
        <div className='text-xs text-gray-500 group-hover:text-white uppercase mb-1'>{opt.platform}</div>
        <div className='font-bold text-lg mb-2'>{opt.title}</div>
        <div className='text-sm text-gray-400 mb-4'>{opt.description}</div>
        <div className='flex justify-between text-xs font-mono'>
          <span>Viral Chance: {Math.round(opt.viralChance * 100)}%</span>
          <span>Est. Gain: +{opt.effect.followers}</span>
        </div>
      </button>
    ))}
  </div>
)

/**
 * Complete Phase Component
 */
const CompletePhase = ({ result, onContinue }) => (
  <div className='text-center'>
    <div className='mb-8'>
      <h3 className='text-2xl text-(--toxic-green) mb-2'>{result?.success ? 'VIRAL HIT!' : 'POST PUBLISHED'}</h3>
      <p className='text-gray-300'>{result?.message}</p>
      <div className='text-4xl font-bold mt-4'>+{result?.followers} Followers</div>
      <div className='text-sm text-gray-500 uppercase mt-1'>on {result?.platform}</div>
    </div>
    <button onClick={onContinue} className='w-full py-4 bg-(--toxic-green) text-black font-bold uppercase hover:bg-white transition-colors'>
      CONTINUE TOUR
    </button>
  </div>
)

export const PostGig = () => {
  const { changeScene, updatePlayer, player, currentGig, gigModifiers, triggerEvent, activeEvent, band, updateSocial, social, lastGigStats, addToast } = useGameState()
  const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, COMPLETE
  const [financials, setFinancials] = useState(null)
  const [postOptions, setPostOptions] = useState([])
  const [postResult, setPostResult] = useState(null)

  React.useEffect(() => {
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
  }, [])

  // Initialize Results once (simulated)
  React.useEffect(() => {
    if (!financials && currentGig && lastGigStats) {
      // Use real score normalized to 0-100 (approx)
      // Assume max score ~ 1000 per second of song. Setlist ~ 200s. Max ~ 200k.
      // Let's simplified normalize: score / (duration * 100).
      // For now, random fallback if no stats
      const rawScore = lastGigStats?.score || 0
      const performanceScore = Math.min(100, Math.max(50, rawScore / 500)) // Rough normalization

      // NOTE: economyEngine currently derives core gig economics (like fillRate) internally from Fame/Promo.
      // We still pass a minimal `crowdStats` object as contextual metadata and to keep the API shape stable
      // for future extensions (e.g., hype-driven bonuses or logging). It does not currently change the core
      // financial outcome on its own.
      const crowdStats = { hype: lastGigStats?.peakHype || 0 }

      // Pass player.fame and lastGigStats
      const result = calculateGigFinancials(currentGig, performanceScore, crowdStats, gigModifiers, band.inventory, player.fame, lastGigStats)
      setFinancials(result)

      const vScore = calculateViralityScore(performanceScore, [], currentGig) // events list empty for now
      setPostOptions(generatePostOptions({ viralityScore: vScore }))
    }
  }, [financials, currentGig, lastGigStats, gigModifiers, player.fame])

  const handlePostSelection = (option) => {
    const result = resolvePost(option, Math.random())
    setPostResult(result)

    // Apply Social Growth
    updateSocial({
      [result.platform]: (social[result.platform] || 0) + result.followers,
      viral: social.viral + (result.success ? 1 : 0)
    })

    setPhase('COMPLETE')
  }

  const handleContinue = () => {
    // Bankruptcy check: If net causes negative balance, GAME OVER
    // Logic: player.money + financials.net < 0
    if (financials && (player.money + financials.net) < 0) {
      addToast('GAME OVER: BANKRUPT! The tour is over.', 'error')
      changeScene('GAMEOVER')
    } else {
      if (financials) {
        updatePlayer({
          money: player.money + financials.net,
          day: player.day + 1,
          fame: player.fame + 100 // Simplified fame
        })
      }
      changeScene('OVERWORLD')
    }
  }

  if (!financials) return <div>Loading...</div>

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-(--void-black) text-white relative'>
      <div className='absolute top-24 right-8 z-30'>
        <ChatterOverlay />
      </div>
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center'
        style={{ backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.POST_GIG_BG)}")` }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-4xl w-full border-4 border-(--toxic-green) p-8 bg-black relative z-10 shadow-[0_0_50px_rgba(0,255,65,0.3)] flex flex-col gap-6'
      >
        <h2 className="text-5xl text-center font-['Metal_Mania'] text-(--toxic-green) mb-2 text-shadow-[0_0_10px_(--toxic-green)]">
          {phase === 'REPORT' ? 'GIG REPORT' : phase === 'SOCIAL' ? 'SOCIAL MEDIA STRATEGY' : 'TOUR UPDATE'}
        </h2>

        {phase === 'REPORT' && (
          <ReportPhase financials={financials} onNext={() => setPhase('SOCIAL')} />
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
