import type { GameState, ActiveQuestState, ToastPayload } from '../types'
import { finiteNumberOr } from '../utils/gameState'
import { applyQuestFailurePenalties } from './questPenalties'
import { getQuestWithDefinition, getQuestToastName } from './questHelpers'

export const checkDeadlines = (state: GameState): GameState => {
  let nextState = { ...state }
  if (!nextState.activeQuests) return state

  let hasExpired = false
  const newActiveQuests: ActiveQuestState[] = []
  const newToasts: ToastPayload[] = []
  const flagsToAdd: string[] = []
  const flagsToRemove = new Set<string>()
  const cooldownsToAdd: GameState['questCooldowns'] = []
  const currentDay = finiteNumberOr(nextState.player?.day, 0)

  for (let i = 0; i < nextState.activeQuests.length; i++) {
    const activeQuest = nextState.activeQuests[i]
    if (!activeQuest) continue
    const quest = getQuestWithDefinition(activeQuest)

    if (typeof quest.deadline === 'number' && currentDay > quest.deadline) {
      hasExpired = true
      const penaltyResult = applyQuestFailurePenalties(
        nextState,
        quest,
        currentDay
      )
      nextState = penaltyResult.state
      flagsToAdd.push(...penaltyResult.flagsToAdd)
      cooldownsToAdd.push(...penaltyResult.cooldownsToAdd)

      // Clear story flags that should not persist past failure: both the
      // explicit clearFlagsOnFail list and any startFlags the quest applied.
      if (Array.isArray(quest.clearFlagsOnFail)) {
        for (const flag of quest.clearFlagsOnFail) {
          if (typeof flag === 'string') flagsToRemove.add(flag)
        }
      }
      if (Array.isArray(quest.startFlags)) {
        for (const flag of quest.startFlags) {
          if (typeof flag === 'string') flagsToRemove.add(flag)
        }
      }

      newToasts.push({
        id: `${quest.id}-fail`,
        messageKey: 'ui:toast.quest_failed',
        options: { name: getQuestToastName(quest) },
        type: 'error'
      })
      if (Array.isArray(quest.failureFlags)) {
        flagsToAdd.push(
          ...quest.failureFlags.filter(
            (flag): flag is string =>
              typeof flag === 'string' && flag.length > 0
          )
        )
      }
    } else {
      newActiveQuests.push(activeQuest)
    }
  }

  if (!hasExpired) return state

  nextState.activeQuests = newActiveQuests
  if (newToasts.length > 0) {
    nextState.toasts = [...(nextState.toasts ?? []), ...newToasts]
  }

  if (flagsToAdd.length > 0 || flagsToRemove.size > 0) {
    const baseFlags = nextState.activeStoryFlags ?? []
    let changed = false
    const filteredFlags: string[] = []
    for (const f of baseFlags) {
      if (!flagsToRemove.has(f)) {
        filteredFlags.push(f)
      } else {
        changed = true
      }
    }
    for (const flag of flagsToAdd) {
      if (!filteredFlags.includes(flag)) {
        filteredFlags.push(flag)
        changed = true
      }
    }
    if (changed) {
      nextState.activeStoryFlags = filteredFlags
    }
  }

  if (cooldownsToAdd.length > 0) {
    nextState.questCooldowns = [
      ...(nextState.questCooldowns ?? []),
      ...cooldownsToAdd
    ]
  }

  return nextState
}
