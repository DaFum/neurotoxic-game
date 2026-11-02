import type { GameState, ToastPayload } from '../types'
import { finiteNumberOr } from '../utils/gameState'
import { QUEST_PROVE_YOURSELF } from '../data/questsConstants'
import { applyQuestRewards } from './questRewards'
import {
  getQuestWithDefinition,
  getQuestToastName,
  addStoryFlags
} from './questHelpers'
import { addQuest } from './questAdd'
import { QuestEvents } from '../utils/questProgress'
import { getRegionKeyForLocation } from '../utils/mapUtils'
import {
  createMoneyEarnedQuestEvent,
  createFameGainedQuestEvent
} from '../quests/producers/economyQuestEvents'
import { createHarmonyChangedQuestEvent } from '../quests/producers/gigQuestEvents'

/**
 * Resolves an active quest, applies rewards, and triggers followup logic.
 *
 * @remarks
 * This function handles the removal of the quest from the active list, applies
 * rewards via `applyQuestRewards`, updates story flags (both completing and clearing
 * transient ones), manages cooldown policies, handles scope keys for isolation, and
 * optionally queues up a followup quest if one is defined. It operates immutably on
 * the game state.
 *
 * @param state - The current game state.
 * @returns The updated game state after quest completion, or the exact unmodified original state reference if the quest cannot be found or resolved.
 */
export const completeQuest = (
  state: GameState,
  { questId, randomIdx }: { questId: string; randomIdx?: number }
): GameState => {
  if (!state.activeQuests) return state
  const questIndex = state.activeQuests.findIndex(q => q?.id === questId)
  if (questIndex === -1) return state

  const activeQuest = state.activeQuests[questIndex]
  if (!activeQuest) return state
  const quest = getQuestWithDefinition(activeQuest)
  let nextState = { ...state }

  // Remove from activeQuests
  nextState.activeQuests = state.activeQuests
    .slice(0, questIndex)
    .concat(state.activeQuests.slice(questIndex + 1))

  const rewardResult = applyQuestRewards(nextState, quest, randomIdx)
  nextState = rewardResult.state
  const moneyGain =
    finiteNumberOr(nextState.player?.money, 0) -
    finiteNumberOr(state.player?.money, 0)
  const fameGain =
    finiteNumberOr(nextState.player?.fame, 0) -
    finiteNumberOr(state.player?.fame, 0)
  // `applyQuestRewards` owns the harmony write and its clamp; the event reports
  // the change it actually applied, read with the same fallback it uses.
  const nextHarmony = finiteNumberOr(nextState.band?.harmony, 1)
  const harmonyChange = nextHarmony - finiteNumberOr(state.band?.harmony, 1)
  const generatedToasts: ToastPayload[] = [...rewardResult.toasts]

  if (generatedToasts.length === 0) {
    generatedToasts.push({
      id: `${questId}-generic`,
      messageKey: 'ui:toast.quest_complete',
      options: { name: getQuestToastName(quest) },
      type: 'success'
    })
  }

  const completionFlags = addStoryFlags(nextState.activeStoryFlags, [
    quest.rewardFlag,
    ...(Array.isArray(quest.completionFlags) ? quest.completionFlags : [])
  ])
  if (completionFlags !== nextState.activeStoryFlags) {
    nextState.activeStoryFlags = completionFlags
  }

  // Toast
  nextState.toasts = [...(nextState.toasts ?? []), ...generatedToasts]

  // Track completion so repeatPolicy:'never' quests can be blocked later.
  if (!nextState.completedQuestIds?.includes(quest.id)) {
    nextState.completedQuestIds = [
      ...(nextState.completedQuestIds ?? []),
      quest.id
    ]
  }

  // Scope-policy quests record (id, scopeKey) so other scopes stay open.
  if (typeof quest.scopeKey === 'string' && quest.scopeKey.length > 0) {
    const scopes = nextState.completedQuestScopes ?? []
    const exists = scopes.some(
      c => c?.questId === quest.id && c?.scopeKey === quest.scopeKey
    )
    if (!exists) {
      nextState.completedQuestScopes = [
        ...(nextState.completedQuestScopes ?? []),
        { questId: quest.id, scopeKey: quest.scopeKey }
      ]
    }
  }

  // Clear transient story flags tied to this quest being active. Both the
  // explicit clearFlagsOnComplete list AND any startFlags this quest applied
  // are removed so gated follow-ups are no longer blocked.
  const toClear = new Set<string>()
  if (Array.isArray(quest.clearFlagsOnComplete)) {
    for (const f of quest.clearFlagsOnComplete) toClear.add(f)
  }
  if (Array.isArray(quest.startFlags)) {
    for (const f of quest.startFlags) toClear.add(f)
  }
  if (toClear.size > 0) {
    const activeFlags = nextState.activeStoryFlags ?? []
    const newFlags = activeFlags.filter(f => !toClear.has(f))
    if (newFlags.length !== activeFlags.length) {
      nextState.activeStoryFlags = newFlags
    }
  }

  // Cooldown-policy quests start a re-add cooldown on completion. `quest` is
  // already merged with its registry definition, so no second lookup is needed.
  const cooldownDays = finiteNumberOr(quest.cooldownDays, 0)
  if (quest.repeatPolicy === 'cooldown' && cooldownDays > 0) {
    const currentDay = finiteNumberOr(nextState.player?.day, 0)
    nextState.questCooldowns = [
      ...(nextState.questCooldowns ?? []),
      { questId: quest.id, expiresOnDay: currentDay + cooldownDays }
    ]
  }

  // Hardcoded old quest logic
  if (quest.id === QUEST_PROVE_YOURSELF) {
    nextState.venueBlacklist = (nextState.venueBlacklist || []).slice(2) // clear 2
    if (nextState.player) {
      nextState.player = {
        ...nextState.player,
        stats: { ...(nextState.player.stats ?? {}), proveYourselfMode: false }
      }
    }
  }

  // Resolve the source's flags, scope and cooldown before a payout can finish
  // another quest. Follow-ups are admitted afterwards, so a reward chain only
  // consumes quests that were already active and cannot re-enter its source.
  const region =
    getRegionKeyForLocation(nextState.player?.location) ?? undefined
  if (moneyGain > 0) {
    nextState = QuestEvents.emit(
      nextState,
      createMoneyEarnedQuestEvent({ amount: moneyGain, reason: 'quest_reward' })
    )
  }
  if (fameGain > 0) {
    nextState = QuestEvents.emit(
      nextState,
      createFameGainedQuestEvent({
        amount: fameGain,
        region,
        reason: 'quest_reward'
      })
    )
  }
  if (harmonyChange !== 0) {
    nextState = QuestEvents.emit(
      nextState,
      createHarmonyChangedQuestEvent({
        amount: harmonyChange,
        newHarmony: nextHarmony
      })
    )
  }

  // Story arcs may branch into a follow-up quest declared either inline or in
  // the registry definition. We addQuest through the same gating path so
  // repeat-policy and scope checks still apply to the follow-up.
  const followupId = quest.followupQuestId
  if (typeof followupId === 'string' && followupId.length > 0) {
    return addQuest(nextState, { id: followupId })
  }

  return nextState
}
