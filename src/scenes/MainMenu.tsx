import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { MainMenuSocials } from './mainmenu/MainMenuSocials.tsx'
import { MainMenuFeatures } from './mainmenu/MainMenuFeatures.tsx'
import { MainMenuExistingSavePrompt } from './mainmenu/MainMenuExistingSavePrompt.tsx'
import { MainMenuNameInputPrompt } from './mainmenu/MainMenuNameInputPrompt.tsx'
import { useMainMenu } from './mainmenu/useMainMenu'
import { MainMenuBackground } from './mainmenu/MainMenuBackground'
import { MainMenuHeader } from './mainmenu/MainMenuHeader'
import { MainMenuActionButtons } from './mainmenu/MainMenuActionButtons'
import { MainMenuSecondaryButtons } from './mainmenu/MainMenuSecondaryButtons'
import { MainMenuFooter } from './mainmenu/MainMenuFooter'

// Band HQ and its eleven tabs are only needed once the player opens it, so they
// stay out of the entry chunk the menu itself loads.
const BandHQ = lazy(() =>
  import('../ui/BandHQ').then(m => ({ default: m.BandHQ }))
)

/**
 * Hosts new-tour, load, Band HQ preview, credits, feature, and social menu flows.
 */
export const MainMenu = () => {
  const { t } = useTranslation('ui')
  const { showHQ, openHQ, closeHQ } = useBandHQModal()

  const {
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
    handleStartExpedition,
    handleNameSubmit,
    handleLoad,
    handleCredits,
    closeNameInput,
    handleStartNewAnyway,
    handleLoadExistingFromPrompt
  } = useMainMenu()

  return (
    <div className='flex flex-col items-center h-full w-full bg-void-black relative overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 max-sm:pb-(--tutorial-inset)'>
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

      <MainMenuBackground />

      {showHQ && (
        <Suspense
          fallback={
            <div
              role='status'
              className='fixed inset-0 z-(--z-modal) flex items-center justify-center bg-void-black/80 font-mono text-toxic-green uppercase tracking-widest motion-safe:animate-pulse'
            >
              {t('ui:loading')}
            </div>
          }
        >
          <BandHQ onClose={closeHQ} />
        </Suspense>
      )}

      <div className='relative z-10 my-auto flex w-full max-w-md flex-col items-center'>
        <MainMenuHeader />

        <MainMenuActionButtons
          handleStartTour={handleStartTour}
          handleStartExpedition={handleStartExpedition}
          isStarting={isStarting}
          handleLoad={handleLoad}
          isLoadingGame={isLoadingGame}
          openHQ={openHQ}
        />

        <MainMenuSecondaryButtons
          setShowSocials={setShowSocials}
          handleCredits={handleCredits}
          setShowFeatures={setShowFeatures}
        />
      </div>

      {showFeatures && (
        <MainMenuFeatures onClose={() => setShowFeatures(false)} />
      )}

      {showSocials && <MainMenuSocials onClose={() => setShowSocials(false)} />}

      <MainMenuFooter />
    </div>
  )
}
