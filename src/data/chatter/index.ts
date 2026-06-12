import { CHATTER_DB, ALLOWED_DEFAULT_SCENES } from './standardChatter'
import { VENUE_CHATTER_LOOKUP } from './venueChatter'
import { getSafeRandom } from '../../utils/crypto'
import type { GameState } from '../../types'

export { CHATTER_DB, ALLOWED_DEFAULT_SCENES }

const ALLOWED_DEFAULT_SCENES_SET = new Set<string>(ALLOWED_DEFAULT_SCENES)

type ChatterScene =
  | 'ANY'
  | 'MENU'
  | 'OVERWORLD'
  | 'PREGIG'
  | 'PRE_GIG_MINIGAME'
  | 'TRAVEL_MINIGAME'
  | 'GIG'
  | 'POSTGIG'
type VenueLinesByScene = Partial<Record<ChatterScene, string[]>>
type VenueChatterEntry = {
  linesByScene?: VenueLinesByScene
  lines?: string[]
}
type ChatterPoolItem = {
  text: string
  weight?: number
  condition?:
    | ((state: ChatterState, memo: Record<string, number>) => boolean)
    | null
  speaker?: string | null
  type?: string
}

const hasVenueId = (value: unknown): value is { id: string } =>
  typeof value === 'object' &&
  value !== null &&
  Object.hasOwn(value, 'id') &&
  typeof (value as { id?: unknown }).id === 'string'

const getValidatedVenueChatterLine = (
  line: unknown,
  venueId: string,
  index: number,
  source: 'linesByScene' | 'lines'
): string => {
  if (typeof line === 'string' && line.trim().length > 0) {
    return line
  }
  throw new Error(
    `Invalid venue chatter entry for venue "${venueId}" at ${source}[${index}]`
  )
}

type ChatterState = Pick<
  GameState,
  | 'gameMap'
  | 'player'
  | 'currentScene'
  | 'band'
  | 'social'
  | 'gigModifiers'
  | 'lastGigStats'
>

const getVenueChatter = (state: ChatterState): ChatterPoolItem[] => {
  const pool: ChatterPoolItem[] = []

  // 1) Venue Specific Chatter (Scene-aware)
  const currentNode = state.gameMap?.nodes[state.player.currentNodeId]
  // Accept both node shapes like the city-intel path does: full `venue`
  // objects (map generator) and `venueId`-only nodes (slimmed/persisted maps).
  const venueId =
    currentNode &&
    Object.hasOwn(currentNode, 'venue') &&
    hasVenueId(currentNode.venue)
      ? currentNode.venue.id
      : typeof currentNode?.venueId === 'string'
        ? currentNode.venueId
        : undefined

  if (venueId) {
    const venueEntry = VENUE_CHATTER_LOOKUP[venueId] as
      | VenueChatterEntry
      | undefined

    if (venueEntry?.linesByScene) {
      const scene = state.currentScene as ChatterScene
      const venueLines =
        venueEntry.linesByScene[scene] ?? venueEntry.linesByScene.ANY ?? []

      // Give venue lines higher priority, but not always dominating
      for (let i = 0; i < venueLines.length; i++) {
        const text = getValidatedVenueChatterLine(
          venueLines[i],
          venueId,
          i,
          'linesByScene'
        )
        pool.push({
          text,
          weight: 8,
          condition: null,
          speaker: null
        })
      }
    } else if (venueEntry?.lines) {
      // Backwards compatibility: old "lines" array
      for (let i = 0; i < venueEntry.lines.length; i++) {
        const text = getValidatedVenueChatterLine(
          venueEntry.lines[i],
          venueId,
          i,
          'lines'
        )
        pool.push({
          text,
          weight: 8,
          condition: null,
          speaker: null
        })
      }
    }
  }

  return pool
}

const getStandardChatter = (state: ChatterState): ChatterPoolItem[] => {
  const pool: ChatterPoolItem[] = []

  // Pre-calculate band member stats for standard chatter condition checks
  const bandMembers = state.band?.members ?? []
  let minMood = Infinity
  let maxMood = -Infinity
  let minStamina = Infinity
  let maxStamina = -Infinity

  for (let i = 0; i < bandMembers.length; i++) {
    const m = bandMembers[i]
    if (!m) continue
    if (m.mood < minMood) minMood = m.mood
    if (m.mood > maxMood) maxMood = m.mood
    if (m.stamina < minStamina) minStamina = m.stamina
    if (m.stamina > maxStamina) maxStamina = m.stamina
  }

  const memo = { minMood, maxMood, minStamina, maxStamina }
  const isDefaultSceneAllowed = ALLOWED_DEFAULT_SCENES_SET.has(
    state.currentScene
  )

  // 2) Standard chatter
  for (let i = 0; i < CHATTER_DB.length; i++) {
    const c = CHATTER_DB[i] as ChatterPoolItem | undefined
    if (!c) continue
    if (
      (c.condition && c.condition(state, memo)) ||
      (!c.condition && isDefaultSceneAllowed)
    ) {
      pool.push(c)
    }
  }

  return pool
}

const selectRandomChatter = (
  pool: ChatterPoolItem[]
): { text: string; speaker: string | null; type: string } | null => {
  if (pool.length === 0) return null

  // Weighted Random Selection
  let totalWeight = 0
  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i]
    if (!entry) continue
    totalWeight += entry.weight ?? 1
  }

  let roll = getSafeRandom() * totalWeight

  let item = pool[pool.length - 1]
  if (!item) return null

  for (const entry of pool) {
    roll -= entry.weight ?? 1
    if (roll <= 0) {
      item = entry
      break
    }
  }

  return {
    text: item.text,
    speaker: item.speaker ?? null,
    type: item.type ?? 'normal'
  }
}

/**
 * Selects random chatter from the current venue and standard chatter pools.
 *
 * @param state - Chatter selection state.
 * @returns Random chatter payload, or null when no chatter is available.
 */
export const getRandomChatter = (
  state: ChatterState
): { text: string; speaker: string | null; type: string } | null => {
  const pool = [...getVenueChatter(state), ...getStandardChatter(state)]
  return selectRandomChatter(pool)
}
