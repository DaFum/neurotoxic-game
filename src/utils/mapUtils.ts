import { calculateRefuelCost, calculateTravelExpenses } from './economyEngine'

/**
 * Checks if a target node is connected to the source node.
 * @param {object} gameMap - The game map object.
 * @param {string} fromNodeId - The source node ID.
 * @param {string} targetNodeId - The target node ID.
 * @returns {boolean} True if connected.
 */
export const isConnected = (
  gameMap: any,
  fromNodeId: string,
  targetNodeId: string
): boolean => {
  if (!gameMap) return false
  if (!gameMap.connections) {
    throw new TypeError('gameMap.connections is missing')
  }
  for (let i = 0; i < gameMap.connections.length; i++) {
    const c = gameMap.connections[i]
    if (c.from === fromNodeId && c.to === targetNodeId) {
      return true
    }
  }
  return false
}

/**
 * Determines the visibility state of a node based on its layer.
 * @param {number} nodeLayer - Target node layer.
 * @param {number} currentLayer - Current player layer.
 * @returns {string} 'visible', 'dimmed', or 'hidden'.
 */
export const getNodeVisibility = (
  nodeLayer: number,
  currentLayer: number
): 'visible' | 'dimmed' | 'hidden' => {
  if (nodeLayer <= currentLayer + 1) return 'visible'
  if (nodeLayer === currentLayer + 2) return 'dimmed'
  return 'hidden'
}

/**
 * Normalizes a venue object or string into a raw ID string, stripping legacy namespacing.
 * @param {object|string} venue - The venue object or string to normalize.
 * @returns {string|null} The normalized string ID, or null.
 */
export const normalizeVenueId = (venue: any): string | null => {
  if (!venue) return null
  let id = typeof venue === 'object' ? venue.id || venue.name : venue

  if (typeof id === 'string') {
    const isVenues = id.startsWith('venues:')
    const hasName = id.endsWith('.name')
    if (isVenues && hasName) {
      id = id.slice(7, -5)
    } else if (isVenues) {
      id = id.slice(7)
    } else if (hasName) {
      if (!id.includes(':')) {
        id = id.slice(0, -5)
      }
    }
  }

  return typeof id === 'string' ? id : null
}

/**
 * Checks if the player is softlocked (stranded) due to lack of fuel and money.
 * @param {object} gameMap - The game map object.
 * @param {object} player - The player state object.
 * @param {object} [band=null] - The band state object.
 * @returns {boolean} True if stranded.
 */
export const checkSoftlock = (
  gameMap: any,
  player: any,
  band: any = null
): boolean => {
  if (!gameMap || !player.currentNodeId) return false

  const currentFuel = player.van?.fuel ?? 0
  const currentNode = gameMap.nodes[player.currentNodeId]

  if (!gameMap.connections) {
    throw new TypeError('gameMap.connections is missing')
  }

  let canReachAny = false
  for (let i = 0; i < gameMap.connections.length; i++) {
    const c = gameMap.connections[i]
    if (c.from === player.currentNodeId) {
      const n = gameMap.nodes[c.to]
      if (n) {
        const { fuelLiters } = calculateTravelExpenses(
          n,
          currentNode,
          {
            van: player.van
          },
          band
        )
        if (currentFuel >= fuelLiters) {
          canReachAny = true
          break
        }
      }
    }
  }

  // If cannot reach any neighbor, check if can afford refuel
  // EXCEPTION: If current node is a GIG, player can earn money, so not stranded.
  if (!canReachAny && currentNode?.type !== 'GIG') {
    const refuelCost = calculateRefuelCost(currentFuel)
    const playerMoney = Math.max(0, player.money ?? 0)
    return playerMoney < refuelCost
  }
  return false
}
