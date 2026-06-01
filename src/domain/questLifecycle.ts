import type {
  ActiveQuestState,
  GameState,
  QuestKind,
  QuestState,
  ToastPayload
} from '../types'
import { finiteNumberOr, isForbiddenKey } from '../utils/gameStateUtils'
import { QUEST_PROVE_YOURSELF } from '../data/questsConstants'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { applyQuestFailurePenalties } from './questPenalties'
import { applyQuestRewards } from './questRewards'

export const QUEST_SLOT_LIMITS: Record<QuestKind, number> = {
  story: 1,
  side: 2,
  repeatable: 2,
  tutorial: 1
}

const getQuestKindForSlots = (quest: Partial<QuestState>): QuestKind => {
  const definition = getQuestDefinition(quest.id ?? '') as
    | Partial<QuestState>
    | undefined
  return quest.kind ?? definition?.kind ?? 'side'
}

const hasQuestSlot = (
  state: GameState,
  quest: Partial<QuestState>
): boolean => {
  const kind = getQuestKindForSlots(quest)
  const limit = QUEST_SLOT_LIMITS[kind]
  const activeCount = (state.activeQuests ?? []).filter(activeQuest => {
    if (!activeQuest) return false
    return getQuestKindForSlots(activeQuest) === kind
  }).length
  return activeCount < limit
}

const getCurrentVenueScopeKey = (state: GameState): string | undefined => {
  const currentGigId = state.currentGig?.id
  if (typeof currentGigId === 'string' && currentGigId.length > 0) {
    return currentGigId
  }

  const nodeId = state.player?.currentNodeId
  if (typeof nodeId !== 'string' || nodeId.length === 0) return undefined
  return state.gameMap?.nodes?.[nodeId]?.type === 'GIG' ? nodeId : undefined
}

const getQuestWithDefinition = (
  quest: QuestState | ActiveQuestState
): QuestState => {
  const definition = getQuestDefinition(quest.id) as
    | Partial<QuestState>
    | undefined
  return definition ? { ...definition, ...quest } : quest
}

const createActiveQuestRuntime = (
  quest: QuestState,
  startedOnDay: number,
  isRegistryBacked: boolean
): ActiveQuestState => {
  if (!isRegistryBacked) return quest as ActiveQuestState
  return {
    id: quest.id,
    deadline: quest.deadline,
    progress: quest.progress,
    required: quest.required,
    scopeKey: quest.scopeKey,
    status: 'active',
    startedOnDay
  }
}

const getQuestToastName = (quest: QuestState): string => quest.label ?? quest.id

const addStoryFlags = (
  flags: GameState['activeStoryFlags'],
  additions: unknown[]
): GameState['activeStoryFlags'] => {
  const validAdditions = additions.filter(
    (flag): flag is string => typeof flag === 'string' && flag.length > 0
  )
  if (validAdditions.length === 0) return flags
  const nextFlags = [...(flags ?? [])]
  for (const flag of validAdditions) {
    if (!nextFlags.includes(flag)) nextFlags.push(flag)
  }
  return nextFlags
}

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
      nextState.activeStoryFlags = (nextState.activeStoryFlags ?? []).filter(
        f => !toClear.has(f)
      )
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
      const baseFlags = (nextState.activeStoryFlags ?? []).filter(
        f => !flagsToRemove.has(f)
      )
      for (const flag of flagsToAdd) {
        if (!baseFlags.includes(flag)) baseFlags.push(flag)
      }
      nextState.activeStoryFlags = baseFlags
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

/**
 * Predicate that mirrors `QuestLifecycle.addQuest`'s repeat-policy and scope
 * guards without mutating state. Use in event-condition functions so an offer
 * does not surface when the dispatch would silently refuse it.
 *
 * Pass either a `questId` string or a partial `QuestState`; registry defaults
 * (repeatPolicy, completionFlags, rewardFlag) are merged automatically.
 *
 * Returns `{ ok: true, scopeKey? }` when addQuest would accept, or
 * `{ ok: false, reason }` describing why it would refuse.
 */
export type CanAcceptQuestResult =
  | { ok: true; scopeKey?: string }
  | {
      ok: false
      reason: 'active' | 'completed' | 'flag' | 'cooldown' | 'scope' | 'slot'
    }

export const canAcceptQuest = (
  state: GameState,
  questOrId: string | QuestState
): CanAcceptQuestResult => {
  const questId = typeof questOrId === 'string' ? questOrId : questOrId.id
  if (hasActiveQuest(state.activeQuests, questId)) {
    return { ok: false, reason: 'active' }
  }
  const definition = getQuestDefinition(questId) as
    | Partial<QuestState>
    | undefined
  const merged: Partial<QuestState> =
    typeof questOrId === 'string'
      ? { id: questId, ...(definition ?? {}) }
      : { ...(definition ?? {}), ...questOrId }

  const repeatPolicy = merged.repeatPolicy
  let scopeKey: string | undefined
  if (repeatPolicy === 'never') {
    if (state.completedQuestIds?.includes(questId)) {
      return { ok: false, reason: 'completed' }
    }
    const activeFlags = state.activeStoryFlags ?? []
    const completionFlags = [
      ...(merged.completionFlags ?? []),
      ...(merged.rewardFlag ? [merged.rewardFlag] : [])
    ]
    if (completionFlags.some(flag => activeFlags.includes(flag))) {
      return { ok: false, reason: 'flag' }
    }
  }
  if (repeatPolicy === 'cooldown') {
    const currentDay = finiteNumberOr(state.player?.day, 0)
    const onCooldown = (state.questCooldowns ?? []).some(
      cd => cd.questId === questId && cd.expiresOnDay > currentDay
    )
    if (onCooldown) return { ok: false, reason: 'cooldown' }
  }
  if (repeatPolicy === 'perVenue' || repeatPolicy === 'perRegion') {
    scopeKey =
      merged.scopeKey ??
      (repeatPolicy === 'perVenue'
        ? getCurrentVenueScopeKey(state)
        : state.player?.location)
    if (typeof scopeKey !== 'string' || scopeKey.length === 0) {
      return { ok: false, reason: 'scope' }
    }
    const alreadyDone = (state.completedQuestScopes ?? []).some(
      c => c.questId === questId && c.scopeKey === scopeKey
    )
    if (alreadyDone) return { ok: false, reason: 'scope' }
  }
  if (!hasQuestSlot(state, merged)) {
    return { ok: false, reason: 'slot' }
  }
  return scopeKey ? { ok: true, scopeKey } : { ok: true }
}
