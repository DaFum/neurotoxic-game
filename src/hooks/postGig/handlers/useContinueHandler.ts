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
  GAME_PHASES,
  NEUROTOXIC_PEDAL_HARMONY_PENALTY
} from '../../../context/gameConstants'
import {
  QUEST_APOLOGY_TOUR,
  QUEST_EGO_MANAGEMENT
} from '../../../data/questsConstants'
import { getQuestDefinition } from '../../../data/questRegistry'
import {
  clampPlayerMoney,
  clampPlayerFame,
  clampBandHarmony,
  calculateFameLevel,
  calculateFameGain,
  finiteNumberOr,
  BALANCE_CONSTANTS
} from '../../../utils/gameState'
import { logger } from '../../../utils/logger'
import { calculateContinueStats } from '../../../utils/postGigUtils'
import { shouldTriggerBankruptcy } from '../../../utils/economyEngine'
import { submitLeaderboardScores } from '../../../utils/leaderboardUtils'
import { createRegionReputationChangedQuestEvent } from '../../../quests/producers/venueQuestEvents'
import type { HandlerDispatchers } from './types'

type AddQuestInput = Parameters<HandlerDispatchers['addQuest']>[0]

/**
 * Decrements sold-merch counts from a band inventory, clamped at zero (pure).
 * @param inventory - Current band inventory.
 * @param soldMerch - Quantities sold this gig, keyed by merch id.
 * @returns A new inventory record with sold quantities removed.
 */
export function buildSoldMerchInventory(
  inventory: BandState['inventory'],
  soldMerch: Record<string, number>
): BandState['inventory'] {
  const updatedInventory = { ...inventory }
  for (const merchKey in soldMerch) {
    if (Object.hasOwn(soldMerch, merchKey)) {
      const soldAmount = Math.max(0, finiteNumberOr(soldMerch[merchKey], 0))
      const currentAmount =
        typeof updatedInventory[merchKey] === 'number'
          ? (updatedInventory[merchKey] as number)
          : 0
      updatedInventory[merchKey] = Math.max(0, currentAmount - soldAmount)
    }
  }
  return updatedInventory
}

/**
 * Builds the post-gig story-flag quest payloads (apology tour, ego management)
 * from the quest registry. Threshold-style harmony quests seed progress with
 * the current/post-penalty harmony so earlier recovery is not lost (pure).
 * @returns Quest payloads to dispatch via `addQuest` (empty when no flags set).
 */
export function buildStoryFlagQuests(params: {
  activeStoryFlags: string[] | undefined
  day: number
  bandHarmony: number | undefined
  postPenaltyHarmony: number | undefined
}): AddQuestInput[] {
  const { activeStoryFlags, day, bandHarmony, postPenaltyHarmony } = params
  const quests: AddQuestInput[] = []

  if (activeStoryFlags?.includes('cancel_quest_active')) {
    const def = getQuestDefinition(QUEST_APOLOGY_TOUR)
    if (def) {
      quests.push({
        ...def,
        id: QUEST_APOLOGY_TOUR,
        deadline: day + finiteNumberOr(def.deadlineOffset, 0),
        progress: 0
      })
    }
  }

  if (activeStoryFlags?.includes('breakup_quest_active')) {
    const def = getQuestDefinition(QUEST_EGO_MANAGEMENT)
    if (def) {
      // Threshold-style harmony quest: seed progress with current band harmony
      // so any harmony recovery earlier this post-gig phase is not lost.
      const seededProgress =
        def.progressSource === 'harmony_recovered'
          ? (postPenaltyHarmony ??
            clampBandHarmony(finiteNumberOr(bandHarmony, 80)))
          : 0
      quests.push({
        ...def,
        id: QUEST_EGO_MANAGEMENT,
        deadline: day + finiteNumberOr(def.deadlineOffset, 0),
        progress: seededProgress
      })
    }
  }

  return quests
}

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

      updatePlayer({
        money: stats.newMoney,
        fame: stats.newFame,
        fameLevel: stats.fameLevel,
        lastGigNodeId: player.currentNodeId
      })

      const fameGain = stats.newFame - finiteNumberOr(player.fame, 0)
      if (fameGain > 0) {
        // Region context lets perRegion fame quests (quest_local_legend)
        // gate progress to the actual region where it was earned.
        applyQuestEvent(
          createRegionReputationChangedQuestEvent({
            region: player.location,
            amount: fameGain,
            reason: 'post_gig_fame'
          })
        )
      }

      let postPenaltyHarmony: number | undefined
      if (band.inventory?.neurotoxicPedal) {
        const nextHarmony = clampBandHarmony(
          finiteNumberOr(band.harmony, 80) - NEUROTOXIC_PEDAL_HARMONY_PENALTY
        )
        postPenaltyHarmony = nextHarmony
        updateBand((prevBand: BandState) => {
          return {
            ...prevBand,
            harmony: nextHarmony
          }
        })
      }

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

      if (shouldTriggerBankruptcy(stats.newMoney, financials.net)) {
        addToast(
          t('ui:postGig.gameOverBankrupt', {
            defaultValue: 'GAME OVER: BANKRUPT! The tour is over.'
          }),
          'error'
        )
        changeScene(GAME_PHASES.GAMEOVER)
      } else {
        queueMicrotask(() => {
          changeScene(GAME_PHASES.OVERWORLD)
        })
      }
    } catch (err) {
      logger.error(
        'PostGig handleContinue',
        'Unexpected error in continue flow',
        { err, player, currentGig }
      )
    } finally {
      isProcessingActionRef.current = false
      setIsProcessingAction(false)
    }
  }, [
    financials,
    perfScore,
    player,
    currentGig,
    lastGigStats,
    updatePlayer,
    updateBand,
    addToast,
    changeScene,
    activeStoryFlags,
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
