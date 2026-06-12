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
  clamp0to100,
  clampControversyLevel,
  clampLoyalty,
  clampPlayerFame,
  clampPlayerMoney,
  finiteNumberOr
} from '../utils/gameState'
import { applyTraitUnlocks } from '../utils/traitUtils'
import { getQuestToastName } from './questHelpers'
import {
  applyBrandTrustDelta,
  applyReputationDelta,
  applyVenueReputationDelta,
  getRegionReputationKey,
  getVenueReputationKey,
  queueEvent
} from './questEffects'

/**
 * State and toast payloads produced by applying quest rewards.
 */
export interface QuestRewardResult {
  state: GameState
  toasts: ToastPayload[]
}

const normalizeLegacyRewards = (quest: QuestState): QuestReward[] => {
  const rewards: QuestReward[] = []
  if (typeof quest.moneyReward === 'number' && quest.moneyReward !== 0) {
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
    const memberIndex =
      typeof quest.rewardData?.memberIndex === 'number'
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
export const getQuestRewards = (quest: QuestState): QuestReward[] =>
  Array.isArray(quest.rewards) && quest.rewards.length > 0
    ? quest.rewards
    : normalizeLegacyRewards(quest)

const applyAssetRepair = (
  state: GameState,
  reward: Extract<QuestReward, { type: 'asset.repair' }>
): GameState => {
  let repaired = false
  const assets = (state.assets ?? []).map(asset => {
    const matchesId =
      typeof reward.assetId === 'string' && asset.id === reward.assetId
    const matchesKind =
      reward.assetId == null &&
      typeof reward.assetKind === 'string' &&
      asset.kind === reward.assetKind
    if (repaired || (!matchesId && !matchesKind)) return asset
    repaired = true
    return {
      ...asset,
      condition: clamp0to100(finiteNumberOr(asset.condition, 0) + reward.amount)
    }
  })
  return repaired ? { ...state, assets } : state
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

  const memberIdx =
    typeof reward.memberIndex === 'number'
      ? Math.max(0, Math.min(originalMembers.length - 1, reward.memberIndex))
      : typeof randomIdx === 'number'
        ? Math.max(0, Math.min(originalMembers.length - 1, randomIdx))
        : 0

  const members = originalMembers.map((member: BandMember, idx: number) => {
    if (idx !== memberIdx) return member
    const baseStats = (member.baseStats ?? {}) as Record<string, unknown>
    const currentSkill = member.baseStats
      ? Number((member.baseStats as Record<string, unknown>).skill)
      : Number(member.skill)
    const skillValue = Number.isFinite(currentSkill) ? currentSkill : 0
    return {
      ...member,
      baseStats: {
        ...baseStats,
        skill: skillValue + 1
      }
    }
  })

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
        const previousMoney = nextState.player?.money ?? 0
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
        const previousFame = nextState.player?.fame ?? 0
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
        nextState = applyAssetRepair(nextState, reward)
        break
      case 'venue.reputation':
        nextState = applyVenueReputationDelta(
          nextState,
          getVenueReputationKey(nextState, reward.scope),
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
        const next = Math.max(0, previous + reward.amount)
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
