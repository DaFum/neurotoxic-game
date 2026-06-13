import type { GameState, QuestKind, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import { finiteNumberOr } from '../utils/gameState'
import { getRegionKeyForLocation } from '../utils/mapUtils'

/**
 * Maximum active quest slots by quest kind.
 */
export const QUEST_SLOT_LIMITS: Record<QuestKind, number> = {
  story: 1,
  side: 2,
  repeatable: 2,
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
  const activeQuests = state.activeQuests ?? []
  let activeCount = 0
  for (let i = 0; i < activeQuests.length; i++) {
    const activeQuest = activeQuests[i]
    if (activeQuest && getQuestKindForSlots(activeQuest) === kind) {
      activeCount++
      if (activeCount >= limit) return false
    }
  }
  return true
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
 * Unexpired `questCooldowns` entries block acceptance for every repeat policy — failure-penalty retry cooldowns on `'never'` story quests are enforced here too.
 *
 * @param state - The active game state context.
 * @param questOrId - Either the quest identifier string or a partial quest state payload.
 * @returns A structured result object indicating success (with an optional scopeKey for scoped quests) or the specific rejection reason.
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
    for (let i = 0; i < completionFlags.length; i++) {
      if (activeFlags.includes(completionFlags[i] as string)) {
        return { ok: false, reason: 'flag' }
      }
    }
  }
  // Cooldowns gate every repeat policy, not just 'cooldown': failure
  // penalties (`quest.cooldown`) write `questCooldowns` entries keyed by the
  // quest id for 'never' story quests too, so their retry delay must hold.
  {
    const currentDay = finiteNumberOr(state.player?.day, 0)
    const cooldowns = state.questCooldowns ?? []
    let onCooldown = false
    for (let i = 0; i < cooldowns.length; i++) {
      const cd = cooldowns[i]
      if (cd && cd.questId === questId && cd.expiresOnDay > currentDay) {
        onCooldown = true
        break
      }
    }
    if (onCooldown) return { ok: false, reason: 'cooldown' }
  }
  if (repeatPolicy === 'perVenue' || repeatPolicy === 'perRegion') {
    scopeKey =
      merged.scopeKey ??
      (repeatPolicy === 'perVenue'
        ? getCurrentVenueScopeKey(state)
        : // perRegion scopes are stamped with the canonical city key so
          // region quest events (also city-keyed) can match progress.
          (getRegionKeyForLocation(state.player?.location) ?? undefined))
    if (typeof scopeKey !== 'string' || scopeKey.length === 0) {
      return { ok: false, reason: 'scope' }
    }
    const scopes = state.completedQuestScopes ?? []
    let alreadyDone = false
    for (let i = 0; i < scopes.length; i++) {
      const c = scopes[i]
      if (c && c.questId === questId && c.scopeKey === scopeKey) {
        alreadyDone = true
        break
      }
    }
    if (alreadyDone) return { ok: false, reason: 'scope' }
  }
  if (!hasQuestSlot(state, merged)) {
    return { ok: false, reason: 'slot' }
  }
  return scopeKey ? { ok: true, scopeKey } : { ok: true }
}
