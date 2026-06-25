import type { GameState, QuestState } from '../types'
import { finiteNumberOr, isForbiddenKey } from '../utils/gameState'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { createActiveQuestRuntime } from './questHelpers'
import { canAcceptQuest } from './questAcceptance'
import { completeQuest } from './questComplete'

export const addQuest = (state: GameState, quest: QuestState): GameState => {
  if (
    typeof quest.id !== 'string' ||
    quest.id.length === 0 ||
    isForbiddenKey(quest.id)
  ) {
    return state
  }
  if (hasActiveQuest(state.activeQuests, quest.id)) return state

  // Merge static registry defaults under the provided payload so callers can
  // dispatch `{ id }` and inherit label/deadline/penalty config, while inline
  // overrides still win.
  const definition = getQuestDefinition(quest.id)
  const merged: QuestState = definition
    ? { ...(definition as Partial<QuestState>), ...quest }
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
      merged.deadline = currentDay + offset
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
    activeQuests: [...(state.activeQuests || []), activeQuest]
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
