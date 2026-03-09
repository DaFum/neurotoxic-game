import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { useBandHQModal } from '../hooks/useBandHQModal.js'
import { GlitchButton } from '../ui/GlitchButton'
import { BandHQ } from '../ui/BandHQ'
import {
  Modal,
  AnimatedDivider,
  AnimatedSubtitle,
  UplinkButton,
  BandcampIcon,
  InstaIcon,
  TikTokIcon,
  YouTubeIcon,
  BlogIcon,
  GameIcon
} from '../ui/shared'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
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
  const { showHQ, openHQ, bandHQProps } = useBandHQModal()
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
      reportAudioIssue(err, tRef.current('ui:errors.ambient_start_failed'))
    })
  }, [reportAudioIssue])

  const proceedToTour = useCallback(async () => {
    setIsStarting(true)

    // Optimization: Artificial delay removed
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

    changeScene(GAME_PHASES.OVERWORLD)

    // Audio setup is fire-and-forget — never blocks scene transitions.
    void audioManager
      .ensureAudioContext()
      .then(success => {
        if (success) {
          startAmbientSafely()
        } else {
          reportAudioIssue(new Error('Audio unlock failed'), tRef.current('ui:errors.audio_init_failed'))
        }
      })
      .catch(err => reportAudioIssue(err, tRef.current('ui:errors.audio_init_failed')))
  }, [
    resetState,
    changeScene,
    reportAudioIssue,
    startAmbientSafely,
    updatePlayer
  ])

  const startNewTourFlow = useCallback(() => {
    // Check for existing player identity
    const savedPlayerId = localStorage.getItem('neurotoxic_player_id')
    const savedPlayerName = localStorage.getItem('neurotoxic_player_name')

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
    const savedGameExists = !!localStorage.getItem('neurotoxic_v3_save')
    if (savedGameExists) {
      setShowExistingSavePrompt(true)
      return
    }

    startNewTourFlow()
  }, [startNewTourFlow])

  const handleNameSubmit = useCallback(() => {
    if (!playerNameInput.trim()) {
      addToast(tRef.current('ui:enter_name_error'), 'error')
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
  }, [playerNameInput, addToast, proceedToTour, updatePlayer])

  /**
   * Handles loading a saved game.
   */
  const handleLoad = useCallback(async () => {
    setIsLoadingGame(true)

    if (!isMountedRef.current) return

    if (!loadGame()) {
      addToast(tRef.current('ui:no_save_found'), 'error')
      if (isMountedRef.current) setIsLoadingGame(false)
      return
    }

    // State transitions (batched automatically by React 18+)
    changeScene(GAME_PHASES.OVERWORLD)

    // Audio is fire-and-forget; Overworld re-syncs audio.
    void audioManager
      .ensureAudioContext()
      .then(success => {
        if (success) {
          startAmbientSafely()
        } else {
          reportAudioIssue(new Error('Audio unlock failed'), tRef.current('ui:errors.audio_init_failed'))
        }
      })
      .catch(err => reportAudioIssue(err, tRef.current('ui:errors.audio_init_failed')))
  }, [
    loadGame,
    addToast,
    changeScene,
    reportAudioIssue,
    startAmbientSafely
  ])

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
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 relative overflow-hidden'>
      {showExistingSavePrompt && (
        <Modal
          isOpen={true}
          title={t('ui:mainMenu.existingSave.title')}
          onClose={() => setShowExistingSavePrompt(false)}
        >
          <div className='flex flex-col gap-4'>
            <p className='text-(--ash-gray) font-mono text-sm'>
              {t('ui:mainMenu.existingSave.desc')}
            </p>
            <div className='flex gap-2 justify-end'>
              <GlitchButton
                onClick={handleLoadExistingFromPrompt}
                className='border-(--toxic-green) text-(--toxic-green)'
              >
                {t('ui:mainMenu.existingSave.load')}
              </GlitchButton>
              <GlitchButton
                onClick={handleStartNewAnyway}
                className='border-(--blood-red) text-(--blood-red)'
              >
                {t('ui:mainMenu.existingSave.startNew')}
              </GlitchButton>
            </div>
          </div>
        </Modal>
      )}

      {showNameInput && (
        <Modal
          isOpen={true}
          title={t('ui:identity_required')}
          onClose={closeNameInput}
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

        <AnimatedDivider
          width='100%'
          transition={{ duration: 0.6, delay: 0.4 }}
          className='bg-gradient-to-r from-transparent via-(--toxic-green) to-transparent mb-4 max-w-md'
        />

        {/* jscpd:ignore-start */}
        <AnimatedSubtitle
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1, delay: 0.6 }}
          className='text-lg md:text-2xl text-(--toxic-green)/80 mb-2 font-[Courier_New] text-center'
        >
          {t('ui:mainMenu.subtitle.grindTheVoid')}
        </AnimatedSubtitle>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='mb-10 px-3 py-1 border border-(--toxic-green)/30 text-[10px] font-mono text-(--toxic-green)/60 tracking-widest'
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
        <Modal
          isOpen={true}
          onClose={() => setShowFeatures(false)}
          title={t('ui:features.title')}
        >
          <div className='flex flex-col gap-6 w-full mx-auto max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 sm:pr-4 pb-4'>
            {t('ui:featureList', { returnObjects: true }).map(section => (
              <div key={section.title} className='flex flex-col gap-2'>
                <h3 className='text-(--toxic-green) font-mono text-xl md:text-2xl uppercase tracking-widest border-b border-(--toxic-green)/30 pb-1'>
                  {t(section.title)}
                </h3>
                <p className='text-(--ash-gray) font-mono text-sm md:text-base leading-relaxed mb-2'>
                  {t(section.description)}
                </p>

                {section.type === 'bullets' && section.items && (
                  <ul className='list-none flex flex-col gap-2 pl-2 border-l border-(--toxic-green)/20'>
                    {section.items.map(item => {
                      const translatedItem = t(item)
                      const splitIdx = translatedItem.indexOf(':')
                      if (splitIdx > -1) {
                        return (
                          <li
                            key={item}
                            className='text-(--ash-gray) font-mono text-sm md:text-base pl-2 relative before:content-["-"] before:absolute before:left-[-8px] before:text-(--toxic-green)'
                          >
                            <span className='text-(--toxic-green) font-bold'>
                              {translatedItem.substring(0, splitIdx + 1)}
                            </span>
                            {translatedItem.substring(splitIdx + 1)}
                          </li>
                        )
                      }
                      return (
                        <li
                          key={item}
                          className='text-(--ash-gray) font-mono text-sm md:text-base pl-2 relative before:content-["-"] before:absolute before:left-[-8px] before:text-(--toxic-green)'
                        >
                          {translatedItem}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {section.type === 'table' &&
                  section.headers &&
                  section.rows && (
                    <div className='overflow-x-auto w-full border border-(--toxic-green)/30 bg-(--void-black)/50'>
                      <table className='w-full text-left font-mono text-sm'>
                        <thead className='bg-(--toxic-green)/10 border-b border-(--toxic-green)/30'>
                          <tr>
                            {section.headers.map(header => (
                              <th
                                key={header}
                                className='p-2 text-(--toxic-green) uppercase font-normal'
                              >
                                {t(header)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map(row => (
                            <tr
                              key={row[0]}
                              className='border-b border-(--toxic-green)/10 last:border-0'
                            >
                              {row.map(cell => (
                                <td
                                  key={cell}
                                  className={`p-2 ${cell === row[0] ? 'text-(--toxic-green)/90 whitespace-nowrap align-top font-bold' : 'text-(--ash-gray) align-top'}`}
                                >
                                  {t(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showSocials && (
        <Modal
          isOpen={true}
          onClose={() => setShowSocials(false)}
          title={t('ui:socials')}
        >
          <div className='flex flex-col gap-3 sm:gap-4 max-w-md w-full mx-auto max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 sm:pr-2 pb-1'>
            <UplinkButton
              title={t('ui:social_links.game.title')}
              subtitle={t('ui:social_links.game.subtitle')}
              type={t('ui:social_links.type_system_core')}
              url='https://neurotoxic-game.vercel.app'
              Icon={GameIcon}
            />
            <UplinkButton
              title={t('ui:social_links.bandcamp.title')}
              subtitle={t('ui:social_links.bandcamp.subtitle')}
              type={t('ui:social_links.type_audio_vault')}
              url='https://neurotoxic.bandcamp.com'
              Icon={BandcampIcon}
            />
            <UplinkButton
              title={t('ui:social_links.instagram.title')}
              subtitle={t('ui:social_links.instagram.subtitle')}
              type={t('ui:social_links.type_visual_feed')}
              url='https://instagram.com/neurotoxicband'
              Icon={InstaIcon}
            />
            <UplinkButton
              title={t('ui:social_links.tiktok.title')}
              subtitle={t('ui:social_links.tiktok.subtitle')}
              type={t('ui:social_links.type_viral_stream')}
              url='https://tiktok.com/@neurotoxicband'
              Icon={TikTokIcon}
            />
            <UplinkButton
              title={t('ui:social_links.neurotoxic_once.title')}
              subtitle={t('ui:social_links.neurotoxic_once.subtitle')}
              type={t('ui:social_links.type_broadcast_a')}
              url='https://youtube.com/@neurotoxiconcechannel237'
              Icon={YouTubeIcon}
            />
            <UplinkButton
              title={t('ui:social_links.neurotoxic_3000.title')}
              subtitle={t('ui:social_links.neurotoxic_3000.subtitle')}
              type={t('ui:social_links.type_broadcast_b')}
              url='https://youtube.com/@neurotoxic3000'
              Icon={YouTubeIcon}
            />
            <UplinkButton
              title={t('ui:social_links.blog.title')}
              subtitle={t('ui:social_links.blog.subtitle')}
              type={t('ui:social_links.type_data_log')}
              url='https://neuroblogxic.blogspot.com'
              Icon={BlogIcon}
            />
          </div>
        </Modal>
      )}

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
