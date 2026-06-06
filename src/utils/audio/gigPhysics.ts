import { logger } from '../logger'
import { SONGS_DB, SONGS_BY_ID } from '../../data/songs'
import { calculateGigPhysics, getGigModifiers } from '../simulationUtils'
import type { Song } from '../../types/audio'
import type { BandState, GameMap, GigModifiers } from '../../types'
import type { RhythmModifiers } from '../../types/rhythmGame'

export const setupGigPhysics = (
  band: BandState,
  gigModifiers: Partial<GigModifiers>,
  currentGigId: string | undefined,
  gameMap: GameMap,
  playerNodeId: string,
  setlistFirstId: string | undefined
): {
  mergedModifiers: RhythmModifiers
  speed: number
  hitWindows: number[]
} | null => {
  // Narrow the modifiers returned from simulation layer to the RhythmModifiers shape
  const maybeActiveModifiers = getGigModifiers(band, gigModifiers)
  const isRhythmModifiers = (v: unknown): v is RhythmModifiers => {
    if (typeof v !== 'object' || v === null) return false
    const obj = v as Record<string, unknown>
    // Basic sanity checks for commonly used numeric fields
    if (
      (obj['drumMultiplier'] !== undefined &&
        typeof obj['drumMultiplier'] !== 'number') ||
      (obj['guitarScoreMult'] !== undefined &&
        typeof obj['guitarScoreMult'] !== 'number')
    ) {
      return false
    }
    return true
  }

  const activeModifiers: RhythmModifiers = isRhythmModifiers(
    maybeActiveModifiers
  )
    ? maybeActiveModifiers
    : {}

  const songId = currentGigId || setlistFirstId || 'neurotoxic_1'
  const DEFAULT_SONG: Song = {
    id: 'default',
    leaderboardId: 'default',
    title: 'Default Song',
    name: 'Default Song',
    bpm: 120,
    difficulty: 2,
    duration: 60,
    durationMs: null,
    excerptStartMs: 0,
    excerptEndMs: null,
    excerptDurationMs: null,
    intensity: 'MEDIUM',
    notes: []
  }
  const activeSong = SONGS_BY_ID.get(songId) || SONGS_DB[0] || DEFAULT_SONG
  const physics = calculateGigPhysics(band, activeSong)

  const currentNode = gameMap.nodes[playerNodeId]
  if (!currentNode) {
    logger.error('RhythmGame', `No map node found for ${playerNodeId}`)
    return null
  }

  const layer = currentNode.layer || 0
  const speedMult = 1.0 + layer * 0.05

  const mergedModifiers: RhythmModifiers = {
    ...activeModifiers,
    drumMultiplier: physics.multipliers.drums,
    guitarScoreMult:
      physics.multipliers.guitar *
      (typeof activeModifiers.guitarScoreMult === 'number'
        ? activeModifiers.guitarScoreMult
        : 1.0),
    bassScoreMult:
      physics.multipliers.bass *
      (typeof activeModifiers.bassScoreMult === 'number'
        ? activeModifiers.bassScoreMult
        : 1.0),
    hasPerfektionist: physics.hasPerfektionist
  }

  let speed = 500 * speedMult * physics.speedModifier
  const drumSpeedMult = mergedModifiers.drumSpeedMult ?? 1
  if (drumSpeedMult > 1.0) speed *= drumSpeedMult
  if (mergedModifiers.catering) speed = 500 * speedMult

  let hitWindowBonus = mergedModifiers.hitWindowBonus ?? 0
  if (mergedModifiers.soundcheck) hitWindowBonus += 30

  return {
    mergedModifiers,
    speed,
    hitWindows: [
      physics.hitWindows.guitar + hitWindowBonus,
      physics.hitWindows.drums + hitWindowBonus,
      physics.hitWindows.bass + hitWindowBonus
    ]
  }
}