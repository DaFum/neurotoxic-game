import type {
  GameState,
  QuestOfferCondition,
  QuestOfferDefinition,
  QuestState
} from '../types'
import { QUEST_REGISTRY, getQuestDefinition } from '../data/questRegistry'
import { canAcceptQuest } from './questLifecycle'
import { finiteNumberOr } from '../utils/gameStateUtils'

export interface AvailableQuestOffer {
  questId: string
  offer: QuestOfferDefinition
}

const matchesSocialCondition = (
  state: GameState,
  social: NonNullable<QuestOfferCondition['social']>
): boolean => {
  const loyalty = finiteNumberOr(state.social?.loyalty, 50)
  const controversy = finiteNumberOr(state.social?.controversyLevel, 0)
  const tiktok = finiteNumberOr(state.social?.tiktok, 0)

  const socialDamageChecks: boolean[] = []
  if (typeof social.loyaltyBelow === 'number') {
    socialDamageChecks.push(loyalty < social.loyaltyBelow)
  }
  if (typeof social.controversyAbove === 'number') {
    socialDamageChecks.push(controversy > social.controversyAbove)
  }
  if (socialDamageChecks.length > 0 && !socialDamageChecks.some(Boolean)) {
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
      asset => asset.kind === condition.requiredAssetKind
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

  return true
}

export const QuestOfferEngine = {
  canOfferQuest: (state: GameState, questId: string): boolean => {
    const definition = getQuestDefinition(questId) as
      | (Partial<QuestState> & { offer?: QuestOfferDefinition })
      | undefined
    if (!definition?.offer) return canAcceptQuest(state, questId).ok
    return (
      canAcceptQuest(state, questId).ok &&
      matchesOfferCondition(state, definition.offer.condition)
    )
  },

  getAvailableOffers: (
    state: GameState,
    trigger: QuestOfferDefinition['trigger']
  ): AvailableQuestOffer[] =>
    Object.entries(QUEST_REGISTRY).flatMap(([questId, definition]) => {
      const offer = (definition as Partial<QuestState>).offer
      if (!offer || offer.trigger !== trigger) return []
      return QuestOfferEngine.canOfferQuest(state, questId)
        ? [{ questId, offer }]
        : []
    })
}
