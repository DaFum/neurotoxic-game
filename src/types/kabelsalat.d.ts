import type { SOCKET_DEFS, CABLES } from '../scenes/kabelsalat/kabelsalatConstants'

export type SocketId = keyof typeof SOCKET_DEFS

export type ConnectorType = (typeof CABLES)[number]['type']

export interface LightningSeed {
  id: string | number
  startX: number
  o1: number
  o2: number
  o3: number
  w: number
}
