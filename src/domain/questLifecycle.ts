import type {
  GameState,
  QuestState,
  ToastPayload,
  ActiveQuestState
} from '../types'
import { finiteNumberOr, isForbiddenKey } from '../utils/gameState'
import { QUEST_PROVE_YOURSELF } from '../data/questsConstants'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { applyQuestFailurePenalties } from './questPenalties'
import { applyQuestRewards } from './questRewards'
import {
  getQuestWithDefinition,
  createActiveQuestRuntime,
  getQuestToastName,
  addStoryFlags
} from './questHelpers'
import { canAcceptQuest } from './questAcceptance'

export { QUEST_SLOT_LIMITS, canAcceptQuest } from './questAcceptance'
export type { CanAcceptQuestResult } from './questAcceptance'

/**
 * Pure quest lifecycle operations for adding, advancing, completing, and expiring quests.
 */
export const QuestLifecycle = {
  addQuest: (state: GameState, quest: QuestState): GameState => {
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
      const additions = merged.startFlags.filter(
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
      return QuestLifecycle.completeQuest(nextState, {
        questId: activeQuest.id
      })
    }
    return nextState
  },

  completeQuest: (
    state: GameState,
    { questId, randomIdx }: { questId: string; randomIdx?: number }
  ): GameState => {
    if (!state.activeQuests) return state
    const questIndex = state.activeQuests.findIndex(q => q.id === questId)
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
      ...(quest.completionFlags ?? [])
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
      const exists = (nextState.completedQuestScopes ?? []).some(
        c => c.questId === quest.id && c.scopeKey === quest.scopeKey
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
      const newFlags: string[] = []
      let changed = false
      for (const f of activeFlags) {
        if (!toClear.has(f)) {
          newFlags.push(f)
        } else {
          changed = true
        }
      }
      if (changed) {
        nextState.activeStoryFlags = newFlags
      }
    }

    // Cooldown-policy quests start a re-add cooldown on completion.
    const definition = getQuestDefinition(quest.id) as
      | Partial<QuestState>
      | undefined
    const repeatPolicy = quest.repeatPolicy ?? definition?.repeatPolicy
    const cooldownDays = finiteNumberOr(
      quest.cooldownDays ?? definition?.cooldownDays,
      0
    )
    if (repeatPolicy === 'cooldown' && cooldownDays > 0) {
      const currentDay = finiteNumberOr(nextState.player?.day, 0)
      nextState.questCooldowns = [
        ...(nextState.questCooldowns ?? []),
        { questId: quest.id, expiresOnDay: currentDay + cooldownDays }
      ]
    }

    // Hardcoded old quest logic
    if (quest.id === QUEST_PROVE_YOURSELF) {
      nextState.venueBlacklist = (nextState.venueBlacklist || []).slice(2) // clear 2
      nextState.player = {
        ...nextState.player,
        stats: { ...nextState.player.stats, proveYourselfMode: false }
      }
    }

    // Story arcs may branch into a follow-up quest declared either inline or in
    // the registry definition. We addQuest through the same gating path so
    // repeat-policy and scope checks still apply to the follow-up.
    const followupId = quest.followupQuestId ?? definition?.followupQuestId
    if (typeof followupId === 'string' && followupId.length > 0) {
      return QuestLifecycle.addQuest(nextState, { id: followupId })
    }

    return nextState
  },

  advanceQuest: (
    state: GameState,
    {
      questId,
      amount = 1,
      randomIdx
    }: { questId: string; amount?: number; randomIdx?: number }
  ): GameState => {
    const nextState = { ...state }
    let questCompleted = false
    if (!nextState.activeQuests) return state

    nextState.activeQuests = nextState.activeQuests.map(q => {
      if (q.id === questId) {
        const questConfig = getQuestWithDefinition(q)
        const required = q.required ?? questConfig.required
        const progress = q.progress ?? 0
        if (typeof required !== 'number') {
          return q
        }
        const newProgress = Math.min(required, progress + (amount ?? 1))
        if (newProgress >= required) {
          questCompleted = true
        }
        return { ...q, required, progress: newProgress }
      }
      return q
    })

    if (questCompleted) {
      return QuestLifecycle.completeQuest(nextState, { questId, randomIdx })
    }
    return nextState
  },

  /**
   * Sets a quest's progress to an absolute value (monotonic — never lowers it),
   * capped at `required`, and completes the quest when the cap is reached. Used
   * for threshold-style sources such as harmony recovery, where progress is the
   * current stat level rather than an accumulated count.
   */
  setQuestProgress: (
    state: GameState,
    { questId, progress }: { questId: string; progress: number }
  ): GameState => {
    const nextState = { ...state }
    if (!nextState.activeQuests) return state

    let questCompleted = false
    nextState.activeQuests = nextState.activeQuests.map(q => {
      if (q.id !== questId) return q
      const questConfig = getQuestWithDefinition(q)
      const required = q.required ?? questConfig.required
      const prev = q.progress ?? 0
      const next = Math.max(prev, finiteNumberOr(progress, prev))
      const capped =
        typeof required === 'number' ? Math.min(required, next) : next
      if (typeof required === 'number' && capped >= required) {
        questCompleted = true
      }
      return { ...q, required, progress: capped }
    })

    if (questCompleted) {
      return QuestLifecycle.completeQuest(nextState, { questId })
    }
    return nextState
  },

  checkDeadlines: (state: GameState): GameState => {
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
}
