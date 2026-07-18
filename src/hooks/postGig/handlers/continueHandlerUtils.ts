import type { BandState, GameState } from '../../../types'
import {
  GAME_PHASES,
  NEUROTOXIC_PEDAL_HARMONY_PENALTY
} from '../../../context/gameConstants'
import {
  QUEST_APOLOGY_TOUR,
  QUEST_EGO_MANAGEMENT
} from '../../../data/questsConstants'
import { getQuestDefinition } from '../../../data/questRegistry'
import { clampBandHarmony, finiteNumberOr } from '../../../utils/gameState'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../../quests/producers/economyQuestEvents'
import { getRegionKeyForLocation } from '../../../utils/mapUtils'
import type { HandlerDispatchers } from './types'

// Pure/orchestration seams for useContinueHandler, kept in a dedicated module
// so they can be unit-tested directly while the hook module exports only the
// hook itself.

type AddQuestInput = Parameters<HandlerDispatchers['addQuest']>[0]

/**
 * Decrements sold-merch counts from a band inventory, clamped at zero (pure).
 * @param inventory - Current band inventory.
 * @param soldMerch - Quantities sold this gig, keyed by merch id.
 * @returns A new inventory record with sold quantities removed.
 */
export function buildSoldMerchInventory(
  inventory: BandState['inventory'] | undefined | null,
  soldMerch: Record<string, number>
): BandState['inventory'] {
  const updatedInventory = { ...(inventory || {}) }
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

/**
 * Evaluates fame and money gains to apply economy quest events.
 */
export function dispatchEconomyQuests(
  player: GameState['player'],
  stats: { newFame: number; newMoney: number },
  applyQuestEvent: HandlerDispatchers['applyQuestEvent']
): void {
  const fameGain = stats.newFame - finiteNumberOr(player?.fame, 0)
  if (fameGain > 0) {
    // Region context lets perRegion fame quests (quest_local_legend)
    // gate progress to the actual region where it was earned. Use the
    // canonical city key so it matches the stamped quest scopeKey.
    applyQuestEvent(
      createFameGainedQuestEvent({
        region: getRegionKeyForLocation(player?.location) ?? 'Unknown',
        amount: fameGain,
        reason: 'post_gig_fame'
      })
    )
  }

  const moneyGain = stats.newMoney - finiteNumberOr(player?.money, 0)
  if (moneyGain > 0) {
    applyQuestEvent(
      createMoneyEarnedQuestEvent({
        amount: moneyGain
      })
    )
  }
}

/**
 * Applies the neurotoxic pedal harmony penalty, returning the post-penalty harmony level.
 */
export function applyNeurotoxicPenalty(
  band: GameState['band'],
  updateBand: HandlerDispatchers['updateBand']
): number | undefined {
  if (band.inventory?.neurotoxicPedal) {
    const nextHarmony = clampBandHarmony(
      finiteNumberOr(band.harmony, 80) - NEUROTOXIC_PEDAL_HARMONY_PENALTY
    )
    updateBand((prevBand: BandState) => {
      return {
        ...prevBand,
        harmony: nextHarmony
      }
    })
    return nextHarmony
  }
  return undefined
}

/**
 * Handles the scene transitions, including toasts and microtasks for bankrupt/finale scenarios.
 */
export function handleContinueSceneTransition(params: {
  bankrupt: boolean
  isFinaleGig: boolean
  addToast: HandlerDispatchers['addToast']
  changeScene: HandlerDispatchers['changeScene']
  t: import('i18next').TFunction
}): void {
  const { bankrupt, isFinaleGig, addToast, changeScene, t } = params
  if (bankrupt) {
    addToast(
      t('ui:postGig.gameOverBankrupt', {
        defaultValue: 'GAME OVER: BANKRUPT! The tour is over.'
      }),
      'error'
    )
    changeScene(GAME_PHASES.GAMEOVER)
  } else if (isFinaleGig) {
    // The FINALE node has no outgoing connections by design — instead of
    // returning to a dead-end overworld, end the run on the victory screen.
    addToast(
      t('ui:postGig.tourComplete', {
        defaultValue: 'TOUR COMPLETE: You survived the void tour!'
      }),
      'success'
    )
    queueMicrotask(() => {
      changeScene(GAME_PHASES.GAMEOVER)
    })
  } else {
    queueMicrotask(() => {
      changeScene(GAME_PHASES.OVERWORLD)
    })
  }
}
