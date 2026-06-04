import type { ActiveQuestState, GameState, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'

/**
 * Merges a quest instance with its registry definition when available.
 */
export const getQuestWithDefinition = (
  quest: QuestState | ActiveQuestState
): QuestState => {
  const definition = getQuestDefinition(quest.id) as
    | Partial<QuestState>
    | undefined
  return definition ? { ...definition, ...quest } : quest
}

/**
 * Builds the runtime-only active quest shape for registry-backed quests.
 */
export const createActiveQuestRuntime = (
  quest: QuestState,
  startedOnDay: number,
  isRegistryBacked: boolean
): ActiveQuestState => {
  if (!isRegistryBacked) return quest as ActiveQuestState
  return {
    id: quest.id,
    deadline: quest.deadline,
    progress: quest.progress,
    required: quest.required,
    scopeKey: quest.scopeKey,
    status: 'active',
    startedOnDay
  }
}

/**
 * Resolves the display name key or id used in quest toasts.
 */
export const getQuestToastName = (quest: QuestState): string =>
  quest.label ?? quest.id

/**
 * Adds valid story flags while preserving existing entries and order.
 */
export const addStoryFlags = (
  flags: GameState['activeStoryFlags'],
  additions: unknown[]
): GameState['activeStoryFlags'] => {
  const validAdditions = additions.filter(
    (flag): flag is string => typeof flag === 'string' && flag.length > 0
  )
  if (validAdditions.length === 0) return flags
  const nextFlags = [...(flags ?? [])]
  for (const flag of validAdditions) {
    if (!nextFlags.includes(flag)) nextFlags.push(flag)
  }
  return nextFlags
}
