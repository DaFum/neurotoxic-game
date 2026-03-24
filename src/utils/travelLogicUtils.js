/*
 * (#1) Actual Updates: Extracted pure logic from useTravelLogic into utility functions.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { normalizeVenueId } from './mapUtils'
import { clampPlayerMoney } from './gameStateUtils'

export const getTravelArrivalUpdates = ({
  player,
  band,
  node,
  fuelLiters,
  totalCost
}) => {
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
    nextBand = { harmony: Math.max(1, Math.min(100, Math.floor((band.harmony ?? 0) + 5))) }
  }

  return { nextPlayer, nextBand }
}
