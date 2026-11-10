/**
 * Milestone Progression Evaluation Module
 *
 * Purely evaluates progression milestone conditions on advance day,
 * marks newly unlocked milestones as completed, and applies declarative
 * or action-based rewards directly to state without re-entrant dispatches
 * to `gameReducer`.
 */

import type { GameState, GameAction } from '../../types'
import { MILESTONES } from '../../data/milestones/milestones'
import { ActionTypes } from '../../context/actionTypes'
import { handleUpdatePlayer } from '../../context/reducers/playerReducer'
import { handleUpdateBand } from '../../context/reducers/bandReducer'
import { handleUpdateSocial } from '../../context/reducers/socialReducer'
import { createAddToastActionWithId } from '../../context/actionCreators'
import {
  buildDeterministicToastId,
  sanitizeLoadedToast
} from '../../context/reducers/toastSanitizers'
import { finiteNumberOr } from '../../utils/finiteNumber'

interface DeclarativeMilestoneReward {
  cash?: number
  money?: number
  fans?: number
  fame?: number
  harmony?: number
  luck?: number
  unlock?: string
  unlocks?: string[]
  social?: Partial<GameState['social']>
}

export interface MilestoneDefinition {
  id: string
  condition: (state: GameState) => boolean
  createRewardAction?: () => GameAction
  reward?: DeclarativeMilestoneReward
  rewards?: DeclarativeMilestoneReward
  labelKey: string
  createLabelOptions?: () => Record<string, unknown>
}

/**
 * Applies an action-based milestone reward directly using domain reducers,
 * avoiding recursive/re-entrant gameReducer dispatches.
 */
const applyRewardAction = (state: GameState, action: GameAction): GameState => {
  if (!action || typeof action !== 'object' || !Object.hasOwn(action, 'type')) {
    return state
  }

  switch (action.type) {
    case ActionTypes.UPDATE_PLAYER:
      return handleUpdatePlayer(
        state,
        action.payload as Parameters<typeof handleUpdatePlayer>[1]
      )
    case ActionTypes.UPDATE_BAND:
      return handleUpdateBand(
        state,
        action.payload as Parameters<typeof handleUpdateBand>[1]
      )
    case ActionTypes.UPDATE_SOCIAL:
      return handleUpdateSocial(
        state,
        action.payload as Parameters<typeof handleUpdateSocial>[1]
      )
    default:
      return state
  }
}

/**
 * Applies declarative milestone rewards directly to state.
 */
const applyDeclarativeReward = (
  state: GameState,
  reward: DeclarativeMilestoneReward
): GameState => {
  let nextState = state

  const moneyDelta = finiteNumberOr(reward.money ?? reward.cash, 0)
  const fameDelta = finiteNumberOr(reward.fame ?? reward.fans, 0)

  if (moneyDelta !== 0 || fameDelta !== 0) {
    nextState = handleUpdatePlayer(nextState, (prev: GameState['player']) => ({
      ...(moneyDelta !== 0
        ? { money: finiteNumberOr(prev.money, 0) + moneyDelta }
        : {}),
      ...(fameDelta !== 0
        ? { fame: finiteNumberOr(prev.fame, 0) + fameDelta }
        : {})
    }))
  }

  const harmonyDelta = finiteNumberOr(reward.harmony, 0)
  const luckDelta = finiteNumberOr(reward.luck, 0)

  if (harmonyDelta !== 0 || luckDelta !== 0) {
    nextState = handleUpdateBand(nextState, (prev: GameState['band']) => ({
      ...(harmonyDelta !== 0
        ? { harmony: finiteNumberOr(prev.harmony, 0) + harmonyDelta }
        : {}),
      ...(luckDelta !== 0
        ? { luck: finiteNumberOr(prev.luck, 0) + luckDelta }
        : {})
    }))
  }

  if (reward.unlock && typeof reward.unlock === 'string') {
    if (!nextState.unlocks?.includes(reward.unlock)) {
      nextState = {
        ...nextState,
        unlocks: [...(nextState.unlocks ?? []), reward.unlock]
      }
    }
  }

  if (Array.isArray(reward.unlocks)) {
    const currentUnlocks = new Set(nextState.unlocks ?? [])
    for (const u of reward.unlocks) {
      if (typeof u === 'string' && u.length > 0) {
        currentUnlocks.add(u)
      }
    }
    nextState = {
      ...nextState,
      unlocks: Array.from(currentUnlocks)
    }
  }

  if (reward.social && typeof reward.social === 'object') {
    nextState = handleUpdateSocial(nextState, reward.social)
  }

  return nextState
}

/**
 * Pure milestone check evaluating conditions against current state,
 * recording unlocked milestone IDs in completedMilestones, and applying
 * milestone rewards and deterministic toasts directly to state.
 *
 * @param state - Current game state
 * @param milestoneList - List of milestone definitions to evaluate (defaults to canonical MILESTONES)
 * @returns Updated game state with unlocked milestones and rewards applied, or original state if unchanged.
 */
export const checkMilestones = (
  state: GameState,
  milestoneList: readonly MilestoneDefinition[] = MILESTONES as readonly MilestoneDefinition[]
): GameState => {
  if (!state || typeof state !== 'object') return state

  const completedMilestones = Array.isArray(state.completedMilestones)
    ? state.completedMilestones
    : []
  const completedSet = new Set(completedMilestones)
  const triggeredMilestones: MilestoneDefinition[] = []

  for (let i = 0; i < milestoneList.length; i++) {
    const m = milestoneList[i]
    if (
      !m ||
      typeof m.id !== 'string' ||
      completedSet.has(m.id) ||
      typeof m.condition !== 'function'
    ) {
      continue
    }

    let conditionPassed: boolean
    try {
      conditionPassed = Boolean(m.condition(state))
    } catch {
      conditionPassed = false
    }

    if (conditionPassed) {
      triggeredMilestones.push(m)
      completedSet.add(m.id) // Ensure idempotency if conditions overlap
    }
  }

  if (triggeredMilestones.length === 0) {
    return state
  }

  let nextState: GameState = {
    ...state,
    completedMilestones: Array.from(completedSet)
  }

  for (let i = 0; i < triggeredMilestones.length; i++) {
    const milestone = triggeredMilestones[i]
    if (!milestone) continue

    // 1. Declarative rewards
    const declarative = milestone.reward ?? milestone.rewards
    if (declarative) {
      nextState = applyDeclarativeReward(nextState, declarative)
    }

    // 2. Action factory rewards (applied directly without re-entrant gameReducer)
    if (typeof milestone.createRewardAction === 'function') {
      const rewardAction = milestone.createRewardAction()
      if (rewardAction) {
        nextState = applyRewardAction(nextState, rewardAction)
      }
    }

    // 3. Deterministic milestone toast
    if (milestone.labelKey) {
      const toastAction = createAddToastActionWithId(
        {
          type: 'info',
          messageKey: milestone.labelKey,
          options: milestone.createLabelOptions?.()
        },
        buildDeterministicToastId('milestone-toast', nextState.toasts)
      )

      if (toastAction?.payload) {
        const safeToast = sanitizeLoadedToast(toastAction.payload)
        if (safeToast) {
          nextState = {
            ...nextState,
            toasts: [...(nextState.toasts ?? []), safeToast]
          }
        }
      }
    }
  }

  return nextState
}
