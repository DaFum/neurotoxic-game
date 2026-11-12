import type { GameState } from '../types'
import { isLooseRecord, isForbiddenKey } from '../utils/objectUtils'

/**
 * Sanitizes or reconstructs the normalized `completedQuests` index
 * (`{ global: string[], scoped: Record<string, string[]> }`).
 *
 * @param value - The raw persisted or unmigrated `completedQuests` object.
 * @param legacy - Optional legacy completed arrays to merge/fallback from.
 * @returns Sanitized CompletedQuestsState.
 */
export const sanitizeCompletedQuests = (
  value: unknown,
  legacy?: {
    completedQuestIds?: unknown
    completedQuestScopes?: unknown
  }
): NonNullable<GameState['completedQuests']> => {
  const globalSet = new Set<string>()
  const scopedMap: Record<string, string[]> = {}

  // 1. Process explicit completedQuests object if valid
  if (isLooseRecord(value)) {
    if (Array.isArray(value.global)) {
      for (const id of value.global) {
        if (typeof id === 'string' && id.length > 0 && !isForbiddenKey(id)) {
          globalSet.add(id)
        }
      }
    }
    if (isLooseRecord(value.scoped)) {
      for (const questId of Object.keys(value.scoped)) {
        if (typeof questId === 'string' && !isForbiddenKey(questId)) {
          const rawScopes = value.scoped[questId]
          if (Array.isArray(rawScopes)) {
            const validScopes = new Set<string>()
            for (const s of rawScopes) {
              if (typeof s === 'string' && s.length > 0 && !isForbiddenKey(s)) {
                validScopes.add(s)
              }
            }
            if (validScopes.size > 0) {
              scopedMap[questId] = Array.from(validScopes)
            }
          }
        }
      }
    }
  }

  // 2. Fallback / merge legacy completedQuestIds
  if (legacy && Array.isArray(legacy.completedQuestIds)) {
    for (const id of legacy.completedQuestIds) {
      if (typeof id === 'string' && id.length > 0 && !isForbiddenKey(id)) {
        globalSet.add(id)
      }
    }
  }

  // 3. Fallback / merge legacy completedQuestScopes
  if (legacy && Array.isArray(legacy.completedQuestScopes)) {
    for (const entry of legacy.completedQuestScopes) {
      if (
        isLooseRecord(entry) &&
        typeof entry.questId === 'string' &&
        typeof entry.scopeKey === 'string' &&
        !isForbiddenKey(entry.questId) &&
        !isForbiddenKey(entry.scopeKey) &&
        entry.questId.length > 0 &&
        entry.scopeKey.length > 0
      ) {
        const existing = Object.hasOwn(scopedMap, entry.questId)
          ? (scopedMap[entry.questId] ?? [])
          : []
        if (!existing.includes(entry.scopeKey)) {
          scopedMap[entry.questId] = [...existing, entry.scopeKey]
        }
      }
    }
  }

  return {
    global: Array.from(globalSet),
    scoped: scopedMap
  }
}
