import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'
import { AnimatedDivider, AnimatedSubtitle } from '../ui/shared'
import { VoidSkullIcon } from '../ui/shared/Icons'

/**
 * Scene displayed when the game ends (bankruptcy or health failure).
 */
export const GameOver = () => {
  const { t } = useTranslation(['ui'])
  const { changeScene, player, loadGame, resetState } = useGameState()

  useEffect(() => {
    if (!player || player.score === undefined) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      changeScene('MENU')
    }
  }, [player, changeScene])

  const handleRetry = () => {
    if (loadGame()) {
      // Already handled by loadGame logic
    } else {
      changeScene('MENU')
    }
  }

  const handleReturnToMenu = () => {
    resetState()
    changeScene('MENU')
  }

  const statRows = [
    { label: t('ui:stats.daysSurvived'), value: player?.day },
    { label: t('ui:stats.fameReached'), value: player?.fame },
    { label: t('ui:stats.totalTravels'), value: player?.totalTravels ?? 0 },
    { label: t('ui:stats.totalScore'), value: player?.score ?? 0 }
  ]

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 text-center p-8 relative overflow-hidden'>
      {/* Vignette overlay */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, var(--void-black) 100%)'
        }}
      />

      {/* Red scanlines */}
      <div className='absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,var(--blood-red)_2px,var(--blood-red)_4px)]' />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative z-10 mb-4"
      >
        <VoidSkullIcon className="w-24 h-24 text-(--blood-red) drop-shadow-[0_0_20px_var(--blood-red)]" />
      </motion.div>

      <h1 className='text-8xl md:text-9xl text-(--blood-red) font-[Metal_Mania] mb-2 animate-doom-zoom relative z-10'>
        {t('ui:gameOver.soldOut', 'SOLD OUT')}
      </h1>

      <AnimatedDivider
        width='16rem'
        transition={{ duration: 0.8, delay: 0.8 }}
        className='bg-gradient-to-r from-transparent via-(--blood-red) to-transparent mb-3'
      />

      <AnimatedSubtitle
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className='text-lg text-(--ash-gray) font-mono mb-10 tracking-[0.3em] relative z-10'
      >
        {t('ui:tour.endedPrematurely')}
      </AnimatedSubtitle>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className='border-2 border-(--blood-red)/60 p-6 w-full max-w-lg mb-8 bg-(--void-black)/80 backdrop-blur-sm relative z-10 shadow-[0_0_30px_var(--blood-red)/20]'
      >
        <div className='text-[10px] text-(--blood-red) tracking-widest mb-4 border-b border-(--blood-red)/30 pb-2'>
          {t('ui:gameOver.finalStatistics', 'FINAL STATISTICS')}
        </div>
        <div className='space-y-3 font-mono'>
          {statRows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 + i * 0.15 }}
              className='flex justify-between items-center'
            >
              <span className='text-xs text-(--ash-gray) tracking-wider'>
                {row.label}
              </span>
              <span className='text-lg text-(--star-white) font-bold tabular-nums'>
                {row.value}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className='flex gap-4 relative z-10'
      >
        <GlitchButton
          onClick={handleRetry}
          className='border-(--star-white) text-(--star-white)'
        >
          {t('ui:gameOver.loadLastSave')}
        </GlitchButton>
        <GlitchButton
          onClick={handleReturnToMenu}
          className='border-(--blood-red) text-(--blood-red)'
        >
          {t('ui:gameOver.returnToMenu')}
        </GlitchButton>
      </motion.div>
    </div>
  )
}
