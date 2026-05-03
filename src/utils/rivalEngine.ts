import type { GameMap, RivalBandState } from '../types/game'

import { BRAND_ALIGNMENTS } from '../context/initialState'
import { generateBrandName } from './socialEngine'
import { secureRandom } from './crypto'
import { RIVAL_STAY_CHANCE } from '../context/gameConstants'

import type { BrandAlignment } from '../types/game'

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
  if (!gameMap || !gameMap.nodes || Object.keys(gameMap.nodes).length === 0) {
    return rivalBand
  }

  // 30% chance to stay in the same location if they already have one
  if (rivalBand.currentLocationId && rng() < RIVAL_STAY_CHANCE) {
    return rivalBand
  }

  // Find gig nodes
  const allGigNodes = Object.values(gameMap.nodes).filter(n => n.type === 'GIG')
  let possibleNodes: typeof allGigNodes = []

  if (rivalBand.currentLocationId && gameMap.connections) {
    const connectedNodeIds = new Set(
      gameMap.connections
        .filter(
          c =>
            c.from === rivalBand.currentLocationId ||
            c.to === rivalBand.currentLocationId
        )
        .map(c => (c.from === rivalBand.currentLocationId ? c.to : c.from))
    )

    possibleNodes = allGigNodes.filter(n => connectedNodeIds.has(n.id))
  }

  if (possibleNodes.length === 0) {
    possibleNodes = allGigNodes
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
