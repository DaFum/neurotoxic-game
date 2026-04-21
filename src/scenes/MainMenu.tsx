import { motion } from 'framer-motion'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { GlitchButton } from '../ui/GlitchButton'
import { BandHQ } from '../ui/BandHQ'
import { AnimatedDivider, AnimatedSubtitle } from '../ui/shared'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { MainMenuSocials } from './mainmenu/MainMenuSocials.tsx'
import { MainMenuFeatures } from './mainmenu/MainMenuFeatures.tsx'
import { MainMenuExistingSavePrompt } from './mainmenu/MainMenuExistingSavePrompt.tsx'
import { MainMenuNameInputPrompt } from './mainmenu/MainMenuNameInputPrompt.tsx'
import { useMainMenu } from './mainmenu/useMainMenu'

/**
 * The main menu scene component.
 * @returns {JSX.Element} The rendered menu.
 */
export const MainMenu = () => {
  const { showHQ, openHQ, closeHQ } = useBandHQModal()

  const {
    t,
    isStarting,
    isLoadingGame,
    showNameInput,
    playerNameInput,
    setPlayerNameInput,
    showSocials,
    setShowSocials,
    showFeatures,
    setShowFeatures,
    showExistingSavePrompt,
    setShowExistingSavePrompt,
    inputRef,
    handleStartTour,
    handleNameSubmit,
    handleLoad,
    handleCredits,
    closeNameInput,
    handleStartNewAnyway,
    handleLoadExistingFromPrompt
  } = useMainMenu()

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
