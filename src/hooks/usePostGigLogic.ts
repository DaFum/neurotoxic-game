import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { usePostGigHandlers } from './usePostGigHandlers'
import { usePostGigState } from './postGig/usePostGigState'
import { usePostGigDerivations } from './postGig/usePostGigDerivations'

export const usePostGigLogic = () => {
  const { t } = useTranslation(['ui'])

  // Game State Selectors
  const currentGig = useGameSelector(state => state.currentGig)
  const player = useGameSelector(state => state.player)
  const gigModifiers = useGameSelector(state => state.gigModifiers)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const lastGigStats = useGameSelector(state => state.lastGigStats)
  const reputationByRegion = useGameSelector(state => state.reputationByRegion)
  const activeStoryFlags = useGameSelector(state => state.activeStoryFlags)
  const cityStates = useGameSelector(state => state.gameMap?.cityStates)
  const setlist = useGameSelector(state => state.setlist)

  // Game Actions
  const {
    updatePlayer,
    triggerEvent,
    updateBand,
    updateSocial,
    addToast,
    changeScene,
    unlockTrait,
    addQuest
  } = useGameActions()

  // 1. Core State
  const {
    phase,
    setPhase,
    postResult,
    setPostResult,
    brandOffers,
    setBrandOffers,
    phaseTitleKey,
    phaseTitleDefault
  } = usePostGigState()

  // 2. Derivations and Side Effects
  const { perfScore, financials, postOptions, postOptionsDerivationError } =
    usePostGigDerivations({
      currentGig,
      player,
      gigModifiers,
      activeEvent,
      band,
      social,
      lastGigStats,
      reputationByRegion,
      activeStoryFlags,
      cityStates,
      triggerEvent
    })

  // 3. Handlers
  const {
    isProcessingAction,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  } = usePostGigHandlers({
    player,
    band,
    social,
    lastGigStats,
    currentGig,
    postOptionsDerivationError,
    perfScore,
    financials,
    activeStoryFlags,
    setlist,
    updatePlayer,
    updateBand,
    updateSocial,
    unlockTrait,
    addToast,
    changeScene,
    addQuest,
    setPhase,
    setPostResult,
    setBrandOffers,
    t
  })

  // 4. Expose API
  return {
    t,
    phase,
    financials,
    postOptions,
    postResult,
    brandOffers,
    phaseTitleKey,
    phaseTitleDefault,
    social,
    player,
    isProcessingAction,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
