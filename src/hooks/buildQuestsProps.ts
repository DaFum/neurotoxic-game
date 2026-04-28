import type { PlayerState, QuestState } from '../types/game'

/**
 * Builds the props object for the Quests modal.
 */
export const buildQuestsProps = (
  onClose: () => void,
  activeQuests: QuestState[] | null | undefined,
  player: PlayerState
): {
  onClose: () => void
  activeQuests: QuestState[]
  player: PlayerState
} => ({
  onClose,
  activeQuests: activeQuests ?? [],
  player
})
