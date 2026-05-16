export type TourbusObstacleType = 'FUEL' | 'OBSTACLE' | 'VOID_HAZARD'

export interface TourbusObstacle {
  id: string | number
  lane: number
  y: number
  type: TourbusObstacleType
  collided?: boolean
}
