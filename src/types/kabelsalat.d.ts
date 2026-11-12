import type {
  SOCKET_DEFS,
  CABLES
} from '../utils/minigames/kabelsalatConstants'

/**
 * Socket identifier derived from the Kabelsalat socket definitions.
 */
export type SocketId = keyof typeof SOCKET_DEFS

/**
 * Cable connector type derived from Kabelsalat cable definitions.
 */
export type ConnectorType = (typeof CABLES)[number]['type']

/**
 * Deterministic seed values for Kabelsalat lightning rendering.
 */
export interface LightningSeed {
  id: string | number
  startX: number
  o1: number
  o2: number
  o3: number
  w: number
}

/**
 * Explicit phase state machine for Kabelsalat minigame lifecycle.
 */
export type KabelsalatPhase =
  | { name: 'playing' }
  | { name: 'shocked'; reason: string }
  | { name: 'winning' }
  | { name: 'powered' }
  | { name: 'gameover' }
  | { name: 'transitioned' }
