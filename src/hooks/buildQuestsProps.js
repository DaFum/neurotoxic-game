/**
 * Builds the props object for the Quests modal.
 * @param {Function} onClose - The function to close the modal.
 * @param {Array} activeQuests - The array of active quests from game state.
 * @param {Object} player - The player object from game state.
 * @returns {Object} Props required by the Quests modal component.
 */
export const buildQuestsProps = (onClose, activeQuests, player) => ({
  onClose,
  activeQuests: activeQuests || [],
  player
})
