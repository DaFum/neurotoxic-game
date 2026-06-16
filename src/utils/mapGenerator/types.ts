import type { MapNodeType, Venue, CityTraitState } from '../../types'

export type MapConnection = { from: string; to: string }

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

export type MapGeneratorState = {
  layers: GeneratedMapNode[][]
  nodes: Record<string, GeneratedMapNode>
  nodeList: GeneratedMapNode[]
  connections: MapConnection[]
  cityStates: Record<string, CityTraitState>
}

export type VenuePools = {
  easyVenues: Venue[]
  mediumVenues: Venue[]
  hardVenues: Venue[]
}
