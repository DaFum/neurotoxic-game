import type { GameState, QuestState } from '../types'
import { finiteNumberOr } from '../utils/gameState'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { createActiveQuestRuntime } from './questHelpers'
import { canAcceptQuest } from './questAcceptance'
import { completeQuest } from './questComplete'
import { isQuestStateLike } from './questValidation'
import { logger } from '../utils/logger'

/**
 * Integrates a new quest or restores a dormant quest into the active game state.
 *
 * @remarks
 * Merges the provided quest payload with static defaults from the quest registry.
 * It gates progression behind `canAcceptQuest` rules and computes relative deadlines
 * into absolute day markers. If the quest's initial progress is greater than or equal
 * to a finite required threshold (greater than zero), it synchronously completes the
 * quest before returning the new state.
 *
 * @param state - The current overarching game state.
 * @param quest - The partial quest payload containing override parameters and identification.
 * @returns The updated game state featuring the active or instantly completed quest.
 */
export const addQuest = (state: GameState, quest: unknown): GameState => {
  if (!isQuestStateLike(quest)) {
    logger.warn('QuestLifecycle', 'Skipping malformed quest payload', quest)
    return state
  }
  if (hasActiveQuest(state.activeQuests, quest.id)) return state

  // Use the payload as the base, then let the registry definition replace
  // matching fields while preserving the requested quest ID.
  const definition = getQuestDefinition(quest.id)
  const merged: QuestState = definition
    ? { ...quest, ...(definition as Partial<QuestState>), id: quest.id }
    : { ...quest }

  // Repeat-policy gating delegates to canAcceptQuest so event conditions can
  // mirror the same rules without duplicating logic.
  const accept = canAcceptQuest(state, merged)
  if (!accept.ok) return state
  if (accept.scopeKey) merged.scopeKey = accept.scopeKey

  // Compute an absolute deadline from a relative offset when one was not
  // already supplied (event-triggered quests pre-compute it in eventResolver).
  if (merged.deadline == null && merged.deadlineOffset != null) {
    const offset = finiteNumberOr(merged.deadlineOffset, Number.NaN)
    if (Number.isFinite(offset)) {
      const currentDay = finiteNumberOr(state.player?.day, 0)
      // Two finite operands can still sum to Infinity. Reject the payload
      // rather than admitting a deadline-less quest: `checkDeadlines` only
      // expires finite deadlines, so either shape would hold its slot forever.
      const deadline = currentDay + offset
      if (!Number.isFinite(deadline)) {
        logger.warn(
          'QuestLifecycle',
          'Skipping quest with non-finite computed deadline',
          quest
        )
        return state
      }
      merged.deadline = deadline
    }
  }
  delete merged.deadlineOffset

  // Registry-managed quests start at progress 0; ad-hoc quests are left as-is.
  if (definition && merged.progress == null) merged.progress = 0

  // Apply declarative startFlags so quests can gate other systems while
  // active. completeQuest / checkDeadlines remove them on resolve.
  let nextStoryFlags = state.activeStoryFlags
  if (Array.isArray(merged.startFlags) && merged.startFlags.length > 0) {
    const base = state.activeStoryFlags ?? []
    const additions =
      merged.startFlags.length > 5
        ? (() => {
            const baseSet = new Set(base)
            return merged.startFlags.filter(
              f => typeof f === 'string' && !baseSet.has(f)
            )
          })()
        : merged.startFlags.filter(
            f => typeof f === 'string' && !base.includes(f)
          )

    if (additions.length > 0) nextStoryFlags = [...base, ...additions]
  }

  const currentDay = finiteNumberOr(state.player?.day, 0)
  const activeQuest = createActiveQuestRuntime(
    merged,
    currentDay,
    Boolean(definition)
  )

  const nextState = {
    ...state,
    activeStoryFlags: nextStoryFlags,
    activeQuests: [...(state.activeQuests ?? []), activeQuest]
  }
  const required = finiteNumberOr(activeQuest.required, Number.NaN)
  const progress = finiteNumberOr(activeQuest.progress, Number.NaN)
  if (Number.isFinite(required) && required > 0 && progress >= required) {
    return completeQuest(nextState, {
      questId: activeQuest.id
    })
  }
  return nextState
}
