import { useEffect } from 'react'

import { finiteNumberOr } from '../../utils/finiteNumber'

import type { RivalBandState } from '../../types'

const ENCOUNTER_POWER_GAIN = 5

/**
 * Increases rival power once when the rival occupies the player's current node.
 *
 * @param rivalBand - Current rival band state.
 * @param playerNodeId - Player's current map node id.
 * @param updateRivalBand - Action callback used to patch rival state.
 *
 * @remarks
 * The "already escalated here" marker is `rivalBand.lastEscalatedNodeId`, set in
 * the same dispatch as the power gain. A component ref would reset whenever
 * Overworld remounts (Clinic, Assets, a reload) and the rival would gain power
 * again for the same encounter. The marker is cleared once the rival and the
 * player are no longer on the same node, so the next meeting escalates again.
 */
export const useRivalEscalation = (
  rivalBand: RivalBandState | null | undefined,
  playerNodeId: string | null | undefined,
  updateRivalBand: ((patch: Partial<RivalBandState>) => void) | undefined
) => {
  useEffect(() => {
    if (!rivalBand || !playerNodeId || !updateRivalBand) return

    const marker = rivalBand.lastEscalatedNodeId ?? null
    if (rivalBand.currentLocationId !== playerNodeId) {
      if (marker !== null) updateRivalBand({ lastEscalatedNodeId: null })
      return
    }
    if (marker === playerNodeId) return

    const nextPower = Math.max(
      0,
      finiteNumberOr(rivalBand.powerLevel, 0) + ENCOUNTER_POWER_GAIN
    )
    updateRivalBand({
      powerLevel: nextPower,
      lastEscalatedNodeId: playerNodeId
    })
  }, [rivalBand, playerNodeId, updateRivalBand])
}
