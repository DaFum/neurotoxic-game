import { useEffect, useRef, useState, useCallback } from 'react'
import { safeStorageOperation } from '../utils/errorHandler.js'
import { getSafeUUID } from '../utils/crypto.js'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { useBandHQModal } from '../hooks/useBandHQModal.js'
import { GlitchButton } from '../ui/GlitchButton'
import { BandHQ } from '../ui/BandHQ'
import { AnimatedDivider, AnimatedSubtitle } from '../ui/shared'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
import { MainMenuSocials } from './mainmenu/MainMenuSocials.jsx'
import { MainMenuFeatures } from './mainmenu/MainMenuFeatures.jsx'
import { MainMenuExistingSavePrompt } from './mainmenu/MainMenuExistingSavePrompt.jsx'
import { MainMenuNameInputPrompt } from './mainmenu/MainMenuNameInputPrompt.jsx'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

/**
 * The main menu scene component.
 * @returns {JSX.Element} The rendered menu.
 */
export const MainMenu = () => {
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const { changeScene, loadGame, addToast, resetState, updatePlayer } =
    useGameState()
  const { showHQ, openHQ, closeHQ } = useBandHQModal()
  const isMountedRef = useRef(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [playerNameInput, setPlayerNameInput] = useState('')
  const [showSocials, setShowSocials] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [showExistingSavePrompt, setShowExistingSavePrompt] = useState(false)
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
      reportAudioIssue(
        err,
        tRef.current('ui:errors.ambient_start_failed', {
          defaultValue: 'Failed to start ambient audio'
        })
      )
    })
  }, [reportAudioIssue])

  const initializeAudio = useCallback(() => {
    void audioManager
      .ensureAudioContext()
      .then(success => {
        if (success) {
          startAmbientSafely()
        } else {
          reportAudioIssue(
            new Error('Audio unlock failed'),
            tRef.current('ui:errors.audio_init_failed', {
              defaultValue: 'Audio initialization failed'
            })
          )
        }
      })
      .catch(err =>
        reportAudioIssue(
          err,
          tRef.current('ui:errors.audio_init_failed', {
            defaultValue: 'Audio initialization failed'
          })
        )
      )
  }, [reportAudioIssue, startAmbientSafely])

  const proceedToTour = useCallback(async () => {
    setIsStarting(true)

    // Optimization: Artificial delay removed
    if (!isMountedRef.current) return

    // Capture identity before reset
    const savedPlayerId = safeStorageOperation('getPlayerId', () =>
      localStorage.getItem('neurotoxic_player_id')
    )
    const savedPlayerName = safeStorageOperation('getPlayerName', () =>
      localStorage.getItem('neurotoxic_player_name')
    )

    // State transitions (batched automatically by React 18+)
    resetState()

    // Re-apply identity unconditionally (protects against storage failure but valid in-memory session)
    if (savedPlayerId && savedPlayerName) {
      updatePlayer({
        playerId: savedPlayerId,
        playerName: savedPlayerName
      })
    }

    changeScene(GAME_PHASES.OVERWORLD)

    // Audio setup is fire-and-forget — never blocks scene transitions.
    initializeAudio()
  }, [resetState, changeScene, initializeAudio, updatePlayer])

  const startNewTourFlow = useCallback(() => {
    // Check for existing player identity
    const savedPlayerId = safeStorageOperation('getPlayerId', () =>
      localStorage.getItem('neurotoxic_player_id')
    )
    const savedPlayerName = safeStorageOperation('getPlayerName', () =>
      localStorage.getItem('neurotoxic_player_name')
    )

    if (!savedPlayerId || !savedPlayerName) {
      setShowNameInput(true)
      return
    }

    updatePlayer({
      playerId: savedPlayerId,
      playerName: savedPlayerName
    })
    void proceedToTour()
  }, [proceedToTour, updatePlayer])

  const handleStartTour = useCallback(() => {
    const savedGameExists = !!safeStorageOperation('checkSaveExists', () =>
      localStorage.getItem('neurotoxic_v3_save')
    )
    if (savedGameExists) {
      setShowExistingSavePrompt(true)
      return
    }

    startNewTourFlow()
  }, [startNewTourFlow])

  const handleNameSubmit = useCallback(() => {
    if (!playerNameInput.trim()) {
      addToast(
        tRef.current('ui:enter_name_error', {
          defaultValue: 'Please enter a name'
        }),
        'error'
      )
      return
    }

    const newId = getSafeUUID()
    const newName = playerNameInput.trim()

    safeStorageOperation('setPlayerId', () =>
      localStorage.setItem('neurotoxic_player_id', newId)
    )
    safeStorageOperation('setPlayerName', () =>
      localStorage.setItem('neurotoxic_player_name', newName)
    )

    updatePlayer({
      playerId: newId,
      playerName: newName
    })

    setShowNameInput(false)
    void proceedToTour()
  }, [playerNameInput, addToast, proceedToTour, updatePlayer])

  /**
   * Handles loading a saved game.
   */
  const handleLoad = useCallback(async () => {
    setIsLoadingGame(true)

    if (!isMountedRef.current) return

    if (!loadGame()) {
      addToast(
        tRef.current('ui:no_save_found', {
          defaultValue: 'No save found'
        }),
        'error'
      )
      if (isMountedRef.current) setIsLoadingGame(false)
      return
    }

    // State transitions (batched automatically by React 18+)
    changeScene(GAME_PHASES.OVERWORLD)

    // Audio is fire-and-forget; Overworld re-syncs audio.
    initializeAudio()
  }, [loadGame, addToast, changeScene, initializeAudio])

  const handleCredits = useCallback(
    () => changeScene(GAME_PHASES.CREDITS),
    [changeScene]
  )
  const closeNameInput = useCallback(() => setShowNameInput(false), [])

  const handleStartNewAnyway = useCallback(() => {
    setShowExistingSavePrompt(false)
    startNewTourFlow()
  }, [startNewTourFlow])

  const handleLoadExistingFromPrompt = useCallback(() => {
    setShowExistingSavePrompt(false)
    void handleLoad()
  }, [handleLoad])

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-void-black z-50 relative overflow-hidden'>
      {showExistingSavePrompt && (
        <MainMenuExistingSavePrompt
          onLoad={handleLoadExistingFromPrompt}
          onStartNew={handleStartNewAnyway}
          onClose={() => setShowExistingSavePrompt(false)}
        />
      )}

      {showNameInput && (
        <MainMenuNameInputPrompt
          playerNameInput={playerNameInput}
          setPlayerNameInput={setPlayerNameInput}
          handleNameSubmit={handleNameSubmit}
          onClose={closeNameInput}
          inputRef={inputRef}
        />
      )}

      {/* Dynamic Background */}
      <div
        className='absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG)}")`
        }}
      />
      <div className='absolute inset-0 z-0 bg-gradient-to-b from-black/0 to-black/90 pointer-events-none' />

      {showHQ && <BandHQ onClose={closeHQ} />}

      <div className='relative z-10 flex flex-col items-center'>
        <motion.h1
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-toxic-green to-toxic-green-dark font-['Metal_Mania'] animate-neon-flicker mb-2"
          style={{ WebkitTextStroke: '2px var(--color-toxic-green)' }}
        >
          NEUROTOXIC
        </motion.h1>

        <AnimatedDivider
          width='100%'
          transition={{ duration: 0.6, delay: 0.4 }}
          className='bg-gradient-to-r from-transparent via-toxic-green to-transparent mb-4 max-w-md'
        />

        {/* jscpd:ignore-start */}
        <AnimatedSubtitle
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1, delay: 0.6 }}
          className='text-lg md:text-2xl text-toxic-green/80 mb-2 font-[Courier_New] text-center'
        >
          {t('ui:mainMenu.subtitle.grindTheVoid')}
        </AnimatedSubtitle>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='mb-10 px-3 py-1 border border-toxic-green/30 text-[10px] font-mono text-toxic-green/60 tracking-widest'
        >
          v3.0 // EARLY ACCESS
        </motion.div>
        {/* jscpd:ignore-end */}

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
            className='relative z-20 border-blood-red text-blood-red hover:bg-blood-red hover:shadow-[4px_4px_0px_var(--color-toxic-green)]'
          >
            {t('ui:load_game')}
          </GlitchButton>

          <GlitchButton
            onClick={openHQ}
            className='relative z-20 border-warning-yellow text-warning-yellow hover:bg-warning-yellow hover:shadow-[4px_4px_0px_var(--color-toxic-green)]'
          >
            {t('ui:band_hq')}
          </GlitchButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className='flex flex-col gap-4 mt-6 items-center'
        >
          <div className='flex flex-wrap justify-center gap-4'>
            <GlitchButton onClick={() => setShowSocials(true)}>
              {t('ui:socials')}
            </GlitchButton>
            <GlitchButton onClick={handleCredits}>
              {t('ui:credits')}
            </GlitchButton>
          </div>
          <GlitchButton onClick={() => setShowFeatures(true)}>
            {t('ui:features.button')}
          </GlitchButton>
        </motion.div>
      </div>

      {showFeatures && (
        <MainMenuFeatures onClose={() => setShowFeatures(false)} />
      )}

      {showSocials && <MainMenuSocials onClose={() => setShowSocials(false)} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className='absolute bottom-6 flex flex-col items-center gap-1 z-10'
      >
        <div className='w-32 h-[1px] bg-gradient-to-r from-transparent via-ash-gray/50 to-transparent' />
        <div className='text-ash-gray/60 text-[10px] font-mono tracking-widest'>
          © 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL
        </div>
      </motion.div>
    </div>
  )
}
