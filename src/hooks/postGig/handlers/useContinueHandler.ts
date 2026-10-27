import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_PHASES } from '../../../context/gameConstants'
import type { RhythmSetlistEntry } from '../../../types/rhythmGame'
import type {
  BandState,
  GameState,
  PostGigSummary,
  Venue
} from '../../../types'
import type { PostGigFinancials } from '../../../types/economy'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel,
  calculateFameGain,
  finiteNumberOr,
  BALANCE_CONSTANTS
} from '../../../utils/gameState'
import { logger } from '../../../utils/logger'
import { calculateContinueStats } from '../../../utils/postGig'
import { submitLeaderboardScores } from '../../../utils/leaderboardUtils'
import { buildSoldMerchInventory } from '../../../utils/merchUtils'
import {
  derivePostGigContinueEffects,
  dispatchEconomyQuests,
  drainBandStamina,
  evaluateAcceptedSettlementSolvency,
  handleContinueSceneTransition
} from './continueHandlerUtils'
import type { HandlerDispatchers } from './types'

/** Props for {@link useContinueHandler}: post-gig financials/stats, state slices, the processing guard, translator, and dispatchers. */
interface UseContinueHandlerProps {
  financials: PostGigFinancials | null
  perfScore: number
  player: GameState['player']
  band: GameState['band']
  currentGig: Venue | null
  lastGigStats: PostGigSummary | null
  setlist: RhythmSetlistEntry[]
  expedition: GameState['expedition']
  activeStoryFlags?: string[]
  /** True when the completed gig sits on the FINALE map node. */
  isFinaleGig?: boolean
  /** Id of the persisted settlement this Continue settles. */
  pendingSettlementId?: string | null
  totalDailyObligations: number
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

/**
 * Builds the post-gig "continue" handler: settles merch, fame, harmony, and
 * story-flag quests, submits leaderboard scores, then advances to OVERWORLD or
 * RUN_SUMMARY after committed Expedition completion, or GAMEOVER on bankruptcy.
 * Guarded against re-entrancy.
 */
export function useContinueHandler({
  financials,
  perfScore,
  player,
  band,
  currentGig,
  lastGigStats,
  setlist,
  expedition,
  activeStoryFlags,
  isFinaleGig = false,
  pendingSettlementId = null,
  totalDailyObligations,
  isProcessingActionRef,
  setIsProcessingAction,
  t,
  dispatchers: {
    updatePlayer,
    updateBand,
    addToast,
    changeScene,
    addQuest,
    applyQuestEvent,
    recordExpeditionCrewStressSource,
    completeExpedition,
    saveGameAfterStateCommit,
    recordExpeditionObligationSignal,
    settleSoldMerch,
    clearPendingGigSettlement,
    offerExpeditionDraft
  }
}: UseContinueHandlerProps) {
  const pendingFinaleRef = useRef<{ runId: string | null } | null>(null)
  const [completionRequest, setCompletionRequest] = useState(0)

  useEffect(() => {
    const pending = pendingFinaleRef.current
    if (!pending) return
    pendingFinaleRef.current = null
    // Dispatch acceptance is authoritative: even a rejected action needs a
    // render pass before deciding whether to show the summary or recovery.
    const matchingRun = expedition?.runId === pending.runId
    const completed = matchingRun && expedition?.status === 'completed'
    const finalized =
      matchingRun &&
      (completed ||
        expedition?.status === 'failed' ||
        expedition?.status === 'extracted')
    if (!finalized) {
      changeScene(GAME_PHASES.OVERWORLD)
      return
    }
    saveGameAfterStateCommit(() => {
      if (completed) {
        addToast(
          t('ui:postGig.tourComplete', {
            defaultValue: 'TOUR COMPLETE: You survived the void tour!'
          }),
          'success'
        )
      }
      changeScene(GAME_PHASES.RUN_SUMMARY)
    })
  }, [
    completionRequest,
    expedition,
    saveGameAfterStateCommit,
    changeScene,
    addToast,
    t
  ])

  const handleContinue = useCallback(() => {
    if (!financials) return
    if (isProcessingActionRef.current) return
    isProcessingActionRef.current = true
    setIsProcessingAction(true)
    // Set once a state-changing dispatch has returned: dispatch runs the reducer
    // synchronously and leaves state untouched when it throws, so only a throw
    // after a returned dispatch must not re-open a second payout.
    let committed = false
    try {
      if (financials.soldMerch) {
        if (settleSoldMerch) {
          settleSoldMerch(financials.soldMerch)
        } else {
          const soldMerch = financials.soldMerch
          updateBand((prevBand: BandState) => ({
            inventory: buildSoldMerchInventory(prevBand.inventory, soldMerch)
          }))
        }
        committed = true
      }

      const stats = calculateContinueStats({
        player,
        perfScore,
        financials,
        misses: lastGigStats?.misses ?? 0,
        failed: lastGigStats?.failed === true,
        bandStyle: finiteNumberOr(band.style, 0),
        dealFameMultiplier: financials.dealFameMultiplier,
        calculateFameGain,
        calculateFameLevel,
        clampPlayerFame,
        clampPlayerMoney,
        BALANCE_CONSTANTS
      })

      const { acceptedMoney, insolvent, careerBankrupt } =
        evaluateAcceptedSettlementSolvency({
          expedition,
          previousMoney: player.money,
          proposedMoney: stats.newMoney,
          net: financials.net,
          totalDailyObligations
        })

      const successfulFinale =
        isFinaleGig &&
        !insolvent &&
        !!currentGig?.id &&
        !!lastGigStats &&
        lastGigStats.failed !== true
      const expeditionFinale =
        successfulFinale && expedition?.status === 'active'
      const careerFinale = successfulFinale && expedition?.status === 'idle'

      updatePlayer({
        // Under an active run's protected Career Cash floor only the Cash is
        // refused; the fame the gig earned still lands.
        money: acceptedMoney,
        fame: stats.newFame,
        fameLevel: stats.fameLevel,
        // Surviving the FINALE gig completes the tour; the flag persists in
        // the save and drives the victory variant of the game-over screen.
        ...(careerFinale
          ? { stats: { ...player.stats, tourCompleted: true } }
          : {})
      })
      committed = true
      // Same commit as the settlement above, so no save holds both the
      // settled ledger and a record a later load would settle again.
      if (pendingSettlementId && clearPendingGigSettlement) {
        clearPendingGigSettlement(pendingSettlementId)
      }

      dispatchEconomyQuests(player, stats, applyQuestEvent)

      // The same ordered effects a load replays when it settles a record
      // saved before Continue (`settlePendingGigOnLoad`).
      for (const effect of derivePostGigContinueEffects({
        band,
        day: player.day,
        activeStoryFlags,
        expedition,
        gigId: currentGig?.id,
        lastGigStats,
        isFinaleGig,
        successfulFinale
      })) {
        switch (effect.kind) {
          case 'harmony':
            updateBand(() => ({ harmony: effect.harmony }))
            break
          case 'addQuest':
            addQuest(effect.quest)
            break
          case 'obligationSignal':
            recordExpeditionObligationSignal?.(
              effect.signalType,
              effect.sourceId
            )
            break
          case 'offerMajorGigDraft':
            offerExpeditionDraft?.('major_gig', effect.sourceKey)
            break
          case 'crewStress':
            recordExpeditionCrewStressSource(
              effect.crewId,
              effect.sourceType,
              effect.sourceId
            )
            break
          case 'staminaDrain':
            updateBand((prevBand: BandState) =>
              drainBandStamina(prevBand, effect.amount)
            )
            break
        }
      }

      submitLeaderboardScores({
        player,
        lastGigStats,
        currentGig,
        setlist
      }).catch(err =>
        logger.error('PostGig', 'submitLeaderboardScores failed', {
          err,
          player,
          currentGig
        })
      )

      if (expeditionFinale) {
        pendingFinaleRef.current = { runId: expedition.runId }
        setCompletionRequest(request => request + 1)
        completeExpedition(`gig:${currentGig.id}`)
        return
      }

      handleContinueSceneTransition({
        bankrupt: careerBankrupt,
        isFinaleGig: careerFinale,
        addToast,
        changeScene,
        t
      })
      // Guard intentionally NOT reset here: the scene transition (queued via
      // queueMicrotask) owns the lifecycle. Resetting before the microtask runs
      // would re-open a settlement window for rapid double-clicks.
    } catch (err) {
      logger.error(
        'PostGig handleContinue',
        'Unexpected error in continue flow',
        { err, player, currentGig }
      )
      if (committed) {
        // The settlement already landed: keep the guard closed and move on
        // instead of offering the same payout again.
        changeScene(GAME_PHASES.OVERWORLD)
        return
      }
      isProcessingActionRef.current = false
      setIsProcessingAction(false)
    }
  }, [
    financials,
    perfScore,
    isFinaleGig,
    player,
    currentGig,
    lastGigStats,
    updatePlayer,
    updateBand,
    addToast,
    changeScene,
    activeStoryFlags,
    totalDailyObligations,
    addQuest,
    applyQuestEvent,
    recordExpeditionCrewStressSource,
    completeExpedition,
    recordExpeditionObligationSignal,
    settleSoldMerch,
    clearPendingGigSettlement,
    pendingSettlementId,
    offerExpeditionDraft,
    setlist,
    expedition,
    band,
    t,
    isProcessingActionRef,
    setIsProcessingAction
  ])

  return handleContinue
}
