import { clampBandHarmony } from '../../utils/gameStateUtils.js'

export const handleAddQuest = (state, quest) => {
  if (state.activeQuests?.some(q => q.id === quest.id)) return state
  return { ...state, activeQuests: [...(state.activeQuests || []), quest] }
}

export const handleCompleteQuest = (state, { questId }) => {
  const quest = state.activeQuests?.find(q => q.id === questId)
  if (!quest) return state
  let nextState = { ...state }

  // Remove from activeQuests
  nextState.activeQuests = (nextState.activeQuests || []).filter(
    q => q.id !== questId
  )

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
      message: `[${quest.label}]: COMPLETE`,
      type: 'success'
    }
  ]

  if (quest.id === 'quest_prove_yourself') {
    nextState.venueBlacklist = (nextState.venueBlacklist || []).slice(2) // clear 2
    nextState.player = {
      ...nextState.player,
      stats: { ...nextState.player.stats, proveYourselfMode: false }
    }
  }

  return nextState
}

export const handleAdvanceQuest = (state, { questId, amount = 1 }) => {
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
    return handleCompleteQuest(nextState, { questId })
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
        message: `[${quest.label}]: FAILED`,
        type: 'error'
      }
    ]
  })

  nextState.activeQuests = nextState.activeQuests.filter(
    q => q.deadline === null || nextState.player.day <= q.deadline
  )
  return nextState
}
