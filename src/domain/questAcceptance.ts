import type { GameState, QuestKind, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { finiteNumberOr } from '../utils/gameState'

/**
 * Maximum active quest slots by quest kind.
 */
export const QUEST_SLOT_LIMITS: Record<QuestKind, number> = {
  story: 1,
  side: 3,
  repeatable: 3,
  tutorial: 1
}

/**
 * Determines the categorisation kind for slot allocation based on a quest payload.
 *
 * @param quest - The partial quest state containing an identifier or explicit kind.
 * @returns The resolved quest kind string.
 */
const getQuestKindForSlots = (quest: Partial<QuestState>): QuestKind => {
  const definition = getQuestDefinition(quest.id ?? '') as
    | Partial<QuestState>
    | undefined
  return quest.kind ?? definition?.kind ?? 'side'
}

/**
 * Verifies if the player's active quest inventory has remaining capacity for a specific quest kind.
 *
 * @param state - The active game state context.
 * @param quest - The partial quest payload containing the target kind.
 * @returns A boolean indicating if capacity exists.
 */
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

/**
 * Extracts the current venue context identifier for location-scoped repeat policies.
 *
 * @param state - The active game state context.
 * @returns The scoped venue identifier, or undefined if not actively in a gig node.
 */
const getCurrentVenueScopeKey = (state: GameState): string | undefined => {
  const currentGigId = state.currentGig?.id
  if (typeof currentGigId === 'string' && currentGigId.length > 0) {
    return currentGigId
  }

  const nodeId = state.player?.currentNodeId
  if (typeof nodeId !== 'string' || nodeId.length === 0) return undefined
  return state.gameMap?.nodes?.[nodeId]?.type === 'GIG' ? nodeId : undefined
}

/**
 * Result of checking whether the current state can accept a quest.
 */
export type CanAcceptQuestResult =
  | { ok: true; scopeKey?: string }
  | {
      ok: false
      reason: 'active' | 'completed' | 'flag' | 'cooldown' | 'scope' | 'slot'
    }

/**
 * Predicate that mirrors `QuestLifecycle.addQuest`'s repeat-policy and scope guards without mutating state.
 *
 * @remarks
 * Use in event-condition functions so an offer does not surface when the dispatch would silently refuse it.
 * Registry defaults such as `repeatPolicy`, `completionFlags`, and `rewardFlag` are merged automatically prior to validation.
 *
 * @param state - The active game state context.
 * @param questOrId - Either the quest identifier string or a partial quest state payload.
 * @returns A structured result object indicating success or the specific rejection reason.
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
