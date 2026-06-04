import type { PurchaseItem } from './components'

/**
 * Visibility state for overworld map nodes.
 */
export type NodeVisibility = 'visible' | 'dimmed' | 'hidden'

/**
 * One node on the generated overworld map.
 */
export interface MapNode {
  id: string
  x: number
  y: number
  layer: number
  type: MapNodeType
  venue?: Venue
  venueId?: string
  neighbors?: string[]
  shopInventory?: PurchaseItem[]

  [key: string]: unknown
}

/**
 * Generated overworld map with nodes, edges, and city traits.
 */
export interface GameMap {
  nodes: Record<string, MapNode>
  edges?: Array<{ from: string; to: string }>
  connections: Array<{ from: string; to: string }>
  cityStates?: Record<string, CityTraitState>
  [key: string]: unknown
}

/**
 * Loose venue metadata shared by generated map nodes, gig state, and economy calculations.
 */
export interface Venue {
  id: string
  name: string
  city?: string
  region?: string
  capacity?: number
  pay?: number
  price?: number
  difficulty?: number
  diff?: number
  reputation?: number
  sourceScene?: GamePhase
  songId?: string
  [key: string]: unknown
}
