import { useBandHQModal } from '../hooks/useBandHQModal'
import { BandHQ } from '../ui/BandHQ'
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

/**
 * Hosts new-tour, load, Band HQ preview, credits, feature, and social menu flows.
 */
export const MainMenu = () => {
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

      <MainMenuBackground />

      {showHQ && <BandHQ onClose={closeHQ} />}

      <div className='relative z-10 flex w-full max-w-md flex-col items-center'>
        <MainMenuHeader />

        <MainMenuActionButtons
          handleStartTour={handleStartTour}
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
