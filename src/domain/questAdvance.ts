import type { GameState } from '../types'
import type { ActiveQuestState } from '../types/quest'
import { finiteNumberOr } from '../utils/gameState'
import { getQuestWithDefinition } from './questHelpers'
import { completeQuest } from './questComplete'

/**
 * Finds the index of an active quest by id, or -1 when not present.
 *
 * @remarks
 * Uses an explicit loop rather than `Array.findIndex` to avoid the
 * per-iteration predicate callback on this hot path.
 */
const findActiveQuestIndex = (
  activeQuests: ActiveQuestState[],
  questId: string
): number => {
  for (let i = 0; i < activeQuests.length; i++) {
    if (activeQuests[i]?.id === questId) return i
  }
  return -1
}

/**
 * Locates an active quest and resolves the pieces both progress mutators share:
 * a next state with a freshly-cloned `activeQuests` array holding a cloned copy
 * of the target quest, the quest index, and the raw `required` threshold
 * (instance value falling back to the definition). Cloning the array and the
 * quest here means callers can update the returned `q`/array without mutating
 * the original state. Returns null when the quest is absent, so callers bail
 * with unchanged state.
 */
const resolveActiveQuest = (
  state: GameState,
  questId: string
): {
  nextState: GameState
  q: ActiveQuestState
  questIndex: number
  rawRequired: number | undefined
} | null => {
  if (!state.activeQuests) return null
  const questIndex = findActiveQuestIndex(state.activeQuests, questId)
  if (questIndex === -1) return null

  const nextActiveQuests = [...state.activeQuests]
  const original = nextActiveQuests[questIndex]
  if (!original) return null
  const q = { ...original }
  nextActiveQuests[questIndex] = q
  const nextState = { ...state, activeQuests: nextActiveQuests }

  const questConfig = getQuestWithDefinition(q)
  const rawRequired = q.required ?? questConfig.required
  return { nextState, q, questIndex, rawRequired }
}

export const advanceQuest = (
  state: GameState,
  {
    questId,
    amount = 1,
    randomIdx
  }: { questId: string; amount?: number; randomIdx?: number }
): GameState => {
  const resolved = resolveActiveQuest(state, questId)
  if (!resolved) return state
  const { nextState, q, questIndex, rawRequired } = resolved
  const safeRequired = finiteNumberOr(rawRequired, Number.NaN)

  if (!Number.isFinite(safeRequired) || safeRequired <= 0) {
    return state
  }

  if (amount !== undefined && typeof amount !== 'number') {
    return state
  }

  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
    return state
  }

  const safeAmount = amount ?? 1
  const safeProgress = Math.max(0, finiteNumberOr(q.progress, 0))

  const newProgress = Math.min(safeRequired, safeProgress + safeAmount)

  // nextState.activeQuests is already a fresh clone from resolveActiveQuest;
  // replace the target entry with the updated quest.
  nextState.activeQuests[questIndex] = {
    ...q,
    required: safeRequired,
    progress: newProgress
  }

  if (newProgress >= safeRequired) {
    return completeQuest(nextState, { questId, randomIdx })
  }
  return nextState
}

/**
 * Sets a quest's progress to an absolute value (monotonic — never lowers it),
 * capped at `required`, and completes the quest when the cap is reached. Used
 * for threshold-style sources such as harmony recovery, where progress is the
 * current stat level rather than an accumulated count.
 */
export const setQuestProgress = (
  state: GameState,
  { questId, progress }: { questId: string; progress: number }
): GameState => {
  const resolved = resolveActiveQuest(state, questId)
  if (!resolved) return state
  const { nextState, q, questIndex, rawRequired } = resolved
  const required = finiteNumberOr(rawRequired, Number.NaN)
  const prev = finiteNumberOr(q.progress, 0)
  const next = Math.max(prev, finiteNumberOr(progress, prev))
  const hasRequired = Number.isFinite(required) && required > 0
  const capped = hasRequired ? Math.min(required, next) : next

  // nextState.activeQuests is already a fresh clone from resolveActiveQuest;
  // replace the target entry with the updated quest.
  nextState.activeQuests[questIndex] = {
    ...q,
    required: hasRequired ? required : rawRequired,
    progress: capped
  }

  if (hasRequired && capped >= required) {
    return completeQuest(nextState, { questId })
  }
  return nextState
}
