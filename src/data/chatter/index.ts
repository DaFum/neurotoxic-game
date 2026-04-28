import { CHATTER_DB, ALLOWED_DEFAULT_SCENES } from './standardChatter'
import { VENUE_CHATTER_LOOKUP } from './venueChatter'
import { getSafeRandom } from '../../utils/crypto'
import type { GameState } from '../../types/game'

export { CHATTER_DB, ALLOWED_DEFAULT_SCENES }

type ChatterScene = 'ANY' | 'OVERWORLD' | 'PREGIG' | 'GIG' | 'POSTGIG'
type VenueLinesByScene = Partial<Record<ChatterScene, string[]>>
type VenueChatterEntry = {
  linesByScene?: VenueLinesByScene
  lines?: string[]
}
type ChatterPoolItem = {
  text: string
  weight?: number
  condition?: ((state: GameState, memo: Record<string, number>) => boolean) | null
  speaker?: string | null
  type?: string
}

const hasVenueId = (value: unknown): value is { id: string } =>
  typeof value === 'object' &&
  value !== null &&
  Object.hasOwn(value, 'id') &&
  typeof (value as { id?: unknown }).id === 'string'

export const getRandomChatter = (state: GameState) => {
  const pool: ChatterPoolItem[] = []

  // 1) Venue Specific Chatter (Scene-aware)
  const currentNode = state.gameMap?.nodes[state.player.currentNodeId]
  const venueId =
    currentNode && Object.hasOwn(currentNode, 'venue') && hasVenueId(currentNode.venue)
      ? currentNode.venue.id
      : undefined

  if (venueId) {
    const venueEntry = VENUE_CHATTER_LOOKUP[venueId] as
      | VenueChatterEntry
      | undefined

    if (venueEntry?.linesByScene) {
      const sceneLines = Object.hasOwn(venueEntry.linesByScene, state.currentScene)
        ? venueEntry.linesByScene[state.currentScene as ChatterScene]
        : undefined
      const venueLines = sceneLines ?? venueEntry.linesByScene.ANY ?? []

      // Give venue lines higher priority, but not always dominating
      for (let i = 0; i < venueLines.length; i++) {
        pool.push({
          text: venueLines[i] ?? '',
          weight: 8,
          condition: null,
          speaker: null
        })
      }
    } else if (venueEntry?.lines) {
      // Backwards compatibility: old "lines" array
      for (let i = 0; i < venueEntry.lines.length; i++) {
        pool.push({
          text: venueEntry.lines[i] ?? '',
          weight: 8,
          condition: null,
          speaker: null
        })
      }
    }
  }

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

  // 2) Standard chatter
  for (let i = 0; i < CHATTER_DB.length; i++) {
    const c = CHATTER_DB[i]
    if (!c) continue
    if (
      (c.condition && c.condition(state, memo)) ||
      (!c.condition &&
        (ALLOWED_DEFAULT_SCENES as readonly GameState['currentScene'][]).includes(
          state.currentScene
        ))
    ) {
      pool.push(c)
    }
  }

  if (pool.length === 0) return null

  // Weighted Random Selection
  let totalWeight = 0
  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i]
    if (!entry) continue
    totalWeight += entry.weight || 1
  }

  let roll = getSafeRandom() * totalWeight

  let item = pool[pool.length - 1]
  if (!item) return null

  for (const entry of pool) {
    roll -= entry.weight || 1
    if (roll <= 0) {
      item = entry
      break
    }
  }

  return {
    text: item.text,
    speaker: item.speaker || null,
    type: item.type || 'normal'
  }
}
