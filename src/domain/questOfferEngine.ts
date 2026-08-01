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

  // ⚡ BOLT OPTIMIZATION: Replaced intermediate array allocation and .some(Boolean) check
  let hasDamageCheck = false
  let damageCheckPassed = false

  if (typeof social.loyaltyBelow === 'number') {
    hasDamageCheck = true
    if (loyalty < social.loyaltyBelow) damageCheckPassed = true
  }
  if (typeof social.controversyAbove === 'number') {
    hasDamageCheck = true
    if (controversy > social.controversyAbove) damageCheckPassed = true
  }

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
    let hasAsset = false
    const assets = state.assets ?? []
    // ⚡ BOLT OPTIMIZATION: Replaced Array.some with a procedural loop
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      if (asset && asset?.kind === condition.requiredAssetKind) {
        hasAsset = true
        break
      }
    }
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

  return true
}

/**
 * Evaluates quest offer availability for triggers and current game state.
 */
export const QuestOfferEngine = {
  canOfferQuest: (state: GameState, questId: string): boolean => {
    const definition = getQuestDefinition(questId)
    if (!definition?.offer) return canAcceptQuest(state, questId).ok

    const baseMatch = matchesOfferCondition(state, definition.offer.condition)
    if (!baseMatch) return false

    if (questId === 'quest_make_amends') {
      if (!state.venueBlacklist || state.venueBlacklist.length === 0) return false
    }

    if (questId === 'quest_region_takeover') {
      // Very basic check: just ensure there's at least one location or we aren't completely locked
      if (!state.player?.location) return false
    }

    return canAcceptQuest(state, questId).ok
  }
}
