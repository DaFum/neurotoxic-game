import type { QuestDefinition } from '../types/quest'
import * as ALL_QUESTS from './quests'

/**
 * Static quest configuration registry keyed by stable quest id.
 */
export const QUEST_REGISTRY = ALL_QUESTS satisfies Record<
  string,
  QuestDefinition
>

export type QuestRegistryId = keyof typeof QUEST_REGISTRY

/**
 * Looks up a quest's static definition by id. Returns `undefined` for unknown
 * ids so callers can fall back to inline payloads.
 */
const isQuestRegistryId = (questId: string): questId is QuestRegistryId =>
  Object.hasOwn(QUEST_REGISTRY, questId)

/**
 * Looks up a quest's static definition by id.
 */
export const getQuestDefinition = (
  questId: string
): QuestDefinition | undefined =>
  isQuestRegistryId(questId) ? QUEST_REGISTRY[questId] : undefined
