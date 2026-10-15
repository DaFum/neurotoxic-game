import type { BandState, GameState, PostGigSummary } from '../../../types'
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
  clampBandHarmony,
  clampMemberStamina,
  finiteNumberOr,
  readMemberStamina
} from '../../../utils/gameState'
import { getExpeditionFinaleProfile } from '../../../domain/expedition/finales'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../../quests/producers/economyQuestEvents'
import { getRegionKeyForLocation } from '../../../utils/mapUtils'
import type { HandlerDispatchers } from './types'
import { FLAGS } from '../../../data/flags.registry'

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
      const currentAmount = finiteNumberOr(updatedInventory[merchKey], 0)
      updatedInventory[merchKey] = Math.max(0, currentAmount - soldAmount)
    }
  }
  return updatedInventory
}

const STORY_QUEST_MAPPING = [
  { flag: FLAGS.CANCEL_QUEST_ACTIVE, questId: QUEST_APOLOGY_TOUR },
  { flag: FLAGS.BREAKUP_QUEST_ACTIVE, questId: QUEST_EGO_MANAGEMENT }
]

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

  if (!activeStoryFlags) return quests

  const pushQuest = (questId: string, progress: number) => {
    const def = getQuestDefinition(questId)
    if (def) {
      quests.push({
        ...def,
        id: questId,
        deadline: day + finiteNumberOr(def.deadlineOffset, 0),
        progress
      })
    }
  }

  for (const { flag, questId } of STORY_QUEST_MAPPING) {
    if (activeStoryFlags.includes(flag)) {
      if (questId === QUEST_EGO_MANAGEMENT) {
        const def = getQuestDefinition(questId)
        let seededProgress = 0
        if (def?.progressSource === 'harmony_recovered') {
          const fallbackHarmony = clampBandHarmony(
            finiteNumberOr(bandHarmony, 80)
          )
          seededProgress = clampBandHarmony(
            finiteNumberOr(postPenaltyHarmony, fallbackHarmony)
          )
        }
        pushQuest(questId, seededProgress)
      } else {
        pushQuest(questId, 0)
      }
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
 * Harmony after the Neurotoxic Pedal penalty, or `undefined` without the pedal (pure).
 */
export function getNeurotoxicPenaltyHarmony(
  band: GameState['band']
): number | undefined {
  if (!band.inventory?.neurotoxicPedal) return undefined
  return clampBandHarmony(
    finiteNumberOr(band.harmony, 80) - NEUROTOXIC_PEDAL_HARMONY_PENALTY
  )
}

/** Base stamina a Finale drains; the Finale profile multiplier scales the extra. */
const FINALE_BASE_STAMINA_DRAIN = 15

/**
 * Lowers every member's stamina by `amount`, clamped to each member's range (pure).
 * @returns A band patch replacing `members`, or the band unchanged without members.
 */
export function drainBandStamina(
  band: BandState,
  amount: number
): Partial<BandState> {
  if (!Array.isArray(band.members)) return band
  const members = band.members.map(member => {
    if (!member) return member
    const maxStamina = finiteNumberOr(member.staminaMax, 100)
    const currentStamina = readMemberStamina(member.stamina, maxStamina)
    return {
      ...member,
      stamina: clampMemberStamina(currentStamina - amount, maxStamina)
    }
  })
  return { ...band, members }
}

/**
 * One state change Continue applies after the money/fame ledger, in order.
 * Continue dispatches each through its action creator; a load that settles a
 * pending record applies each through the matching reducer handler.
 */
export type PostGigContinueEffect =
  | { kind: 'harmony'; harmony: number }
  | { kind: 'addQuest'; quest: AddQuestInput }
  | {
      kind: 'obligationSignal'
      signalType: 'gig' | 'finale'
      sourceId: string
    }
  | { kind: 'offerMajorGigDraft'; sourceKey: string }
  | {
      kind: 'crewStress'
      crewId: string
      sourceType: 'poor_gig' | 'successful_gig'
      sourceId: string
    }
  | { kind: 'staminaDrain'; amount: number }

/**
 * Derives the ordered post-gig effects that follow the ledger: the Neurotoxic
 * Pedal penalty, story-flag quests, Expedition Contract signals, the Festival
 * Run Draft offer, accuracy-based crew Stress and the extra Finale stamina
 * drain (pure). Reads the state the post-gig screen shows, before Continue.
 */
export function derivePostGigContinueEffects(params: {
  band: GameState['band']
  day: number
  activeStoryFlags: string[] | undefined
  expedition: GameState['expedition'] | undefined
  gigId: string | undefined
  lastGigStats: PostGigSummary | null
  isFinaleGig: boolean
  successfulFinale: boolean
}): PostGigContinueEffect[] {
  const {
    band,
    day,
    activeStoryFlags,
    expedition,
    gigId,
    lastGigStats,
    isFinaleGig,
    successfulFinale
  } = params
  const effects: PostGigContinueEffect[] = []

  const postPenaltyHarmony = getNeurotoxicPenaltyHarmony(band)
  if (postPenaltyHarmony !== undefined) {
    effects.push({ kind: 'harmony', harmony: postPenaltyHarmony })
  }

  // Quest config (label/deadline/penalty) is owned by QUEST_REGISTRY;
  // buildStoryFlagQuests assembles the payloads from registry definitions
  // (no inline duplication) and the reducer re-merges defaults defensively.
  for (const quest of buildStoryFlagQuests({
    activeStoryFlags,
    day,
    bandHarmony: band.harmony,
    postPenaltyHarmony
  })) {
    effects.push({ kind: 'addQuest', quest })
  }

  if (expedition?.status !== 'active' || !gigId) return effects

  effects.push({ kind: 'obligationSignal', signalType: 'gig', sourceId: gigId })
  if (successfulFinale) {
    effects.push({
      kind: 'obligationSignal',
      signalType: 'finale',
      sourceId: gigId
    })
  }
  // A completed major gig is a Run Draft moment (spec §9). The reducer
  // proves the node is a Festival and the gig did not fail, so this only
  // names the moment; the Finale ends the run, so no draft follows it.
  if (!isFinaleGig && lastGigStats?.failed !== true) {
    effects.push({ kind: 'offerMajorGigDraft', sourceKey: gigId })
  }
  const accuracy = lastGigStats?.accuracy
  if (
    typeof accuracy === 'number' &&
    Number.isFinite(accuracy) &&
    (accuracy < 60 || accuracy >= 80)
  ) {
    const sourceType = accuracy < 60 ? 'poor_gig' : 'successful_gig'
    const sourceId = `gig:${gigId}:${expedition.routeStep}`
    for (const crewId of expedition.loadout?.crewIds ?? []) {
      effects.push({ kind: 'crewStress', crewId, sourceType, sourceId })
    }
  }

  // Apply Finale stamina multiplier to member stamina
  if (isFinaleGig && Array.isArray(band.members)) {
    const staminaMultiplier =
      getExpeditionFinaleProfile(expedition.finaleType)
        ?.staminaDrainMultiplier ?? 1
    if (staminaMultiplier > 1) {
      const extraDrain = Math.round(
        FINALE_BASE_STAMINA_DRAIN * (staminaMultiplier - 1)
      )
      if (extraDrain > 0) {
        effects.push({ kind: 'staminaDrain', amount: extraDrain })
      }
    }
  }

  return effects
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
    return
  }

  if (isFinaleGig) {
    // The FINALE node has no outgoing connections by design — instead of
    // returning to a dead-end overworld, end the run on the victory screen.
    addToast(
      t('ui:postGig.tourComplete', {
        defaultValue: 'TOUR COMPLETE: You survived the void tour!'
      }),
      'success'
    )
  }

  // Guard intentionally NOT reset here: the scene transition (queued via
  // queueMicrotask) owns the lifecycle.
  const targetPhase = isFinaleGig ? GAME_PHASES.GAMEOVER : GAME_PHASES.OVERWORLD
  queueMicrotask(() => {
    changeScene(targetPhase)
  })
}
