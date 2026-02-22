import {
  calculateRefuelCost,
  calculateTravelExpenses
} from './economyEngine.js'

/**
 * Checks if a target node is connected to the source node.
 * @param {object} gameMap - The game map object.
 * @param {string} fromNodeId - The source node ID.
 * @param {string} targetNodeId - The target node ID.
 * @returns {boolean} True if connected.
 */
export const isConnected = (gameMap, fromNodeId, targetNodeId) => {
  if (!gameMap) return false
  const connections = gameMap.connections.filter(c => c.from === fromNodeId)
  return connections.some(c => c.to === targetNodeId)
}

/**
 * Determines the visibility state of a node based on its layer.
 * @param {number} nodeLayer - Target node layer.
 * @param {number} currentLayer - Current player layer.
 * @returns {string} 'visible', 'dimmed', or 'hidden'.
 */
export const getNodeVisibility = (nodeLayer, currentLayer) => {
  if (nodeLayer <= currentLayer + 1) return 'visible'
  if (nodeLayer === currentLayer + 2) return 'dimmed'
  return 'hidden'
}

/**
 * Checks if the player is softlocked (stranded) due to lack of fuel and money.
 * @param {object} gameMap - The game map object.
 * @param {object} player - The player state object.
 * @returns {boolean} True if stranded.
 */
export const checkSoftlock = (gameMap, player) => {
  if (!gameMap || !player.currentNodeId) return false

  const currentFuel = player.van?.fuel ?? 0
  const currentNode = gameMap.nodes[player.currentNodeId]
  const neighbors = gameMap.connections
    .filter(c => c.from === player.currentNodeId)
    .map(c => gameMap.nodes[c.to])

  const canReachAny = neighbors.some(n => {
    if (!n) return false
    const { fuelLiters } = calculateTravelExpenses(n, currentNode, {
      van: player.van
    })
    return currentFuel >= fuelLiters
  })

  // If cannot reach any neighbor, check if can afford refuel
  // EXCEPTION: If current node is a GIG, player can earn money, so not stranded.
  if (!canReachAny && currentNode?.type !== 'GIG') {
    const refuelCost = calculateRefuelCost(currentFuel)
    const playerMoney = Math.max(0, player.money ?? 0)
    return playerMoney < refuelCost
  }
  return false
}
