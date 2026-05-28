import type { GameMap, RivalBandState } from '../types'

import { BRAND_ALIGNMENTS } from '../context/initialState'
import { generateBrandName } from './socialEngine'
import { secureRandom } from './crypto'
import { RIVAL_STAY_CHANCE } from '../context/gameConstants'
import { isEmptyObject } from './gameStateUtils'

import type { BrandAlignment } from '../types'

export const generateRivalBand = (
  day: number,
  rng: () => number = secureRandom
): RivalBandState => {
  const alignments = Object.values(BRAND_ALIGNMENTS) as BrandAlignment[]
  const alignment =
    alignments[Math.floor(rng() * alignments.length)] ||
    (BRAND_ALIGNMENTS.NEUTRAL as BrandAlignment)

  const powerLevel = Math.max(1, Math.floor(day / 5) + 1)

  return {
    id: `rival_${Date.now()}_${Math.floor(rng() * 1000)}`,
    name: generateBrandName('Rivals', alignment, rng),
    alignment,
    powerLevel,
    currentLocationId: null
  }
}

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

  let possibleNodes: GameMap['nodes'][string][] = []

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
    const nextNode = possibleNodes[Math.floor(rng() * possibleNodes.length)]
    return {
      ...rivalBand,
      currentLocationId: nextNode ? nextNode.id : null
    }
  }

  return rivalBand
}
