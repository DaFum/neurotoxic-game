/**
 * Tourbus minigame obstacle and pickup categories.
 */
export type TourbusObstacleType = 'FUEL' | 'OBSTACLE' | 'VOID_HAZARD'

/**
 * Runtime obstacle or pickup instance in the tourbus minigame.
 */
export interface TourbusObstacle {
  id: string | number
  lane: number
  y: number
  type: TourbusObstacleType
  collided?: boolean
}
