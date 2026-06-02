import type { ActiveQuestState, GameState, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'

export const getQuestWithDefinition = (
  quest: QuestState | ActiveQuestState
): QuestState => {
  const definition = getQuestDefinition(quest.id) as
    | Partial<QuestState>
    | undefined
  return definition ? { ...definition, ...quest } : quest
}

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

export const getQuestToastName = (quest: QuestState): string => quest.label ?? quest.id

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
