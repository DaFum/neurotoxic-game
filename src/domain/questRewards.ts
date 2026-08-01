import i18n from '../i18n'
import { formatCurrency } from '../utils/numberUtils'
import type {
  BandMember,
  GameState,
  QuestReward,
  QuestState,
  ToastPayload
} from '../types'
import {
  calculateFameLevel,
  clampBandHarmony,
  clampControversyLevel,
  clampLoyalty,
  clampPlayerFame,
  clampPlayerMoney,
  finiteNumberOr,
  isFiniteNumber,
  isForbiddenKey,
  isLooseRecord
} from '../utils/gameState'
import { applyTraitUnlocks } from '../utils/traitUtils'
import {
  getQuestToastName,
  updateFirstMatchingAssetCondition
} from './questHelpers'
import {
  applyBrandTrustDelta,
  applyReputationDelta,
  getRegionReputationKey,
  queueEvent
} from './questEffects'

/**
 * State and toast payloads produced by applying quest rewards.
 */
interface QuestRewardResult {
  state: GameState
  toasts: ToastPayload[]
}

const normalizeLegacyRewards = (quest: QuestState): QuestReward[] => {
  const rewards: QuestReward[] = []
  if (isFiniteNumber(quest.moneyReward) && quest.moneyReward !== 0) {
    rewards.push({ type: 'money', amount: quest.moneyReward })
  }

  if (quest.rewardType === 'item' && quest.rewardData?.item) {
    rewards.push({ type: 'item.add', itemId: String(quest.rewardData.item) })
  } else if (quest.rewardType === 'fame' && quest.rewardData?.fame) {
    rewards.push({
      type: 'fame',
      amount: finiteNumberOr(Number(quest.rewardData.fame), 0)
    })
  } else if (quest.rewardType === 'skill_point') {
    const memberIndex = isFiniteNumber(quest.rewardData?.memberIndex)
      ? quest.rewardData.memberIndex
      : undefined
    rewards.push({ type: 'skill_point', memberIndex })
  } else if (quest.rewardType === 'harmony' && quest.rewardData?.harmony) {
    rewards.push({
      type: 'band.harmony',
      amount: finiteNumberOr(Number(quest.rewardData.harmony), 0)
    })
  } else if (quest.rewardType === 'fans' && quest.rewardData?.fans) {
    rewards.push({
      type: 'social.followers',
      platform: 'instagram',
      amount: finiteNumberOr(Number(quest.rewardData.fans), 0)
    })
  } else if (quest.rewardType === 'loyalty' && quest.rewardData?.loyalty) {
    rewards.push({
      type: 'social.loyalty',
      amount: finiteNumberOr(Number(quest.rewardData.loyalty), 0)
    })
  } else if (
    quest.rewardType === 'controversy_reduction' &&
    quest.rewardData?.controversy
  ) {
    rewards.push({
      type: 'social.controversy',
      amount: -Math.abs(finiteNumberOr(Number(quest.rewardData.controversy), 0))
    })
  }

  return rewards
}

/**
 * Returns declarative quest rewards, falling back to legacy reward fields.
 */
const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string'

const FOLLOWER_PLATFORMS = new Set([
  'instagram',
  'tiktok',
  'youtube',
  'newsletter'
])

const isQuestReward = (value: unknown): value is QuestReward => {
  if (!isLooseRecord(value) || typeof value.type !== 'string') return false

  switch (value.type) {
    case 'money':
    case 'fame':
    case 'band.harmony':
    case 'social.loyalty':
    case 'social.controversy':
      return isFiniteNumber(value.amount)
    case 'social.followers':
      return (
        isFiniteNumber(value.amount) &&
        (value.platform === undefined ||
          (typeof value.platform === 'string' &&
            FOLLOWER_PLATFORMS.has(value.platform)))
      )
    case 'region.reputation':
      return isFiniteNumber(value.amount) && isOptionalString(value.scope)
    case 'brand.trust':
      return (
        isFiniteNumber(value.amount) &&
        isOptionalString(value.brandId) &&
        isOptionalString(value.alignment)
      )
    case 'asset.repair':
      return (
        isFiniteNumber(value.amount) &&
        isOptionalString(value.assetId) &&
        isOptionalString(value.assetKind)
      )
    case 'item.add':
      // The id becomes a computed inventory key, so it must clear the same
      // hostile-key bar the reducers apply to item/contraband ids.
      return (
        typeof value.itemId === 'string' &&
        value.itemId.length > 0 &&
        !isForbiddenKey(value.itemId) &&
        value.amount === undefined
      )
    case 'trait.unlock':
      return (
        typeof value.traitId === 'string' && isOptionalString(value.memberId)
      )
    case 'skill_point':
      return (
        value.memberIndex === undefined || isFiniteNumber(value.memberIndex)
      )
    case 'flag.add':
      return typeof value.flag === 'string' && value.flag.length > 0
    case 'event.queue':
      return typeof value.eventId === 'string' && value.eventId.length > 0
    default:
      return false
  }
}

export const getQuestRewards = (quest: QuestState): QuestReward[] => {
  if (Array.isArray(quest.rewards) && quest.rewards.length > 0) {
    return quest.rewards.filter(isQuestReward)
  }
  return normalizeLegacyRewards(quest)
}

const applySkillPointReward = (
  state: GameState,
  quest: QuestState,
  reward: Extract<QuestReward, { type: 'skill_point' }>,
  randomIdx: number | undefined,
  toasts: ToastPayload[]
): GameState => {
  const originalMembers = state.band?.members ?? []
  if (originalMembers.length === 0) return state

  const memberIdx = isFiniteNumber(reward.memberIndex)
    ? Math.max(
        0,
        Math.min(originalMembers.length - 1, Math.trunc(reward.memberIndex))
      )
    : isFiniteNumber(randomIdx)
      ? Math.max(0, Math.min(originalMembers.length - 1, Math.trunc(randomIdx)))
      : 0

  // ⚡ BOLT OPTIMIZATION: Replaced .map with a procedural for-loop
  // Why: Avoids allocating a new closure per element during map
  // Impact: Performance improvement and reduced allocations
  const members: BandMember[] = []
  for (let i = 0; i < originalMembers.length; i++) {
    const member = originalMembers[i]
    if (!member) {
      members.push(member as unknown as BandMember)
      continue
    }

    if (i !== memberIdx) {
      members.push(member)
    } else {
      const baseStats = (member?.baseStats ?? {}) as Record<string, unknown>
      const skillValue = finiteNumberOr(
        member?.baseStats?.skill ?? member?.skill,
        0
      )
      members.push({
        ...member,
        baseStats: {
          ...baseStats,
          // Same 1..10 range as event skill deltas (gameState/delta.ts); an
          // unclamped increment would let repeated quest rewards push the stat
          // out of the range balancing formulas assume.
          skill: Math.max(1, Math.min(10, skillValue + 1))
        }
      })
    }
  }

  const rewardedMember = members[memberIdx]
  const questName = typeof quest.label === 'string' ? quest.label : quest.id
  const memberName =
    rewardedMember && typeof rewardedMember.name === 'string'
      ? rewardedMember.name
      : ''
  toasts.push({
    id: `${quest.id}-skill`,
    messageKey: 'ui:toast.quest_complete_skill',
    options: { name: questName, member: memberName },
    type: 'success'
  })

  return { ...state, band: { ...state.band, members } }
}

/**
 * Applies all rewards for a completed quest and returns resulting toasts.
 */
export const applyQuestRewards = (
  state: GameState,
  quest: QuestState,
  randomIdx?: number
): QuestRewardResult => {
  let nextState = state
  const toasts: ToastPayload[] = []
  const questName = getQuestToastName(quest)

  for (const reward of getQuestRewards(quest)) {
    switch (reward.type) {
      case 'money': {
        const previousMoney = finiteNumberOr(nextState.player?.money, 0)
        const newMoney = clampPlayerMoney(previousMoney + reward.amount)
        const appliedDelta = newMoney - previousMoney
        nextState = {
          ...nextState,
          player: { ...(nextState.player ?? {}), money: newMoney }
        }
        if (appliedDelta !== 0) {
          toasts.push({
            id: `${quest.id}-money`,
            messageKey: 'ui:toast.quest_complete_money',
            options: {
              name: questName,
              amount: formatCurrency(appliedDelta, i18n.language, 'always')
            },
            type: 'success'
          })
        }
        break
      }
      case 'item.add': {
        nextState = {
          ...nextState,
          band: {
            ...nextState.band,
            inventory: {
              ...(nextState.band?.inventory ?? {}),
              [reward.itemId]: true
            }
          }
        }
        toasts.push({
          id: `${quest.id}-item`,
          messageKey: 'ui:toast.quest_complete_item',
          options: { name: questName },
          type: 'success'
        })
        break
      }
      case 'fame': {
        const previousFame = finiteNumberOr(nextState.player?.fame, 0)
        const newFame = clampPlayerFame(previousFame + reward.amount)
        const appliedDelta = newFame - previousFame
        nextState = {
          ...nextState,
          player: {
            ...nextState.player,
            fame: newFame,
            fameLevel: calculateFameLevel(newFame)
          }
        }
        if (appliedDelta !== 0) {
          toasts.push({
            id: `${quest.id}-fame`,
            messageKey: 'ui:toast.quest_complete_fame',
            options: { name: questName, amount: appliedDelta },
            type: 'success'
          })
        }
        break
      }
      case 'skill_point':
        nextState = applySkillPointReward(
          nextState,
          quest,
          reward,
          randomIdx,
          toasts
        )
        break
      case 'band.harmony': {
        const previousHarmony = finiteNumberOr(nextState.band?.harmony, 1)
        const newHarmony = clampBandHarmony(previousHarmony + reward.amount)
        const appliedDelta = newHarmony - previousHarmony
        nextState = {
          ...nextState,
          band: { ...nextState.band, harmony: newHarmony }
        }
        if (appliedDelta !== 0) {
          toasts.push({
            id: `${quest.id}-harmony`,
            messageKey: 'ui:toast.quest_complete_harmony',
            options: { name: questName, amount: appliedDelta },
            type: 'success'
          })
        }
        break
      }
      case 'asset.repair':
        nextState = updateFirstMatchingAssetCondition(
          nextState,
          reward,
          reward.amount
        )
        break
      case 'region.reputation':
        nextState = applyReputationDelta(
          nextState,
          getRegionReputationKey(nextState, reward.scope),
          reward.amount
        )
        break
      case 'brand.trust':
        nextState = applyBrandTrustDelta(nextState, reward)
        break
      case 'social.followers': {
        const platform = reward.platform ?? 'instagram'
        const previous = finiteNumberOr(nextState.social?.[platform], 0)
        // Follower counts have no upper clamp, so the sum of two finite
        // operands can overflow to Infinity; keep the previous count instead
        // of writing a non-finite value into state.
        const next = Math.max(
          0,
          finiteNumberOr(previous + reward.amount, previous)
        )
        nextState = {
          ...nextState,
          social: { ...nextState.social, [platform]: next }
        }
        const appliedDelta = next - previous
        if (appliedDelta !== 0) {
          toasts.push({
            id: `${quest.id}-fans`,
            messageKey: 'ui:toast.quest_complete_fans',
            options: { name: questName, amount: appliedDelta },
            type: 'success'
          })
        }
        break
      }
      case 'social.loyalty': {
        const previous = finiteNumberOr(nextState.social?.loyalty, 0)
        const next = clampLoyalty(previous + reward.amount)
        nextState = {
          ...nextState,
          social: { ...nextState.social, loyalty: next }
        }
        const appliedDelta = next - previous
        if (appliedDelta !== 0) {
          toasts.push({
            id: `${quest.id}-loyalty`,
            messageKey: 'ui:toast.quest_complete_loyalty',
            options: { name: questName, amount: appliedDelta },
            type: 'success'
          })
        }
        break
      }
      case 'social.controversy': {
        const previous = finiteNumberOr(nextState.social?.controversyLevel, 0)
        const next = clampControversyLevel(previous + reward.amount)
        nextState = {
          ...nextState,
          social: { ...nextState.social, controversyLevel: next }
        }
        const appliedDelta = next - previous
        if (appliedDelta !== 0) {
          toasts.push({
            id: `${quest.id}-controversy`,
            messageKey: 'ui:toast.quest_complete_controversy',
            options: { name: questName, amount: Math.abs(appliedDelta) },
            type: 'success'
          })
        }
        break
      }
      case 'trait.unlock': {
        const memberId =
          reward.memberId ??
          nextState.band?.members?.[0]?.id ??
          nextState.band?.members?.[0]?.name
        if (typeof memberId === 'string' && memberId.length > 0) {
          const traitResult = applyTraitUnlocks(
            { band: nextState.band, toasts: [] },
            [{ memberId, traitId: reward.traitId }]
          )
          nextState = { ...nextState, band: traitResult.band }
          toasts.push(...traitResult.toasts)
        }
        break
      }
      case 'flag.add':
        if (!nextState.activeStoryFlags?.includes(reward.flag)) {
          nextState = {
            ...nextState,
            activeStoryFlags: [
              ...(nextState.activeStoryFlags ?? []),
              reward.flag
            ]
          }
        }
        break
      case 'event.queue':
        nextState = queueEvent(nextState, reward.eventId)
        break
    }
  }

  return { state: nextState, toasts }
}
