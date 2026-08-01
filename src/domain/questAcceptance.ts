import type { GameState, QuestKind, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'
import { hasActiveQuest } from '../utils/questUtils'
import {
  finiteNumberOr,
  hasStateItem,
  isForbiddenKey
} from '../utils/gameState'
import { getRegionKeyForLocation } from '../utils/mapUtils'
import { isQuestStateLike } from './questValidation'
import { getCurrentVenueId } from './questEffects'

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
    Partial<QuestState> | undefined
  const kind = quest.kind ?? definition?.kind ?? 'side'
  return Object.hasOwn(QUEST_SLOT_LIMITS, kind) ? kind : 'side'
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

  if (limit <= 0) return false

  const activeCount = (state.activeQuests ?? []).filter(
    activeQuest => activeQuest && getQuestKindForSlots(activeQuest) === kind
  ).length
  return activeCount < limit
}

/**
 * Result of checking whether the current state can accept a quest.
 */
export type CanAcceptQuestResult =
  | { ok: true; scopeKey?: string }
  | {
      ok: false
      reason:
        | 'active'
        | 'completed'
        | 'flag'
        | 'cooldown'
        | 'scope'
        | 'slot'
        | 'invalid'
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
  // The string branch must reject the same ids `isQuestStateLike` refuses,
  // otherwise the offer gate approves a quest that `addQuest` then discards.
  if (
    (typeof questOrId === 'string' &&
      (questOrId.length === 0 || isForbiddenKey(questOrId))) ||
    (typeof questOrId !== 'string' && !isQuestStateLike(questOrId))
  ) {
    return { ok: false, reason: 'invalid' }
  }
  const questId = typeof questOrId === 'string' ? questOrId : questOrId.id
  if (hasActiveQuest(state.activeQuests, questId)) {
    return { ok: false, reason: 'active' }
  }
  const definition = getQuestDefinition(questId) as
    Partial<QuestState> | undefined
  const merged: Partial<QuestState> =
    typeof questOrId === 'string'
      ? { id: questId, ...(definition ?? {}) }
      : definition
        ? { ...questOrId, ...definition, id: questId }
        : { ...questOrId }

  const repeatPolicy = merged.repeatPolicy
  let scopeKey: string | undefined
  if (repeatPolicy === 'never') {
    if ((state.completedQuestIds ?? []).includes(questId)) {
      return { ok: false, reason: 'completed' }
    }
    const activeFlags = state.activeStoryFlags ?? []
    const completionFlags = [
      ...(Array.isArray(merged.completionFlags) ? merged.completionFlags : []),
      ...(merged.rewardFlag ? [merged.rewardFlag] : [])
    ]
    const hasCompletionFlag = completionFlags.some(
      flag => typeof flag === 'string' && hasStateItem(activeFlags, flag)
    )
    if (hasCompletionFlag) return { ok: false, reason: 'flag' }
  }
  // Cooldowns gate every repeat policy, not just 'cooldown': failure
  // penalties (`quest.cooldown`) write `questCooldowns` entries keyed by the
  // quest id for 'never' story quests too, so their retry delay must hold.
  const currentDay = finiteNumberOr(state.player?.day, 0)
  const onCooldown = (state.questCooldowns ?? []).some(
    cd =>
      cd &&
      cd.questId === questId &&
      finiteNumberOr(cd.expiresOnDay, 0) > currentDay
  )
  if (onCooldown) return { ok: false, reason: 'cooldown' }
  if (repeatPolicy === 'perVenue' || repeatPolicy === 'perRegion') {
    scopeKey =
      merged.scopeKey ??
      (repeatPolicy === 'perVenue'
        ? getCurrentVenueId(state)
        : // perRegion scopes are stamped with the canonical city key so
          // region quest events (also city-keyed) can match progress.
          (getRegionKeyForLocation(state.player?.location) ?? undefined))
    if (typeof scopeKey !== 'string' || scopeKey.length === 0) {
      return { ok: false, reason: 'scope' }
    }
    const alreadyDone = (state.completedQuestScopes ?? []).some(
      c => c && c.questId === questId && c.scopeKey === scopeKey
    )
    if (alreadyDone) return { ok: false, reason: 'scope' }
  }
  if (!hasQuestSlot(state, merged)) {
    return { ok: false, reason: 'slot' }
  }
  return scopeKey ? { ok: true, scopeKey } : { ok: true }
}
