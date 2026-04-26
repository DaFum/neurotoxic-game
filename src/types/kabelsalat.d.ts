import type {
  SOCKET_DEFS,
  CableId as ConstCableId
} from '../scenes/kabelsalat/constants'

export type SocketId = keyof typeof SOCKET_DEFS
export type CableId = ConstCableId

export interface LightningSeed {
  id: string | number
  startX: number
  o1: number
  o2: number
  o3: number
  w: number
}
