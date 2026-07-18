import { useCallback } from 'react'
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
import { calculateContinueStats } from '../../../utils/postGigUtils'
import { shouldTriggerBankruptcy } from '../../../utils/economyEngine'
import { submitLeaderboardScores } from '../../../utils/leaderboardUtils'
import {
  applyNeurotoxicPenalty,
  buildSoldMerchInventory,
  buildStoryFlagQuests,
  dispatchEconomyQuests,
  handleContinueSceneTransition
} from './continueHandlerUtils'
import type { HandlerDispatchers } from './types'

/** Props for {@link useContinueHandler}: post-gig financials/stats, state slices, the processing guard, translator, and dispatchers. */
export interface UseContinueHandlerProps {
  financials: PostGigFinancials | null
  perfScore: number
  player: GameState['player']
  band: GameState['band']
  currentGig: Venue | null
  lastGigStats: PostGigSummary | null
  setlist: RhythmSetlistEntry[]
  activeStoryFlags?: string[]
  /** True when the completed gig sits on the FINALE map node — routes to the victory end screen instead of the overworld. */
  isFinaleGig?: boolean
  totalDailyObligations: number
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

/**
 * Builds the post-gig "continue" handler: settles merch, fame, harmony, and
 * story-flag quests, submits leaderboard scores, then advances to OVERWORLD or
 * GAMEOVER (on bankruptcy). Guarded against re-entrancy.
 */
export function useContinueHandler({
  financials,
  perfScore,
  player,
  band,
  currentGig,
  lastGigStats,
  setlist,
  activeStoryFlags,
  isFinaleGig = false,
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
    applyQuestEvent
  }
}: UseContinueHandlerProps) {
  const handleContinue = useCallback(() => {
    if (!financials) return
    if (isProcessingActionRef.current) return
    isProcessingActionRef.current = true
    setIsProcessingAction(true)
    try {
      if (financials.soldMerch) {
        const soldMerch = financials.soldMerch
        updateBand((prevBand: BandState) => ({
          ...prevBand,
          inventory: buildSoldMerchInventory(prevBand.inventory, soldMerch)
        }))
      }

      const stats = calculateContinueStats({
        player,
        perfScore,
        financials,
        misses: lastGigStats?.misses ?? 0,
        bandStyle: finiteNumberOr(band.style, 0),
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

      updatePlayer({
        money: stats.newMoney,
        fame: stats.newFame,
        fameLevel: stats.fameLevel,
        lastGigNodeId: player.currentNodeId,
        // Surviving the FINALE gig completes the tour; the flag persists in
        // the save and drives the victory variant of the game-over screen.
        ...(isFinaleGig && !bankrupt
          ? { stats: { ...player.stats, tourCompleted: true } }
          : {})
      })

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

      handleContinueSceneTransition({
        bankrupt,
        isFinaleGig,
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
    setlist,
    band,
    t,
    isProcessingActionRef,
    setIsProcessingAction
  ])

  return handleContinue
}
