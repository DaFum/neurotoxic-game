import { useEffect, useRef } from 'react'

import type { RivalBandState } from '../../types'

const ENCOUNTER_POWER_GAIN = 5

export const useRivalEscalation = (
  rivalBand: RivalBandState | null | undefined,
  playerNodeId: string | null | undefined,
  updateRivalBand: ((patch: Partial<RivalBandState>) => void) | undefined
) => {
  const lastEscalatedNodeRef = useRef<string | null>(null)

  useEffect(() => {
    if (!rivalBand || !playerNodeId || !updateRivalBand) return
    if (rivalBand.currentLocationId !== playerNodeId) return
    if (lastEscalatedNodeRef.current === playerNodeId) return

    lastEscalatedNodeRef.current = playerNodeId
    const nextPower = Math.max(0, rivalBand.powerLevel + ENCOUNTER_POWER_GAIN)
    updateRivalBand({ powerLevel: nextPower })
  }, [rivalBand, playerNodeId, updateRivalBand])
}
