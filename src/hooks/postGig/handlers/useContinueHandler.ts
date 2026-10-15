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
  clampMemberStamina,
  readMemberStamina,
  calculateFameLevel,
  calculateFameGain,
  finiteNumberOr,
  BALANCE_CONSTANTS
} from '../../../utils/gameState'
import { logger } from '../../../utils/logger'
import { calculateContinueStats } from '../../../utils/postGig'
import { shouldTriggerBankruptcy } from '../../../utils/economy'
import { submitLeaderboardScores } from '../../../utils/leaderboardUtils'
import {
  applyNeurotoxicPenalty,
  buildSoldMerchInventory,
  buildStoryFlagQuests,
  dispatchEconomyQuests,
  handleContinueSceneTransition
} from './continueHandlerUtils'
import { getExpeditionFinaleProfile } from '../../../domain/expedition/finales'
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
      }

      const stats = calculateContinueStats({
        player,
        perfScore,
        financials,
        misses: lastGigStats?.misses ?? 0,
        bandStyle: finiteNumberOr(band.style, 0),
        dealFameMultiplier: financials.dealFameMultiplier,
        calculateFameGain,
        calculateFameLevel,
        clampPlayerFame,
        clampPlayerMoney,
        BALANCE_CONSTANTS
      })

      const bankrupt = shouldTriggerBankruptcy(
        stats.newMoney,
        financials.net,
        totalDailyObligations
      )

      const successfulFinale =
        isFinaleGig &&
        !bankrupt &&
        !!currentGig?.id &&
        !!lastGigStats &&
        lastGigStats.failed !== true
      const expeditionFinale =
        successfulFinale && expedition?.status === 'active'
      const careerFinale = successfulFinale && expedition?.status === 'idle'

      updatePlayer({
        money: stats.newMoney,
        fame: stats.newFame,
        fameLevel: stats.fameLevel,
        // Surviving the FINALE gig completes the tour; the flag persists in
        // the save and drives the victory variant of the game-over screen.
        ...(careerFinale
          ? { stats: { ...player.stats, tourCompleted: true } }
          : {})
      })
      // Same commit as the settlement above, so no save holds both the
      // settled ledger and a record a later load would settle again.
      if (pendingSettlementId && clearPendingGigSettlement) {
        clearPendingGigSettlement(pendingSettlementId)
      }

      dispatchEconomyQuests(player, stats, applyQuestEvent)

      const postPenaltyHarmony = applyNeurotoxicPenalty(band, updateBand)

      // Quest config (label/deadline/penalty) is owned by QUEST_REGISTRY;
      // buildStoryFlagQuests assembles the payloads from registry definitions
      // (no inline duplication) and the reducer re-merges defaults defensively.
      for (const quest of buildStoryFlagQuests({
        activeStoryFlags,
        day: player.day,
        bandHarmony: band.harmony,
        postPenaltyHarmony
      })) {
        addQuest(quest)
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

      const accuracy = lastGigStats?.accuracy
      if (expedition?.status === 'active' && currentGig?.id) {
        if (recordExpeditionObligationSignal) {
          recordExpeditionObligationSignal('gig', currentGig.id)
          if (successfulFinale) {
            recordExpeditionObligationSignal('finale', currentGig.id)
          }
        }
        // A completed major gig is a Run Draft moment (spec §9). The reducer
        // proves the node is a Festival and the gig did not fail, so this only
        // names the moment; the Finale ends the run, so no draft follows it.
        if (
          offerExpeditionDraft &&
          !isFinaleGig &&
          lastGigStats?.failed !== true
        ) {
          offerExpeditionDraft('major_gig', currentGig.id)
        }
        if (
          typeof accuracy === 'number' &&
          Number.isFinite(accuracy) &&
          (accuracy < 60 || accuracy >= 80)
        ) {
          const sourceType = accuracy < 60 ? 'poor_gig' : 'successful_gig'
          const sourceId = `gig:${currentGig.id}:${expedition.routeStep}`
          for (const crewId of expedition.loadout?.crewIds ?? []) {
            recordExpeditionCrewStressSource(crewId, sourceType, sourceId)
          }
        }

        // Apply Finale stamina multiplier to member stamina
        if (isFinaleGig && Array.isArray(band.members)) {
          const finaleProfile = getExpeditionFinaleProfile(
            expedition.finaleType
          )
          const staminaMultiplier = finaleProfile?.staminaDrainMultiplier ?? 1
          if (staminaMultiplier > 1) {
            const baseDrain = 15
            const extraDrain = Math.round(baseDrain * (staminaMultiplier - 1))
            if (extraDrain > 0) {
              updateBand((prevBand: BandState) => {
                if (!Array.isArray(prevBand.members)) return prevBand
                const members = prevBand.members.map(member => {
                  if (!member) return member
                  const maxStamina = finiteNumberOr(member.staminaMax, 100)
                  const currentStamina = readMemberStamina(
                    member.stamina,
                    maxStamina
                  )
                  return {
                    ...member,
                    stamina: clampMemberStamina(
                      currentStamina - extraDrain,
                      maxStamina
                    )
                  }
                })
                return { ...prevBand, members }
              })
            }
          }
        }
      }

      if (expeditionFinale) {
        pendingFinaleRef.current = { runId: expedition.runId }
        setCompletionRequest(request => request + 1)
        completeExpedition(`gig:${currentGig.id}`)
        return
      }

      handleContinueSceneTransition({
        bankrupt,
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
