import type { GameState, QuestState, ToastPayload } from '../../types/game'
import {
  clampPlayerFame,
  clampBandHarmony,
  clampPlayerMoney,
  calculateFameLevel,
  clampControversyLevel
} from '../../utils/gameStateUtils'
import { QUEST_PROVE_YOURSELF } from '../../data/questsConstants'
import { hasActiveQuest } from '../../utils/questUtils'

export const handleAddQuest = (
  state: GameState,
  quest: QuestState
): GameState => {
  if (hasActiveQuest(state.activeQuests, quest.id)) return state
  return { ...state, activeQuests: [...(state.activeQuests || []), quest] }
}

export const handleCompleteQuest = (
  state: GameState,
  { questId, randomIdx }: { questId: string; randomIdx?: number }
): GameState => {
  if (!state.activeQuests) return state
  const questIndex = state.activeQuests.findIndex(q => q.id === questId)
  if (questIndex === -1) return state

  const quest = state.activeQuests[questIndex] as QuestState | undefined
  if (!quest) return state
  const nextState = { ...state }

  // Remove from activeQuests
  nextState.activeQuests = state.activeQuests
    .slice(0, questIndex)
    .concat(state.activeQuests.slice(questIndex + 1))

  // Apply generic quest rewards
  const generatedToasts = []

  if (typeof quest.moneyReward === 'number' && quest.moneyReward !== 0) {
    const previousMoney = nextState.player?.money || 0
    const newMoney = clampPlayerMoney(previousMoney + quest.moneyReward)
    const appliedDelta = newMoney - previousMoney
    nextState.player = {
      ...(nextState.player || {}),
      money: newMoney
    }
    if (appliedDelta !== 0) {
      generatedToasts.push({
        id: `${questId}-money`,
        messageKey: 'ui:toast.quest_complete_money',
        options: { name: quest.label, amount: appliedDelta },
        type: 'success'
      })
    }
  }

  if (quest.rewardType === 'item' && quest.rewardData?.item) {
    const itemKey = String(quest.rewardData.item)
    nextState.band = {
      ...nextState.band,
      inventory: {
        ...(nextState.band?.inventory || {}),
        [itemKey]: true
      }
    }
    generatedToasts.push({
      id: `${questId}-item`,
      messageKey: 'ui:toast.quest_complete_item',
      options: { name: quest.label },
      type: 'success'
    })
  } else if (quest.rewardType === 'fame' && quest.rewardData?.fame) {
    let rawFameReward = Number(quest.rewardData.fame)
    if (!Number.isFinite(rawFameReward)) rawFameReward = 0
    const previousFame = nextState.player.fame || 0
    const newFame = clampPlayerFame(previousFame + rawFameReward)
    const appliedDelta = newFame - previousFame
    nextState.player = {
      ...nextState.player,
      fame: newFame,
      fameLevel: calculateFameLevel(newFame)
    }
    if (appliedDelta !== 0) {
      generatedToasts.push({
        id: `${questId}-fame`,
        messageKey: 'ui:toast.quest_complete_fame',
        options: { name: quest.label, amount: appliedDelta },
        type: 'success'
      })
    }
  } else if (quest.rewardType === 'skill_point') {
    const originalMembers = nextState.band?.members || []
    if (originalMembers.length > 0) {
      const memberIdx =
        typeof quest.rewardData?.memberIndex === 'number'
          ? Math.max(
              0,
              Math.min(originalMembers.length - 1, quest.rewardData.memberIndex)
            )
          : typeof randomIdx === 'number'
            ? Math.max(0, Math.min(originalMembers.length - 1, randomIdx))
            : 0

      const members = originalMembers.map((m, idx) => {
        if (idx === memberIdx) {
          const baseStats = (m.baseStats || {}) as Record<string, unknown>
          const currentSkill = m.baseStats
            ? Number((m.baseStats as Record<string, unknown>).skill)
            : Number((m as Record<string, unknown>).skill)
          const skillValue = Number.isFinite(currentSkill) ? currentSkill : 0
          return {
            ...m,
            baseStats: {
              ...baseStats,
              skill: skillValue + 1
            }
          }
        }
        return m
      })

      nextState.band = { ...nextState.band, members }
      const rewardedMember = members[memberIdx]
      generatedToasts.push({
        id: `${questId}-skill`,
        messageKey: 'ui:toast.quest_complete_skill',
        options: { name: quest.label, member: rewardedMember?.name },
        type: 'success'
      })
    }
  } else if (quest.rewardType === 'harmony' && quest.rewardData?.harmony) {
    let rawHarmonyReward = Number(quest.rewardData.harmony)
    if (!Number.isFinite(rawHarmonyReward)) rawHarmonyReward = 0
    const previousHarmony = nextState.band?.harmony ?? 1
    const newHarmony = clampBandHarmony(previousHarmony + rawHarmonyReward)
    const appliedDelta = newHarmony - previousHarmony
    nextState.band = {
      ...nextState.band,
      harmony: newHarmony
    }
    if (appliedDelta !== 0) {
      generatedToasts.push({
        id: `${questId}-harmony`,
        messageKey: 'ui:toast.quest_complete_harmony',
        options: { name: quest.label, amount: appliedDelta },
        type: 'success'
      })
    }
  }

  if (generatedToasts.length === 0) {
    generatedToasts.push({
      id: `${questId}-generic`,
      messageKey: 'ui:toast.quest_complete',
      options: { name: quest.label },
      type: 'success'
    })
  }

  // Add reward flag
  if (quest.rewardFlag) {
    nextState.activeStoryFlags = [
      ...(nextState.activeStoryFlags || []),
      quest.rewardFlag
    ]
  }

  // Toast
  nextState.toasts = [...(nextState.toasts || []), ...generatedToasts]

  // Hardcoded old quest logic
  if (quest.id === QUEST_PROVE_YOURSELF) {
    nextState.venueBlacklist = (nextState.venueBlacklist || []).slice(2) // clear 2
    nextState.player = {
      ...nextState.player,
      stats: { ...nextState.player.stats, proveYourselfMode: false }
    }
  }

  return nextState
}

export const handleAdvanceQuest = (
  state: GameState,
  {
    questId,
    amount = 1,
    randomIdx
  }: { questId: string; amount?: number; randomIdx?: number }
): GameState => {
  const nextState = { ...state }
  let questCompleted = false
  if (!nextState.activeQuests) return state

  nextState.activeQuests = nextState.activeQuests.map(q => {
    if (q.id === questId) {
      const required = q.required
      const progress = q.progress ?? 0
      if (typeof required !== 'number') {
        return q
      }
      const newProgress = Math.min(required, progress + (amount ?? 1))
      if (newProgress >= required) {
        questCompleted = true
      }
      return { ...q, progress: newProgress }
    }
    return q
  })

  if (questCompleted) {
    return handleCompleteQuest(nextState, { questId, randomIdx })
  }
  return nextState
}

export const handleFailQuests = (state: GameState): GameState => {
  const nextState = { ...state }
  if (!nextState.activeQuests) return state

  let hasExpired = false
  const newActiveQuests: QuestState[] = []
  const newToasts: ToastPayload[] = []

  for (let i = 0; i < nextState.activeQuests.length; i++) {
    const quest = nextState.activeQuests[i]
    if (!quest) continue
    const penalty = quest.failurePenalty as Record<string, unknown> | undefined

    if (
      typeof quest.deadline === 'number' &&
      nextState.player.day > quest.deadline
    ) {
      hasExpired = true
      if (penalty) {
        const socialPenalty = penalty.social as
          | Record<string, unknown>
          | undefined
        if (socialPenalty?.controversyLevel) {
          // Deep clone before mutating
          nextState.social = { ...nextState.social }
          const controversyDelta = Number(socialPenalty.controversyLevel)
          const validPenalty = Number.isFinite(controversyDelta)
            ? controversyDelta
            : 0
          nextState.social.controversyLevel = clampControversyLevel(
            (nextState.social.controversyLevel || 0) + validPenalty
          )
        }
        const bandPenalty = penalty.band as Record<string, unknown> | undefined
        if (bandPenalty?.harmony) {
          // Deep clone before mutating
          nextState.band = { ...nextState.band }
          const harmonyDelta = Number(bandPenalty.harmony)
          nextState.band.harmony = clampBandHarmony(
            (nextState.band.harmony ?? 1) +
              (Number.isFinite(harmonyDelta) ? harmonyDelta : 0)
          )
        }
      }
      newToasts.push({
        id: `${quest.id}-fail`,
        messageKey: 'ui:toast.quest_failed',
        options: { name: quest.label },
        type: 'error'
      })
    } else {
      newActiveQuests.push(quest)
    }
  }

  if (!hasExpired) return state

  nextState.activeQuests = newActiveQuests
  if (newToasts.length > 0) {
    nextState.toasts = [...(nextState.toasts || []), ...newToasts]
  }

  return nextState
}
