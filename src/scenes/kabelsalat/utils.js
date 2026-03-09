import { CABLE_MAP, SLOT_XS } from './constants.js'

export const generateLightningSeeds = () => {
  return Array.from({ length: 15 }).map(() => ({
    id: Math.random().toString(36).slice(2, 11),
    startX: Math.random() * 800,
    o1: Math.random() * 300 - 150,
    o2: Math.random() * 300 - 150,
    o3: Math.random() * 300 - 150,
    w: Math.random() * 10 + 2
  }))
}

export const getMessyPath = (cableId, socketId, socketOrder) => {
  const cable = CABLE_MAP[cableId]
  const socketIndex = socketOrder.indexOf(socketId)
  if (!cable || socketIndex === -1) return ''

  const socketX = SLOT_XS[socketIndex]
  const socketY = 120

  const midY = (cable.y + socketY) / 2
  const offset = (socketX - cable.x) * 1.5

  return `M ${cable.x} ${cable.y} C ${cable.x - offset} ${midY}, ${socketX + offset} ${midY}, ${socketX} ${socketY + 20}`
}
