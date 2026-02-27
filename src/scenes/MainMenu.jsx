import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { useBandHQModal } from '../hooks/useBandHQModal.js'
import { GlitchButton } from '../ui/GlitchButton'
import { BandHQ } from '../ui/BandHQ'
import { Modal } from '../ui/shared'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

/**
 * The main menu scene component.
 * @returns {JSX.Element} The rendered menu.
 */
export const MainMenu = () => {
  const { t } = useTranslation()
  const { changeScene, loadGame, addToast, resetState, updatePlayer } =
    useGameState()
  const { showHQ, openHQ, bandHQProps } = useBandHQModal()
  const isMountedRef = useRef(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [playerNameInput, setPlayerNameInput] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (showNameInput) {
      inputRef.current?.focus()
    }
  }, [showNameInput])

  const reportAudioIssue = useCallback(
    (error, fallbackMessage) => {
      if (!isMountedRef.current) return
      try {
        handleError(error, { addToast, fallbackMessage })
      } catch {
        // Never block scene transitions on toast/reporting failures.
      }
    },
    [addToast]
  )

  const startAmbientSafely = useCallback(() => {
    void audioManager.startAmbient().catch(err => {
      reportAudioIssue(err, 'Ambient audio failed to start.')
    })
  }, [reportAudioIssue])

  const proceedToTour = useCallback(async () => {
    setIsStarting(true)
    // Add artificial delay for UX weight
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!isMountedRef.current) return

    // State transitions (batched automatically by React 18+)
    resetState()

    // Re-apply identity after reset (since reset clears state to default)
    const savedPlayerId = localStorage.getItem('neurotoxic_player_id')
    const savedPlayerName = localStorage.getItem('neurotoxic_player_name')
    if (savedPlayerId && savedPlayerName) {
      updatePlayer({
        playerId: savedPlayerId,
        playerName: savedPlayerName
      })
    }

    changeScene('OVERWORLD')

    // Audio setup is fire-and-forget — never blocks scene transitions.
    void audioManager
      .ensureAudioContext()
      .catch(err => reportAudioIssue(err, 'Audio initialization failed.'))
      .then(() => startAmbientSafely())
  }, [
    resetState,
    changeScene,
    reportAudioIssue,
    startAmbientSafely,
    updatePlayer
  ])

  const handleStartTour = useCallback(async () => {
    // Check for existing player identity
    const savedPlayerId = localStorage.getItem('neurotoxic_player_id')
    const savedPlayerName = localStorage.getItem('neurotoxic_player_name')

    if (!savedPlayerId || !savedPlayerName) {
      setShowNameInput(true)
      return
    }

    proceedToTour()
  }, [proceedToTour])

  const handleNameSubmit = useCallback(() => {
    if (!playerNameInput.trim()) {
      addToast(t('ui:enter_name_error'), 'error')
      return
    }

    const newId = crypto.randomUUID()
    const newName = playerNameInput.trim()

    localStorage.setItem('neurotoxic_player_id', newId)
    localStorage.setItem('neurotoxic_player_name', newName)

    updatePlayer({
      playerId: newId,
      playerName: newName
    })

    setShowNameInput(false)
    void proceedToTour()
  }, [playerNameInput, addToast, proceedToTour, updatePlayer, t])

  /**
   * Handles loading a saved game.
   */
  const handleLoad = useCallback(async () => {
    setIsLoadingGame(true)
    // Add artificial delay for UX weight
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!isMountedRef.current) return

    if (!loadGame()) {
      addToast(t('ui:no_save_found'), 'error')
      if (isMountedRef.current) setIsLoadingGame(false)
      return
    }

    // State transitions (batched automatically by React 18+)
    changeScene('OVERWORLD')

    // Audio is fire-and-forget; Overworld re-syncs audio.
    void audioManager
      .ensureAudioContext()
      .catch(err => reportAudioIssue(err, 'Audio initialization failed.'))
      .then(() => startAmbientSafely())
  }, [loadGame, addToast, changeScene, reportAudioIssue, startAmbientSafely])

  const handleCredits = useCallback(() => changeScene('CREDITS'), [changeScene])

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 relative overflow-hidden'>
      {showNameInput && (
        <Modal
          isOpen={true}
          title={t('ui:identity_required')}
          onClose={() => setShowNameInput(false)}
          className='max-w-md'
          aria-label={t('ui:identity_required')}
        >
          <div className='flex flex-col gap-4'>
            <p className='text-(--ash-gray) font-mono text-sm'>
              {t('ui:enter_alias_desc')}
            </p>
            <input
              ref={inputRef}
              type='text'
              value={playerNameInput}
              onChange={e => setPlayerNameInput(e.target.value)}
              placeholder={t('ui:enter_name_placeholder')}
              className='bg-(--void-black) border border-(--toxic-green) p-2 text-(--toxic-green) font-mono text-lg focus:outline-none focus:ring-1 focus:ring-(--toxic-green) uppercase'
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              aria-label={t('ui:enter_alias_desc')}
            />
            <GlitchButton onClick={handleNameSubmit}>
              {t('ui:confirm_identity')}
            </GlitchButton>
          </div>
        </Modal>
      )}

      {/* Dynamic Background */}
      <div
        className='absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG)}")`
        }}
      />
      <div className='absolute inset-0 z-0 bg-gradient-to-b from-black/0 to-black/90 pointer-events-none' />

      {showHQ && <BandHQ {...bandHQProps} />}

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
          <GlitchButton
            onClick={handleStartTour}
            isLoading={isStarting}
            className='relative z-20'
          >
            {t('ui:start_game')}
          </GlitchButton>

          <GlitchButton
            onClick={handleLoad}
            isLoading={isLoadingGame}
            className='relative z-20 border-(--blood-red) text-(--blood-red) hover:bg-(--blood-red) hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            {t('ui:load_game')}
          </GlitchButton>

          <GlitchButton
            onClick={openHQ}
            className='relative z-20 border-(--warning-yellow) text-(--warning-yellow) hover:bg-(--warning-yellow) hover:shadow-[4px_4px_0px_var(--toxic-green)]'
          >
            {t('ui:band_hq')}
          </GlitchButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className='flex gap-4 mt-6'
        >
          <GlitchButton onClick={handleCredits}>{t('ui:credits')}</GlitchButton>
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
