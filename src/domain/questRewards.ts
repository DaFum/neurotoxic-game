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
  finiteNumberOr
} from '../utils/gameStateUtils'

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

const getQuestRewards = (quest: QuestState): QuestReward[] => [
  ...(Array.isArray(quest.rewards) ? quest.rewards : []),
  ...normalizeLegacyRewards(quest)
]

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
  toasts.push({
    id: `${quest.id}-skill`,
    messageKey: 'ui:toast.quest_complete_skill',
    options: { name: quest.label, member: rewardedMember?.name },
    type: 'success'
  })

  return { ...state, band: { ...state.band, members } }
}

export const applyQuestRewards = (
  state: GameState,
  quest: QuestState,
  randomIdx?: number
): QuestRewardResult => {
  let nextState = state
  const toasts: ToastPayload[] = []

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
              name: quest.label,
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
          options: { name: quest.label },
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
            options: { name: quest.label, amount: appliedDelta },
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
        const previousHarmony = nextState.band?.harmony ?? 1
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
            options: { name: quest.label, amount: appliedDelta },
            type: 'success'
          })
        }
        break
      }
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
            options: { name: quest.label, amount: appliedDelta },
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
            options: { name: quest.label, amount: appliedDelta },
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
            options: { name: quest.label, amount: Math.abs(appliedDelta) },
            type: 'success'
          })
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
    }
  }

  return { state: nextState, toasts }
}
