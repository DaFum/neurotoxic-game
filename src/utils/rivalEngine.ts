import type { GameMap, RivalBandState } from '../types'

import { BRAND_ALIGNMENTS } from '../context/initialState'
import { generateBrandName } from './socialEngine'
import { secureRandom } from './crypto'
import { RIVAL_STAY_CHANCE } from '../context/gameConstants'
import { isEmptyObject } from './gameState'
import { selectRandomItem } from './selectionUtils'

import type { BrandAlignment } from '../types'

/**
 * Creates a rival band scaled to the current campaign day.
 *
 * @param day - Current player day used to derive rival power.
 * @param rng - Random number generator used for alignment, id suffix, and name flavor.
 * @returns New rival band state with no starting location.
 */
export const generateRivalBand = (
  day: number,
  rng: () => number = secureRandom
): RivalBandState => {
  const alignments = Object.values(BRAND_ALIGNMENTS) as BrandAlignment[]
  const alignment =
    selectRandomItem(alignments, rng) ??
    (BRAND_ALIGNMENTS.NEUTRAL as BrandAlignment)

  const powerLevel = Math.max(1, Math.floor(day / 5) + 1)

  return {
    id: 'rival_' + Math.floor(rng() * 1000000000),
    name: generateBrandName('Rivals', alignment, rng),
    alignment,
    powerLevel,
    currentLocationId: null
  }
}

/**
 * Moves a rival band to an adjacent or fallback gig node.
 *
 * @param rivalBand - Current rival state.
 * @param gameMap - Map used to find connected gig nodes.
 * @param rng - Random number generator used for stay chance and destination selection.
 * @returns Updated rival state, or the original state when no move is possible.
 */
export const moveRivalBand = (
  rivalBand: RivalBandState,
  gameMap: GameMap | null,
  rng: () => number = secureRandom
): RivalBandState => {
  if (!gameMap || !gameMap.nodes || isEmptyObject(gameMap.nodes)) {
    return rivalBand
  }

  // 30% chance to stay in the same location if they already have one
  if (rivalBand.currentLocationId && rng() < RIVAL_STAY_CHANCE) {
    return rivalBand
  }

  const possibleNodes: GameMap['nodes'][string][] = []

  if (rivalBand.currentLocationId && gameMap.connections) {
    // ⚡ BOLT OPTIMIZATION: Replaced chained .filter().map() with a single-pass loop.
    // Why: Eliminates two O(N) intermediate array allocations during pathfinding.
    // Impact: Reduces garbage collection pressure in simulation loops.
    const currentLocationId = rivalBand.currentLocationId
    const connectedNodeIds = new Set<string>()
    for (const c of gameMap.connections) {
      const targetId =
        c.from === currentLocationId
          ? c.to
          : c.to === currentLocationId
            ? c.from
            : undefined

      if (targetId && !connectedNodeIds.has(targetId)) {
        connectedNodeIds.add(targetId)
        const node = gameMap.nodes[targetId]
        if (node && node.type === 'GIG') {
          possibleNodes.push(node)
        }
      }
    }
  }

  if (possibleNodes.length === 0) {
    for (const key in gameMap.nodes) {
      if (Object.hasOwn(gameMap.nodes, key)) {
        const node = gameMap.nodes[key]
        if (node && node.type === 'GIG') {
          possibleNodes.push(node)
        }
      }
    }
  }

  if (possibleNodes.length > 0) {
    const nextNode = selectRandomItem(possibleNodes, rng)
    return {
      ...rivalBand,
      currentLocationId: nextNode ? nextNode.id : null
    }
  }

  return rivalBand
}
