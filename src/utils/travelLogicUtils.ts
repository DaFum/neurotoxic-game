/*
 * (#1) Actual Updates: Extracted pure logic from useTravelLogic into utility functions.


 */
import { normalizeVenueId } from './mapUtils'
import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils'
import type { BandState, MapNode, PlayerState } from '../types/game'

interface TravelArrivalUpdateInput {
  player: PlayerState
  band: BandState
  node: MapNode & { venue?: unknown }
  fuelLiters: number
  totalCost: number
}

interface TravelArrivalUpdates {
  nextPlayer: Partial<PlayerState>
  nextBand: Partial<BandState> | null
}

export const getTravelArrivalUpdates = ({
  player,
  band,
  node,
  fuelLiters,
  totalCost
}: TravelArrivalUpdateInput): TravelArrivalUpdates => {
  const nextPlayer = {
    money: clampPlayerMoney((player.money ?? 0) - totalCost),
    van: {
      ...player.van,
      fuel: Math.max(0, (player.van?.fuel ?? 0) - fuelLiters)
    },
    location: normalizeVenueId(node.venue)?.split('_')?.[0] || 'Unknown',
    currentNodeId: node.id,
    totalTravels: (player.totalTravels ?? 0) + 1
  }

  let nextBand = null
  if (band?.harmonyRegenTravel) {
    nextBand = { harmony: clampBandHarmony((band.harmony ?? 0) + 5) }
  }

  return { nextPlayer, nextBand }
}
