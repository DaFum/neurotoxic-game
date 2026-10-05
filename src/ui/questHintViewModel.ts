import { getRegionKeyForLocation } from '../utils/mapUtils'
import type { PlayerState, QuestState } from '../types'

// Pure quest hint view-model helpers for QuestsModal, kept in a dedicated
// module so they can be unit-tested directly while the component module
// exports only UI components.

/**
 * Represents the extended state of a quest for UI display purposes.
 *
 * @remarks
 * Merges the base quest state with a description that represents a translation key (not localized text directly)
 * and a `moneyReward` that is a legacy persisted reward field (handled by questLegacyMigration.ts), rather than a derived value.
 */
export type QuestDisplayState = QuestState & {
  description?: string
  moneyReward?: number
}

/**
 * Represents the categorized urgency level and corresponding UI text configuration for a quest's deadline.
 */
export type QuestDeadlineView =
  | { level: 'none'; text: null }
  | { level: 'safe'; text: string; count: number }
  | { level: 'soon'; text: string; count: number }
  | { level: 'urgent'; text: string; count: number }
  | { level: 'lastChance'; text: string }
  | { level: 'today'; text: string }
  | { level: 'overdue'; text: string }

/**
 * Calculates the urgency classification of a quest deadline relative to the current day.
 *
 * @param quest - The quest display state to evaluate.
 * @param currentDay - The current in-game day number.
 * @returns A categorized view object representing the deadline urgency.
 */
export const getQuestDeadlineView = (
  quest: QuestDisplayState,
  currentDay: number
): QuestDeadlineView => {
  if (quest.deadline == null) return { level: 'none', text: null }

  const timeRemaining = quest.deadline - currentDay

  if (timeRemaining < 0) {
    return { level: 'overdue', text: 'ui:quests.hint.deadline.overdue' }
  }
  if (timeRemaining === 0) {
    return { level: 'today', text: 'ui:quests.hint.deadline.today' }
  }
  if (timeRemaining === 1) {
    return { level: 'lastChance', text: 'ui:quests.hint.deadline.lastChance' }
  }
  if (timeRemaining === 2) {
    return { level: 'urgent', text: 'ui:quests.hint.deadline.urgent', count: 2 }
  }
  if (timeRemaining <= 5) {
    return {
      level: 'soon',
      text: 'ui:quests.hint.deadline.soon',
      count: timeRemaining
    }
  }
  return {
    level: 'safe',
    text: 'ui:quests.hint.deadline.safe',
    count: timeRemaining
  }
}

/**
 * Extracts the remaining days count from a deadline view if applicable.
 *
 * @param view - The deadline view configuration to parse.
 * @returns An object containing the remaining day count, or undefined if not applicable.
 */
export const deadlineCount = (
  view: QuestDeadlineView
): { count: number } | undefined =>
  'count' in view ? { count: view.count } : undefined

/**
 * Determines if the player's current location or venue matches the quest's required scope policy.
 *
 * @param quest - The quest to evaluate.
 * @param player - The current player state containing location and node data.
 * @returns A hint configuration object if a scope applies, or null if no scope logic is needed.
 */
export const getQuestScopeHint = (
  quest: QuestDisplayState,
  player: PlayerState
): {
  matching: boolean
  text: string
  options?: Record<string, unknown>
} | null => {
  if (!quest.scopeKey) return null

  if (quest.repeatPolicy === 'perRegion') {
    const normalizedLocation = player?.location
      ? getRegionKeyForLocation(player.location)
      : undefined
    const isMatching = normalizedLocation === quest.scopeKey
    return {
      matching: isMatching,
      text: isMatching
        ? 'ui:quests.hint.scope.region.matching'
        : 'ui:quests.hint.scope.region.mismatch',
      options: { scope: quest.scopeKey }
    }
  }

  if (quest.repeatPolicy === 'perVenue') {
    // Determine the current venue (gig node id takes precedence, falling back to location if it's a venue)
    const isMatching =
      player?.currentNodeId === quest.scopeKey ||
      player?.location === quest.scopeKey
    return {
      matching: isMatching,
      text: isMatching
        ? 'ui:quests.hint.scope.venue.only'
        : 'ui:quests.hint.scope.venue.mismatch',
      options: { scope: quest.scopeKey }
    }
  }

  return null
}

/**
 * Resolves the localized translation text for the quest's next required action step.
 *
 * @param quest - The quest display state.
 * @param t - The translation function to localize the hint key.
 * @returns The translated hint string, or a default fallback step.
 */
export const getQuestNextStepHint = (
  quest: QuestDisplayState,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null => {
  if (quest.progressSource) {
    const translatedNextStep = t(
      `ui:quests.hint.nextStep.${quest.progressSource}`,
      { defaultValue: '' }
    )
    if (translatedNextStep) {
      return translatedNextStep
    }
  }
  return t('ui:quests.hint.nextStep.default')
}

/**
 * Evaluates all quest hints and determines the highest-priority status message to display.
 *
 * @param options - The hint options object.
 * @returns An object containing the prioritized text and message severity type, or null.
 */
export const getQuestPrimaryHint = ({
  deadlineView,
  scopeHint,
  nextStepHint,
  t
}: {
  deadlineView: QuestDeadlineView
  scopeHint: ReturnType<typeof getQuestScopeHint>
  nextStepHint: string | null
  t: (key: string, options?: Record<string, unknown>) => string
}): { text: string; type: 'error' | 'warning' | 'info' | 'success' } | null => {
  // 1. Overdue / heute fällig
  if (deadlineView.level === 'overdue' || deadlineView.level === 'today') {
    return {
      text: t(deadlineView.text, deadlineCount(deadlineView)),
      type: 'error'
    }
  }

  // 2. Falscher Scope
  if (scopeHint && !scopeHint.matching) {
    return {
      text: t(scopeHint.text, scopeHint.options),
      type: 'warning'
    }
  }

  // 3. Deadline bald
  if (deadlineView.level === 'urgent' || deadlineView.level === 'lastChance') {
    return {
      text: t(deadlineView.text, deadlineCount(deadlineView)),
      type: 'warning'
    }
  }

  // 4. Normaler nächster Schritt
  if (nextStepHint) {
    return {
      text: nextStepHint,
      type: 'info'
    }
  }

  return null
}
