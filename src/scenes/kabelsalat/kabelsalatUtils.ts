import {
  CABLE_MAP,
  SLOT_XS,
  SOCKET_Y,
  type CableId
} from './kabelsalatConstants'
import { getSafeUUID, secureRandom } from '../../utils/crypto'
import type { LightningSeed, SocketId } from '../../types/kabelsalat'

const PATH_OFFSET_MULTIPLIER = 1.5
const PLUG_DEPTH = 20

export const generateLightningSeeds = (): LightningSeed[] => {
  return Array.from({ length: 15 }).map(() => ({
    id: getSafeUUID(),
    startX: secureRandom() * 800,
    o1: secureRandom() * 300 - 150,
    o2: secureRandom() * 300 - 150,
    o3: secureRandom() * 300 - 150,
    w: secureRandom() * 10 + 2
  }))
}

export const getMessyPath = (
  cableId: CableId,
  socketId: SocketId,
  socketOrder: readonly SocketId[]
): string => {
  const cable = CABLE_MAP[cableId]
  const socketIndex = socketOrder.indexOf(socketId)
  if (!cable || socketIndex === -1) return ''

  const socketX = SLOT_XS[socketIndex]
  if (socketX === undefined) return ''

  const midY = (cable.y + SOCKET_Y) / 2
  const offset = (socketX - cable.x) * PATH_OFFSET_MULTIPLIER

  return `M ${cable.x} ${cable.y} C ${cable.x - offset} ${midY}, ${socketX + offset} ${midY}, ${socketX} ${SOCKET_Y + PLUG_DEPTH}`
}
