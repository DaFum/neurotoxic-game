import { motion, useReducedMotion } from 'framer-motion'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { GlitchButton } from '../ui/GlitchButton'
import { BandHQ } from '../ui/BandHQ'
import { AnimatedDivider, AnimatedSubtitle } from '../ui/shared'
import { IMG_PROMPTS, resolveGenImageUrl } from '../utils/imageGen'
import { MainMenuSocials } from './mainmenu/MainMenuSocials.tsx'
import { MainMenuFeatures } from './mainmenu/MainMenuFeatures.tsx'
import { MainMenuExistingSavePrompt } from './mainmenu/MainMenuExistingSavePrompt.tsx'
import { MainMenuNameInputPrompt } from './mainmenu/MainMenuNameInputPrompt.tsx'
import { useMainMenu } from './mainmenu/useMainMenu'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

/**
 * The main menu scene component.
 * @returns {JSX.Element} The rendered menu.
 */
export const MainMenu = () => {
  const { showHQ, openHQ, closeHQ } = useBandHQModal()
  const isOnline = useNetworkStatus()
  const prefersReducedMotion = useReducedMotion()

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
    <div className='flex flex-col items-center justify-center h-full w-full bg-void-black z-50 relative overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8'>
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
          backgroundImage: `url("${resolveGenImageUrl(IMG_PROMPTS.MAIN_MENU_BG, isOnline)}")`
        }}
      />
      <div className='absolute inset-0 z-0 bg-gradient-to-b from-void-black/0 to-void-black/90 pointer-events-none' />

      {/* Atmosphere: slow scanning bar */}
      <div
        aria-hidden='true'
        className='absolute inset-x-0 top-0 h-24 z-0 pointer-events-none animate-scan-bar'
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--color-toxic-green-10) 45%, var(--color-toxic-green-20) 50%, var(--color-toxic-green-10) 55%, transparent)'
        }}
      />

      {showHQ && <BandHQ onClose={closeHQ} />}

      <div className='relative z-10 flex w-full max-w-md flex-col items-center'>
        <motion.h1
          initial={
            prefersReducedMotion ? false : { scale: 0.8, opacity: 0, y: -20 }
          }
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.8, ease: 'easeOut' }
          }
          data-text='NEUROTOXIC'
          className="title-ghost text-5xl sm:text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-toxic-green to-toxic-green-dark font-['Metal_Mania'] animate-neon-flicker mb-2 break-words"
          style={{
            WebkitTextStroke: '2px var(--color-toxic-green)',
            filter: 'drop-shadow(0 0 18px var(--color-toxic-green-glow))'
          }}
        >
          NEUROTOXIC
        </motion.h1>

        <AnimatedDivider
          width='100%'
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.6, delay: 0.4 }
          }
          className='bg-gradient-to-r from-transparent via-toxic-green to-transparent mb-4 max-w-md'
        />

        {/* jscpd:ignore-start */}
        <AnimatedSubtitle
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, letterSpacing: '0.5em' }
          }
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={
            prefersReducedMotion ? { duration: 0 } : { duration: 1, delay: 0.6 }
          }
          className='text-lg md:text-2xl text-toxic-green/80 mb-2 font-[Courier_New] text-center'
        >
          {t('ui:mainMenu.subtitle.grindTheVoid')}
        </AnimatedSubtitle>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 1 }}
          className='mb-8 sm:mb-10 px-3 py-1 border border-toxic-green/30 text-[10px] font-mono text-toxic-green/60 tracking-widest'
        >
          v3.0 // EARLY ACCESS
        </motion.div>
        {/* jscpd:ignore-end */}

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.5, delay: 0.8 }
          }
          className='flex w-full max-w-xs flex-col gap-3'
        >
          <GlitchButton
            onClick={handleStartTour}
            isLoading={isStarting}
            className='relative z-20 w-full'
          >
            {t('ui:start_game')}
          </GlitchButton>

          <GlitchButton
            onClick={handleLoad}
            isLoading={isLoadingGame}
            className='relative z-20 w-full border-blood-red text-blood-red hover:bg-blood-red hover:shadow-[4px_4px_0px_var(--color-toxic-green)]'
          >
            {t('ui:load_game')}
          </GlitchButton>

          <GlitchButton
            onClick={openHQ}
            className='relative z-20 w-full border-warning-yellow text-warning-yellow hover:bg-warning-yellow hover:shadow-[4px_4px_0px_var(--color-toxic-green)]'
          >
            {t('ui:band_hq')}
          </GlitchButton>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.2 }}
          className='flex w-full max-w-xs flex-col gap-4 mt-6 items-center'
        >
          <div className='flex w-full flex-wrap justify-center gap-3 sm:gap-4'>
            <GlitchButton
              onClick={() => setShowSocials(true)}
              className='flex-1'
            >
              {t('ui:socials')}
            </GlitchButton>
            <GlitchButton onClick={handleCredits} className='flex-1'>
              {t('ui:credits')}
            </GlitchButton>
          </div>
          <GlitchButton
            onClick={() => setShowFeatures(true)}
            className='w-full'
          >
            {t('ui:features.button')}
          </GlitchButton>
        </motion.div>
      </div>

      {showFeatures && (
        <MainMenuFeatures onClose={() => setShowFeatures(false)} />
      )}

      {showSocials && <MainMenuSocials onClose={() => setShowSocials(false)} />}

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.5 }}
        className='absolute bottom-4 sm:bottom-6 flex w-full flex-col items-center gap-1 z-10 px-4'
      >
        <div className='w-32 h-[1px] bg-gradient-to-r from-transparent via-ash-gray/50 to-transparent' />
        <div className='text-center text-ash-gray text-[10px] font-mono tracking-widest'>
          © 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL
        </div>
      </motion.div>
    </div>
  )
}
