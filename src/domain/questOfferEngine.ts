import type { GameState, QuestOfferCondition } from '../types'
import { getQuestDefinition } from '../data/questRegistry'
import { canAcceptQuest } from './questLifecycle'
import { finiteNumberOr } from '../utils/gameState'

const matchesSocialCondition = (
  state: GameState,
  social: NonNullable<QuestOfferCondition['social']>
): boolean => {
  const loyalty = finiteNumberOr(state.social?.loyalty, 50)
  const controversy = finiteNumberOr(state.social?.controversyLevel, 0)
  const tiktok = finiteNumberOr(state.social?.tiktok, 0)

  // "Social damage" is an OR of the two optional thresholds; when neither is
  // declared the check does not apply at all.
  const hasDamageCheck =
    typeof social.loyaltyBelow === 'number' ||
    typeof social.controversyAbove === 'number'
  const damageCheckPassed =
    (typeof social.loyaltyBelow === 'number' &&
      loyalty < social.loyaltyBelow) ||
    (typeof social.controversyAbove === 'number' &&
      controversy > social.controversyAbove)

  if (hasDamageCheck && !damageCheckPassed) {
    return false
  }
  if (typeof social.minTiktok === 'number' && tiktok < social.minTiktok) {
    return false
  }
  if (typeof social.maxTiktok === 'number' && tiktok > social.maxTiktok) {
    return false
  }
  return true
}

const matchesOfferCondition = (
  state: GameState,
  condition: QuestOfferCondition | undefined
): boolean => {
  if (!condition) return true

  if (
    condition.band?.harmonyBelow != null &&
    finiteNumberOr(state.band?.harmony, 0) >= condition.band.harmonyBelow
  ) {
    return false
  }

  if (condition.social && !matchesSocialCondition(state, condition.social)) {
    return false
  }

  if (condition.currentNodeType) {
    const nodeId = state.player?.currentNodeId
    if (typeof nodeId !== 'string' || nodeId.length === 0) return false
    if (state.gameMap?.nodes?.[nodeId]?.type !== condition.currentNodeType) {
      return false
    }
  }

  if (condition.requiredAssetKind) {
    const hasAsset = (state.assets ?? []).some(
      asset => asset?.kind === condition.requiredAssetKind
    )
    if (!hasAsset) return false
  }

  if (
    typeof condition.minFame === 'number' &&
    finiteNumberOr(state.player?.fame, 0) < condition.minFame
  ) {
    return false
  }

  if (
    condition.requireLocation &&
    (typeof state.player?.location !== 'string' ||
      state.player.location.length === 0)
  ) {
    return false
  }

  // Amends-style quests are unwinnable with an empty blacklist: there is
  // nothing to un-blacklist, so the offer would be a dead end.
  if (
    condition.requireBlacklistedVenue &&
    !(state.venueBlacklist?.length ?? 0)
  ) {
    return false
  }

  return true
}

/**
 * Evaluates quest offer availability for triggers and current game state.
 *
 * @param state - The active game state context.
 * @param questId - Identifier of the quest whose offer is being evaluated.
 * @returns True when the offer condition passes and the quest can be accepted.
 */
const canOfferQuest = (state: GameState, questId: string): boolean => {
  const definition = getQuestDefinition(questId)
  // Offers are registry-driven: an id no definition backs has no offer
  // condition, no rules, and nothing to accept.
  if (!definition) return false
  if (
    definition.offer &&
    !matchesOfferCondition(state, definition.offer.condition)
  ) {
    return false
  }
  return canAcceptQuest(state, questId).ok
}

/**
 * Namespaced offer API referenced by `src/data/AGENTS.md` and event conditions.
 */
export const QuestOfferEngine = { canOfferQuest }
