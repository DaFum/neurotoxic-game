import { clampBandHarmony, clampPlayerMoney, calculateFameLevel } from '../../utils/gameStateUtils.js'

export const handleAddQuest = (state, quest) => {
  if (state.activeQuests?.some(q => q.id === quest.id)) return state
  return { ...state, activeQuests: [...(state.activeQuests || []), quest] }
}

export const handleCompleteQuest = (state, { questId, randomIdx }) => {
  const quest = state.activeQuests?.find(q => q.id === questId)
  if (!quest) return state
  let nextState = { ...state }

  // Remove from activeQuests
  nextState.activeQuests = (nextState.activeQuests || []).filter(
    q => q.id !== questId
  )

  // Apply generic quest rewards
  let rewardMessageKey = ''
  let rewardParams = {}

  if (typeof quest.moneyReward === 'number' && quest.moneyReward !== 0) {
    nextState.player = {
      ...(nextState.player || {}),
      money: clampPlayerMoney((nextState.player?.money || 0) + quest.moneyReward)
    }
    rewardMessageKey = 'ui:toast.quest_complete_money'
    rewardParams = { name: quest.label, amount: quest.moneyReward }
  }

  if (quest.rewardType === 'item' && quest.rewardData?.item) {
    nextState.band = {
      ...nextState.band,
      inventory: {
        ...(nextState.band?.inventory || {}),
        [quest.rewardData.item]: true
      }
    }
    if (!rewardMessageKey) {
      rewardMessageKey = 'ui:toast.quest_complete_item'
      rewardParams = { name: quest.label }
    }
  } else if (quest.rewardType === 'fame' && quest.rewardData?.fame) {
    nextState.player = {
      ...nextState.player,
      fame: (nextState.player.fame || 0) + quest.rewardData.fame,
      fameLevel: calculateFameLevel((nextState.player.fame || 0) + quest.rewardData.fame)
    }
    rewardMessageKey = 'ui:toast.quest_complete_fame'
    rewardParams = { name: quest.label, amount: quest.rewardData.fame }
  } else if (quest.rewardType === 'skill_point') {
    const members = [...(nextState.band?.members || [])]
    if (members.length > 0) {
      const memberIdx =
        typeof quest.rewardData?.memberIndex === 'number'
          ? Math.max(0, Math.min(members.length - 1, quest.rewardData.memberIndex))
          : (typeof randomIdx === 'number'
              ? Math.max(0, Math.min(members.length - 1, randomIdx))
              : 0)

      members[memberIdx] = {
        ...members[memberIdx],
        skill: (members[memberIdx].skill || 0) + 1
      }

      nextState.band = { ...nextState.band, members }
      rewardMessageKey = 'ui:toast.quest_complete_skill'
      rewardParams = { name: quest.label, member: members[memberIdx].name }
    }
  } else if (quest.rewardType === 'harmony' && quest.rewardData?.harmony) {
    nextState.band = {
      ...nextState.band,
      harmony: clampBandHarmony((nextState.band?.harmony || 0) + quest.rewardData.harmony)
    }
    rewardMessageKey = 'ui:toast.quest_complete_harmony'
    rewardParams = { name: quest.label, amount: quest.rewardData.harmony }
  }

  if (!rewardMessageKey) {
    rewardMessageKey = 'ui:toast.quest_complete'
    rewardParams = { name: quest.label }
  }

  // Add reward flag
  if (quest.rewardFlag) {
    nextState.activeStoryFlags = [
      ...(nextState.activeStoryFlags || []),
      quest.rewardFlag
    ]
  }

  // Toast
  nextState.toasts = [
    ...(nextState.toasts || []),
    {
      id: `${Date.now()}-${questId}`,
      message: `${rewardMessageKey}|${JSON.stringify(rewardParams)}`,
      type: 'success'
    }
  ]

  // Hardcoded old quest logic
  if (quest.id === 'quest_prove_yourself') {
    nextState.venueBlacklist = (nextState.venueBlacklist || []).slice(2) // clear 2
    nextState.player = {
      ...nextState.player,
      stats: { ...nextState.player.stats, proveYourselfMode: false }
    }
  }

  return nextState
}

export const handleAdvanceQuest = (state, { questId, amount = 1, randomIdx }) => {
  let nextState = { ...state }
  let questCompleted = false
  if (!nextState.activeQuests) return state

  nextState.activeQuests = nextState.activeQuests.map(q => {
    if (q.id === questId) {
      const newProgress = q.progress + amount
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
  let nextState = { ...state }
  if (!nextState.activeQuests) return state

  const expiredQuests = nextState.activeQuests.filter(
    q => q.deadline !== null && nextState.player.day > q.deadline
  )
  if (expiredQuests.length === 0) return state

  expiredQuests.forEach(quest => {
    if (quest.failurePenalty) {
      if (quest.failurePenalty.social?.controversyLevel) {
        // Deep clone before mutating
        nextState.social = { ...nextState.social }
        nextState.social.controversyLevel =
          (nextState.social.controversyLevel || 0) +
          quest.failurePenalty.social.controversyLevel
      }
      if (quest.failurePenalty.band?.harmony) {
        // Deep clone before mutating
        nextState.band = { ...nextState.band }
        nextState.band.harmony = clampBandHarmony(
          (nextState.band.harmony || 0) + quest.failurePenalty.band.harmony
        )
      }
    }
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: `${Date.now()}-${quest.id}`,
        message: `ui:toast.quest_failed|${JSON.stringify({ name: quest.label })}`,
        type: 'error'
      }
    ]
  })

  nextState.activeQuests = nextState.activeQuests.filter(
    q => q.deadline === null || nextState.player.day <= q.deadline
  )
  return nextState
}
