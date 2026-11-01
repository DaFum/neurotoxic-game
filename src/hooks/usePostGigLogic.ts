import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { NEUROTOXIC_PEDAL_HARMONY_PENALTY } from '../context/gameConstants'
import { getTotalDailyObligations } from '../utils/assets/assetSelectors'
import { finiteNumberOr } from '../utils/finiteNumber'
import { usePostGigHandlers } from './usePostGigHandlers'
import { usePostGigState } from './postGig/usePostGigState'
import { usePostGigDerivations } from './postGig/usePostGigDerivations'
import { getExpeditionFinaleProfile } from '../domain/expedition/finales'
import { getEffectiveExpeditionRules } from '../domain/expedition/effectiveRules'
import {
  getExpeditionProtectedCash,
  getExpeditionSpendableCash
} from '../domain/expedition/spendableCash'
import { SPIN_STORY_MONEY_COST } from '../utils/postGig'

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
  const isScreenshotMode = useGameSelector(state => state.isScreenshotMode)
  const band = useGameSelector(state => state.band)
  const assets = useGameSelector(state => state.assets)
  const social = useGameSelector(state => state.social)
  const rivalBand = useGameSelector(state => state.rivalBand)
  const lastGigStats = useGameSelector(state => state.lastGigStats)
  const reputationByRegion = useGameSelector(
    state =>
      state.gigContextSnapshot?.reputationByRegionAtStart ??
      state.reputationByRegion
  )
  const activeStoryFlags = useGameSelector(state => state.activeStoryFlags)
  const activeQuests = useGameSelector(state => state.activeQuests)
  const cityStates = useGameSelector(state => state.gameMap?.cityStates)
  // The continue handler routes completed Expedition Finales to Run Summary
  // and successful Career Finales to the victory screen.
  const isFinaleGig = useGameSelector(
    state =>
      state.gameMap?.nodes?.[state.player.currentNodeId]?.type === 'FINALE'
  )
  const setlist = useGameSelector(state => state.setlist)
  const pendingSettlementId = useGameSelector(
    state => state.pendingGigSettlement?.id ?? null
  )
  const expedition = useGameSelector(state => state.expedition)
  const finaleRewardMultiplier = useGameSelector(state => {
    if (state.expedition?.status !== 'active') return 1
    const profileMultiplier =
      getExpeditionFinaleProfile(state.expedition.finaleType)
        ?.rewardMultiplier ?? 1
    // Tour Pressure deliberately does *not* pay here. It multiplies terminal
    // retained Money and Fame at extraction or completion instead, so the
    // extra reward is only collected by a run that actually survived the
    // danger the modifiers added.
    //
    // The run-draft Finale bonus only pays out on the Finale itself, so it is
    // composed here rather than in the profile multiplier that every node of
    // an active run carries.
    return state.gameMap?.nodes?.[state.player.currentNodeId]?.type === 'FINALE'
      ? profileMultiplier *
          getEffectiveExpeditionRules(state).numeric.finaleRewardMultiplier
      : profileMultiplier
  })
  // Bankruptcy must consult total daily obligations (asset upkeep/revenue and
  // liability payments), not just the gig net (AGENTS.md invariant).
  const totalDailyObligations = useGameSelector(getTotalDailyObligations)
  // Protected Expedition cash is not spendable, so inside a run the button is
  // disabled (with a reason) when spendable cash falls short. Outside a run it
  // stays enabled and the handler shows the too-expensive toast instead.
  const canAffordSpinStory = useGameSelector(
    state =>
      getExpeditionProtectedCash(state) <= 0 ||
      getExpeditionSpendableCash(state) >= SPIN_STORY_MONEY_COST
  )

  // Game Actions
  const {
    updatePlayer,
    triggerEvent,
    updateBand,
    updateSocial,
    applyGigSocialReconciliation,
    addToast,
    changeScene,
    unlockTrait,
    addQuest,
    applyQuestEvent,
    recordExpeditionCrewStressSource,
    completeExpedition,
    saveGameAfterStateCommit,
    recordExpeditionObligationSignal,
    resolveExpeditionSocialResult,
    settleSoldMerch,
    recordPendingGigSettlement,
    clearPendingGigSettlement,
    offerExpeditionDraft,
    commitSocialPost
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
      activeQuests,
      cityStates,
      triggerEvent,
      isScreenshotMode,
      gigRewardMultiplier: finaleRewardMultiplier,
      expedition,
      rivalBand
    })

  // Continue settles the gig, but the player can reload before pressing it.
  // Persist the presented settlement once per gig so a reload on this screen
  // settles it on load instead of losing it. This save is the first POST_GIG
  // save: `usePersistence` does not autosave GIG -> POST_GIG, so no durable
  // snapshot of a played gig exists without its settlement record.
  const recordedFinancialsRef = useRef<typeof financials>(null)
  useEffect(() => {
    if (!financials || !currentGig || !lastGigStats) return
    if (recordedFinancialsRef.current === financials) return
    recordedFinancialsRef.current = financials
    recordPendingGigSettlement({
      gigId: currentGig.id,
      net: financials.net,
      perfScore,
      misses: finiteNumberOr(lastGigStats.misses, 0),
      dealFameMultiplier: finiteNumberOr(financials.dealFameMultiplier, 1),
      soldMerch: financials.soldMerch ?? {}
    })
    saveGameAfterStateCommit()
  }, [
    financials,
    currentGig,
    lastGigStats,
    perfScore,
    recordPendingGigSettlement,
    saveGameAfterStateCommit
  ])

  // 3. Handlers
  const {
    isProcessingAction,
    hasSpun,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
    // jscpd:ignore-start
    // Each layer names its inputs explicitly; usePostGigHandlers keeps its own
    // orchestration, so this flat hand-over is intentional.
  } = usePostGigHandlers({
    player,
    band,
    social,
    rivalBand,
    lastGigStats,
    currentGig,
    postOptionsDerivationError,
    perfScore,
    financials,
    activeStoryFlags,
    setlist,
    expedition,
    activeEvent,
    activeQuests,
    isFinaleGig,
    pendingSettlementId,
    totalDailyObligations,
    updatePlayer,
    updateBand,
    updateSocial,
    applyGigSocialReconciliation,
    unlockTrait,
    addToast,
    changeScene,
    addQuest,
    applyQuestEvent,
    recordExpeditionCrewStressSource,
    completeExpedition,
    saveGameAfterStateCommit,
    recordExpeditionObligationSignal,
    resolveExpeditionSocialResult,
    settleSoldMerch,
    clearPendingGigSettlement,
    offerExpeditionDraft,
    commitSocialPost,
    phase,
    setPhase,
    setPostResult,
    setBrandOffers,
    t
  })
  // jscpd:ignore-end

  // 4. Expose API
  const pedalHarmonyPenalty = band?.inventory?.neurotoxicPedal
    ? Math.min(
        NEUROTOXIC_PEDAL_HARMONY_PENALTY,
        Math.max(0, finiteNumberOr(band.harmony, 1) - 1)
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
    hasSpun,
    canAffordSpinStory,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
