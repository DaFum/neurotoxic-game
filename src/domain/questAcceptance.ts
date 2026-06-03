import type { GameState, QuestKind, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { finiteNumberOr } from '../utils/gameStateUtils'

export const QUEST_SLOT_LIMITS: Record<QuestKind, number> = {
  story: 1,
  side: 3,
  repeatable: 3,
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

export type CanAcceptQuestResult =
  | { ok: true; scopeKey?: string }
  | {
      ok: false
      reason: 'active' | 'completed' | 'flag' | 'cooldown' | 'scope' | 'slot'
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
    if ((state.completedQuestIds ?? []).includes(questId)) {
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
