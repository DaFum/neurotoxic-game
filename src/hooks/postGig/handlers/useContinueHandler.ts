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
        updateBand((prevBand: BandState) => {
          const updatedInventory = { ...prevBand.inventory }
          for (const merchKey in financials.soldMerch) {
            if (Object.hasOwn(financials.soldMerch, merchKey)) {
              const soldAmount = financials.soldMerch[merchKey] ?? 0
              const currentAmount =
                typeof updatedInventory[merchKey] === 'number'
                  ? (updatedInventory[merchKey] as number)
                  : 0
              updatedInventory[merchKey] = Math.max(
                0,
                currentAmount - soldAmount
              )
            }
          }
          return { ...prevBand, inventory: updatedInventory }
        })
      }

      const stats = calculateContinueStats({
        player,
        perfScore,
        financials,
        misses: lastGigStats?.misses ?? 0,
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

      // Quest config (label/deadline/penalty) is owned by QUEST_REGISTRY.
      // We build the dispatch payload from the registry definition so there is
      // no inline duplication; the reducer also re-merges defaults defensively.
      if (activeStoryFlags?.includes('cancel_quest_active')) {
        const def = getQuestDefinition(QUEST_APOLOGY_TOUR)
        if (def) {
          addQuest({
            ...def,
            id: QUEST_APOLOGY_TOUR,
            deadline: player.day + finiteNumberOr(def.deadlineOffset, 0),
            progress: 0
          })
        }
      }

      if (activeStoryFlags?.includes('breakup_quest_active')) {
        const def = getQuestDefinition(QUEST_EGO_MANAGEMENT)
        if (def) {
          // Threshold-style harmony quest: seed progress with current band
          // harmony so any harmony recovery that happened earlier this
          // post-gig phase is not lost. Without this seed the new quest would
          // miss the harmony_recovered event applied before it was added.
          const seededProgress =
            def.progressSource === 'harmony_recovered'
              ? (postPenaltyHarmony ??
                clampBandHarmony(finiteNumberOr(band.harmony, 80)))
              : 0
          addQuest({
            ...def,
            id: QUEST_EGO_MANAGEMENT,
            deadline: player.day + finiteNumberOr(def.deadlineOffset, 0),
            progress: seededProgress
          })
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
