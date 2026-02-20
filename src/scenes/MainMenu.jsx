import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { useAudioControl } from '../hooks/useAudioControl'
import { GlitchButton } from '../ui/GlitchButton'
import { BandHQ } from '../ui/BandHQ'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

/**
 * The main menu scene component.
 * @returns {JSX.Element} The rendered menu.
 */
export const MainMenu = () => {
  const {
    changeScene,
    loadGame,
    addToast,
    player,
    updatePlayer,
    band,
    updateBand,
    social,
    settings,
    updateSettings,
    deleteSave,
    setlist,
    setSetlist,
    resetState
  } = useGameState()
  const [showUpgrades, setShowUpgrades] = useState(false)
  const isMountedRef = useRef(true)

  const { audioState, handleAudioChange } = useAudioControl()

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const reportAudioIssue = (error, fallbackMessage) => {
    if (!isMountedRef.current) return
    try {
      handleError(error, { addToast, fallbackMessage })
    } catch {
      // Never block scene transitions on toast/reporting failures.
    }
  }

  const startAmbientSafely = () => {
    void audioManager.startAmbient().catch(err => {
      reportAudioIssue(err, 'Ambient audio failed to start.')
    })
  }

  const handleStartTour = async () => {
    try {
      await audioManager.ensureAudioContext()
    } catch (err) {
      reportAudioIssue(err, 'Audio initialization failed.')
    } finally {
      resetState()
      startAmbientSafely()
      if (isMountedRef.current) {
        changeScene('OVERWORLD')
      }
    }
  }

  /**
   * Handles loading a saved game.
   */
  const handleLoad = async () => {
    if (!loadGame()) {
      addToast('No save game found!', 'error')
      return
    }

    try {
      await audioManager.ensureAudioContext()
    } catch (err) {
      reportAudioIssue(err, 'Audio initialization failed.')
    } finally {
      // Fire-and-forget keeps navigation responsive; Overworld re-syncs audio.
      startAmbientSafely()
      if (isMountedRef.current) {
        changeScene('OVERWORLD')
      }
    }
  }

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 relative overflow-hidden'>
      {/* Dynamic Background */}
      <div
        className='absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG)}")`
        }}
      />
      <div className='absolute inset-0 z-0 bg-gradient-to-b from-black/0 to-black/90 pointer-events-none' />

      {showUpgrades && (
        <BandHQ
          onClose={() => setShowUpgrades(false)}
          player={player}
          band={band}
          social={social}
          updatePlayer={updatePlayer}
          updateBand={updateBand}
          addToast={addToast}
          settings={settings}
          updateSettings={updateSettings}
          deleteSave={deleteSave}
          setlist={setlist}
          setSetlist={setSetlist}
          audioState={audioState}
          onAudioChange={handleAudioChange}
        />
      )}

      <div className='relative z-10 flex flex-col items-center'>
        <motion.h1
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-(--toxic-green) to-(--toxic-green-dark) font-['Metal_Mania'] animate-neon-flicker mb-2"
          style={{ WebkitTextStroke: '2px var(--toxic-green)' }}
        >
          NEUROTOXIC
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='h-[2px] bg-gradient-to-r from-transparent via-(--toxic-green) to-transparent mb-4 max-w-md'
        />

        <motion.h2
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1, delay: 0.6 }}
          className='text-lg md:text-2xl text-(--toxic-green)/80 mb-2 font-[Courier_New] uppercase text-center'
        >
          Grind The Void
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='mb-10 px-3 py-1 border border-(--toxic-green)/30 text-[10px] font-mono text-(--toxic-green)/60 tracking-widest'
        >
          v3.0 // EARLY ACCESS
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className='flex flex-col gap-3'
        >
          <GlitchButton onClick={handleStartTour} className='relative z-20'>
            Start Tour
          </GlitchButton>

          <GlitchButton
            onClick={handleLoad}
            className='relative z-20 border-(--blood-red) text-(--blood-red) hover:bg-(--blood-red) hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            Load Game
          </GlitchButton>

          <GlitchButton
            onClick={() => setShowUpgrades(true)}
            className='relative z-20 border-(--warning-yellow) text-(--warning-yellow) hover:bg-(--warning-yellow) hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            Band HQ
          </GlitchButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className='flex gap-4 mt-6'
        >
          <GlitchButton onClick={() => changeScene('CREDITS')}>
            CREDITS
          </GlitchButton>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className='absolute bottom-6 flex flex-col items-center gap-1 z-10'
      >
        <div className='w-32 h-[1px] bg-gradient-to-r from-transparent via-(--ash-gray)/50 to-transparent' />
        <div className='text-(--ash-gray)/60 text-[10px] font-mono tracking-widest'>
          © 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL
        </div>
      </motion.div>
    </div>
  )
}
