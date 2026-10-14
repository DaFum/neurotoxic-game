import type { Venue, CityTraitState } from '../../types'
import type { MapNodeType } from '../mapNodeTypes'

/**
 * Represents a directional edge between two nodes in the generated map layout.
 */
type MapConnection = { from: string; to: string }

/**
 * Represents a discrete, traversable location within the generated tour map.
 *
 * @remarks
 * Contains spatial coordinates, logical hierarchy (layer), underlying venue data,
 * and current progression status. Nodes dictate potential overworld interactions
 * including gigs, special events, and shop inventories.
 */
export type GeneratedMapNode = {
  id: string
  layer: number
  venue: Venue
  status: 'unlocked' | 'completed' | 'locked'
  type: Extract<
    MapNodeType,
    | 'START'
    | 'GIG'
    | 'SPECIAL'
    | 'REST_STOP'
    | 'FESTIVAL'
    | 'FINALE'
    | 'SUPPLY_STOP'
  >
  x: number
  y: number
  shopInventory?: import('../../types/components').PurchaseItem[]
}

/**
 * Encapsulates the contextual state of the map during generation execution.
 */
export type MapGeneratorState = {
  layers: GeneratedMapNode[][]
  nodes: Record<string, GeneratedMapNode>
  nodeList: GeneratedMapNode[]
  connections: MapConnection[]
  cityStates: Record<string, CityTraitState>
}

/**
 * Segregated collections of venue templates grouped by relative difficulty.
 */
export type VenuePools = {
  easyVenues: Venue[]
  mediumVenues: Venue[]
  hardVenues: Venue[]
}
