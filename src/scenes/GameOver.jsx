import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Scene displayed when the game ends (bankruptcy or health failure).
 */
export const GameOver = () => {
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
    { label: 'DAYS SURVIVED', value: player?.day },
    { label: 'FAME REACHED', value: player?.fame },
    { label: 'TOTAL TRAVELS', value: player?.totalTravels ?? 0 },
    { label: 'TOTAL SCORE', value: player?.score ?? 0 }
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

      <h1 className='text-8xl md:text-9xl text-(--blood-red) font-[Metal_Mania] mb-2 animate-doom-zoom relative z-10'>
        SOLD OUT
      </h1>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '16rem' }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className='h-[2px] bg-gradient-to-r from-transparent via-(--blood-red) to-transparent mb-3'
      />

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className='text-lg text-(--ash-gray) font-mono mb-10 uppercase tracking-[0.3em] relative z-10'
      >
        The tour has ended prematurely.
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className='border-2 border-(--blood-red)/60 p-6 w-full max-w-lg mb-8 bg-(--void-black)/80 backdrop-blur-sm relative z-10 shadow-[0_0_30px_var(--blood-red)/20]'
      >
        <div className='text-[10px] text-(--blood-red) tracking-widest mb-4 border-b border-(--blood-red)/30 pb-2'>
          FINAL STATISTICS
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
          LOAD LAST SAVE
        </GlitchButton>
        <GlitchButton
          onClick={handleReturnToMenu}
          className='border-(--blood-red) text-(--blood-red)'
        >
          RETURN TO MENU
        </GlitchButton>
      </motion.div>
    </div>
  )
}
