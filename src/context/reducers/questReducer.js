// TODO: Review this file
import {
  clampPlayerFame,
  clampBandHarmony,
  clampPlayerMoney,
  calculateFameLevel,
  clampControversyLevel
} from '../../utils/gameStateUtils.js'
import { QUEST_PROVE_YOURSELF } from '../../data/questsConstants.js'
import { hasActiveQuest } from '../../utils/questUtils.js'

export const handleAddQuest = (state, quest) => {
  if (hasActiveQuest(state.activeQuests, quest.id)) return state
  return { ...state, activeQuests: [...(state.activeQuests || []), quest] }
}

export const handleCompleteQuest = (state, { questId, randomIdx }) => {
  if (!state.activeQuests) return state
  const questIndex = state.activeQuests.findIndex(q => q.id === questId)
  if (questIndex === -1) return state

  const quest = state.activeQuests[questIndex]
  const nextState = { ...state }

  // Remove from activeQuests using toSpliced
  nextState.activeQuests = nextState.activeQuests.toSpliced(questIndex, 1)

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
        id: `${crypto.randomUUID()}-${questId}-money`,
        message: `ui:toast.quest_complete_money|${JSON.stringify({ name: quest.label, amount: appliedDelta })}`,
        type: 'success'
      })
    }
  }

  if (quest.rewardType === 'item' && quest.rewardData?.item) {
    nextState.band = {
      ...nextState.band,
      inventory: {
        ...(nextState.band?.inventory || {}),
        [quest.rewardData.item]: true
      }
    }
    generatedToasts.push({
      id: `${crypto.randomUUID()}-${questId}-item`,
      message: `ui:toast.quest_complete_item|${JSON.stringify({ name: quest.label })}`,
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
        id: `${crypto.randomUUID()}-${questId}-fame`,
        message: `ui:toast.quest_complete_fame|${JSON.stringify({ name: quest.label, amount: appliedDelta })}`,
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
          return {
            ...m,
            baseStats: {
              ...(m.baseStats || {}),
              skill: ((m.baseStats && m.baseStats.skill) || m.skill || 0) + 1
            }
          }
        }
        return m
      })

      nextState.band = { ...nextState.band, members }
      generatedToasts.push({
        id: `${crypto.randomUUID()}-${questId}-skill`,
        message: `ui:toast.quest_complete_skill|${JSON.stringify({ name: quest.label, member: members[memberIdx].name })}`,
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
        id: `${crypto.randomUUID()}-${questId}-harmony`,
        message: `ui:toast.quest_complete_harmony|${JSON.stringify({ name: quest.label, amount: appliedDelta })}`,
        type: 'success'
      })
    }
  }

  if (generatedToasts.length === 0) {
    generatedToasts.push({
      id: `${crypto.randomUUID()}-${questId}-generic`,
      message: `ui:toast.quest_complete|${JSON.stringify({ name: quest.label })}`,
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
  state,
  { questId, amount = 1, randomIdx }
) => {
  const nextState = { ...state }
  let questCompleted = false
  if (!nextState.activeQuests) return state

  nextState.activeQuests = nextState.activeQuests.map(q => {
    if (q.id === questId) {
      const newProgress = Math.min(q.required, q.progress + amount)
      if (newProgress >= q.required) {
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

export const handleFailQuests = state => {
  const nextState = { ...state }
  if (!nextState.activeQuests) return state

  let hasExpired = false
  const newActiveQuests = []
  const newToasts = []

  for (let i = 0; i < nextState.activeQuests.length; i++) {
    const quest = nextState.activeQuests[i]

    if (quest.deadline !== null && nextState.player.day > quest.deadline) {
      hasExpired = true
      if (quest.failurePenalty) {
        if (quest.failurePenalty.social?.controversyLevel) {
          // Deep clone before mutating
          nextState.social = { ...nextState.social }
          const penalty = Number(quest.failurePenalty.social.controversyLevel)
          const validPenalty = Number.isFinite(penalty) ? penalty : 0
          nextState.social.controversyLevel = clampControversyLevel(
            (nextState.social.controversyLevel || 0) + validPenalty
          )
        }
        if (quest.failurePenalty.band?.harmony) {
          // Deep clone before mutating
          nextState.band = { ...nextState.band }
          nextState.band.harmony = clampBandHarmony(
            (nextState.band.harmony ?? 1) + quest.failurePenalty.band.harmony
          )
        }
      }
      newToasts.push({
        id: `${crypto.randomUUID()}-${quest.id}`,
        message: `ui:toast.quest_failed|${JSON.stringify({ name: quest.label })}`,
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
