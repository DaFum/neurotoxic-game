import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { calculateGigFinancials } from '../utils/economyEngine'
import {
  calculateViralityScore,
  generatePostOptions,
  resolvePost
} from '../utils/socialEngine'
import { ChatterOverlay } from '../components/ChatterOverlay'

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

  const perfScore = React.useMemo(() => {
    const rawScore = lastGigStats?.score || 0
    return Math.min(100, Math.max(30, rawScore / 500))
  }, [lastGigStats])

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
  }, [currentGig, activeEvent, triggerEvent])

  // Initialize Results once (simulated)
  React.useEffect(() => {
    if (!financials && currentGig && lastGigStats) {
      const crowdStats = { hype: lastGigStats?.peakHype || 0 }

      const result = calculateGigFinancials(
        currentGig,
        perfScore,
        crowdStats,
        gigModifiers,
        band.inventory,
        player.fame,
        lastGigStats
      )
      setFinancials(result)

      const vScore = calculateViralityScore(perfScore, [], currentGig)
      setPostOptions(generatePostOptions({ viralityScore: vScore }))
    }
  }, [
    financials,
    currentGig,
    lastGigStats,
    gigModifiers,
    player.fame,
    band.inventory,
    perfScore
  ])

  const handlePostSelection = option => {
    const result = resolvePost(option, Math.random())
    setPostResult(result)

    updateSocial({
      [result.platform]: (social[result.platform] || 0) + result.followers,
      viral: social.viral + (result.success ? 1 : 0)
    })

    setPhase('COMPLETE')
  }

  const handleContinue = () => {
    if (financials && player.money + financials.net < 0) {
      addToast('GAME OVER: BANKRUPT! The tour is over.', 'error')
      updatePlayer({ money: 0 })
      changeScene('GAMEOVER')
    } else {
      if (financials) {
        const fameGain = 50 + Math.floor(perfScore * 1.5)
        updatePlayer({
          money: Math.max(0, player.money + financials.net),
          fame: player.fame + fameGain
        })
      }
      changeScene('OVERWORLD')
    }
  }

  if (!financials) return <div>Loading...</div>

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-(--void-black) text-(--star-white) relative'>
      <div className='absolute top-24 right-8 z-30'>
        <ChatterOverlay />
      </div>
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
      <div>
        <h3 className='text-xl border-b border-(--toxic-green) mb-4'>INCOME</h3>
        <ul className='space-y-2 text-sm'>
          {financials.income.breakdown.map((item, i) => (
            <li key={i} className='flex justify-between'>
              <span>{item.label}</span>
              <span>+{item.value}€</span>
            </li>
          ))}
        </ul>
        <div className='mt-4 pt-2 border-t border-(--toxic-green) flex justify-between font-bold'>
          <span>TOTAL INCOME</span>
          <span>{financials.income.total}€</span>
        </div>
      </div>

      {/* Expenses Column */}
      <div>
        <h3 className='text-xl border-b border-(--blood-red) text-(--blood-red) mb-4'>
          EXPENSES
        </h3>
        <ul className='space-y-2 text-sm text-(--blood-red)'>
          {financials.expenses.breakdown.map((item, i) => (
            <li key={i} className='flex justify-between'>
              <span>{item.label}</span>
              <span>-{item.value}€</span>
            </li>
          ))}
        </ul>
        <div className='mt-4 pt-2 border-t border-(--blood-red) flex justify-between font-bold text-(--blood-red)'>
          <span>TOTAL EXPENSES</span>
          <span>{financials.expenses.total}€</span>
        </div>
      </div>
    </div>

    {/* Net Result */}
    <div className='text-center py-6 border-y-2 border-(--ash-gray)'>
      <div className='text-sm text-(--ash-gray)'>NET PROFIT</div>
      <div
        className={`text-4xl font-bold ${financials.net >= 0 ? 'text-(--toxic-green)' : 'text-(--blood-red)'}`}
      >
        {financials.net > 0 ? '+' : ''}
        {financials.net}€
      </div>
    </div>

    <div className='text-center'>
      <button
        onClick={onNext}
        className='bg-(--toxic-green) text-(--void-black) px-8 py-3 font-bold hover:bg-(--star-white) transition-colors uppercase'
      >
        Continue to Socials &gt;
      </button>
    </div>
  </div>
)

ReportPhase.propTypes = {
  financials: PropTypes.shape({
    income: PropTypes.shape({
      total: PropTypes.number.isRequired,
      breakdown: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.number.isRequired,
          detail: PropTypes.string
        })
      ).isRequired
    }).isRequired,
    expenses: PropTypes.shape({
      total: PropTypes.number.isRequired,
      breakdown: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.number.isRequired,
          detail: PropTypes.string
        })
      ).isRequired
    }).isRequired,
    net: PropTypes.number.isRequired
  }).isRequired,
  onNext: PropTypes.func.isRequired
}

const SocialPhase = ({ options, onSelect }) => (
  <div className='space-y-6'>
    <h3 className='text-xl text-center mb-4'>POST TO SOCIAL MEDIA</h3>
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt)}
          className='border border-(--toxic-green) p-4 hover:bg-(--toxic-green)/10 text-left group transition-all'
        >
          <div className='font-bold mb-2 group-hover:text-(--star-white)'>
            {opt.label}
          </div>
          <div className='text-xs text-(--ash-gray)'>
            Type: {opt.type} | Risk: {Math.round((1 - opt.chance) * 100)}%
          </div>
        </button>
      ))}
    </div>
  </div>
)

SocialPhase.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      chance: PropTypes.number.isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired
}

const CompletePhase = ({ result, onContinue }) => (
  <div className='text-center animate-pulse'>
    <h3 className='text-2xl mb-4'>
      {result.success ? 'VIRAL HIT!' : 'FLOPOCOLYPSE'}
    </h3>
    <p className='mb-6 text-(--ash-gray)'>{result.message}</p>
    <div className='text-xl mb-8'>
      {result.followers > 0 ? '+' : ''}
      {result.followers} Followers on {result.platform}
    </div>
    <button
      onClick={onContinue}
      className='bg-(--toxic-green) text-(--void-black) px-8 py-3 font-bold hover:bg-(--star-white) uppercase'
    >
      Back to Tour &gt;
    </button>
  </div>
)

CompletePhase.propTypes = {
  result: PropTypes.shape({
    success: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    followers: PropTypes.number.isRequired,
    platform: PropTypes.string.isRequired
  }).isRequired,
  onContinue: PropTypes.func.isRequired
}
