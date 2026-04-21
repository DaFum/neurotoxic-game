/**
 * Checks if a specific quest is active using a fast for loop.
 * This avoids array allocation overhead from Array.some() in hot paths.
 *
 * @param {Array} activeQuests - The array of active quests.
 * @param {string} questId - The ID of the quest to find.
 * @returns {boolean} True if the quest is active.
 */
export const hasActiveQuest = (
  activeQuests: Array<{ id: string } | undefined> | undefined,
  questId: string
): boolean => {
  if (!activeQuests || activeQuests.length === 0) return false
  for (let i = 0; i < activeQuests.length; i++) {
    if (activeQuests[i]?.id === questId) return true
  }
  return false
}
