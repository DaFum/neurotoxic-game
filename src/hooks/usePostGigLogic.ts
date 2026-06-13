import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { NEUROTOXIC_PEDAL_HARMONY_PENALTY } from '../context/gameConstants'
import { getTotalDailyObligations } from '../utils/assetSelectors'
import { usePostGigHandlers } from './usePostGigHandlers'
import { usePostGigState } from './postGig/usePostGigState'
import { usePostGigDerivations } from './postGig/usePostGigDerivations'

/**
 * Composes post-gig state, derived results, and action handlers for the post-gig scene.
 * @returns Post-gig view state, financials, social data, and handlers for each phase.
 */
export const usePostGigLogic = () => {
  const { t } = useTranslation(['ui'])

  // Game State Selectors
  const currentGig = useGameSelector(state => state.currentGig)
  const player = useGameSelector(state => state.player)
  const gigModifiers = useGameSelector(state => state.gigModifiers)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const band = useGameSelector(state => state.band)
  const assets = useGameSelector(state => state.assets)
  const social = useGameSelector(state => state.social)
  const lastGigStats = useGameSelector(state => state.lastGigStats)
  const reputationByRegion = useGameSelector(state => state.reputationByRegion)
  const activeStoryFlags = useGameSelector(state => state.activeStoryFlags)
  const cityStates = useGameSelector(state => state.gameMap?.cityStates)
  // FINALE detection: the finale node has no outgoing connections, so the
  // continue handler ends the run on the victory screen instead.
  const isFinaleGig = useGameSelector(
    state =>
      state.gameMap?.nodes?.[state.player.currentNodeId]?.type === 'FINALE'
  )
  const setlist = useGameSelector(state => state.setlist)
  // Bankruptcy must consult total daily obligations (asset upkeep/revenue and
  // liability payments), not just the gig net (AGENTS.md invariant).
  const totalDailyObligations = useGameSelector(getTotalDailyObligations)

  // Game Actions
  const {
    updatePlayer,
    triggerEvent,
    updateBand,
    updateSocial,
    addToast,
    changeScene,
    unlockTrait,
    addQuest,
    applyQuestEvent
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
      assets,
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
    isFinaleGig,
    totalDailyObligations,
    updatePlayer,
    updateBand,
    updateSocial,
    unlockTrait,
    addToast,
    changeScene,
    addQuest,
    applyQuestEvent,
    setPhase,
    setPostResult,
    setBrandOffers,
    t
  })

  // 4. Expose API
  const pedalHarmonyPenalty = band?.inventory?.neurotoxicPedal
    ? Math.min(
        NEUROTOXIC_PEDAL_HARMONY_PENALTY,
        Math.max(0, (band.harmony ?? 0) - 1)
      )
    : 0

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
    changeScene,
    pedalHarmonyPenalty,
    isProcessingAction,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
