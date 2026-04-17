// TODO: Review this file
import { memo } from 'react'

type NodeVisibility = 'visible' | 'dimmed' | 'hidden'

interface MapConnectionEndpoint {
  x: number
  y: number
}

interface MapConnectionProps {
  start: MapConnectionEndpoint
  end: MapConnectionEndpoint
  startVis: NodeVisibility
  endVis: NodeVisibility
}

export const MapConnection = memo(
  ({ start, end, startVis, endVis }: MapConnectionProps) => {
    if (startVis === 'hidden' || endVis === 'hidden') return null

    return (
      <line
        x1={`${start.x}%`}
        y1={`${start.y}%`}
        x2={`${end.x}%`}
        y2={`${end.y}%`}
        stroke='var(--color-toxic-green)'
        strokeWidth='1'
        opacity={startVis === 'dimmed' || endVis === 'dimmed' ? 0.2 : 0.5}
      />
    )
  },
  (prev: Readonly<MapConnectionProps>, next: Readonly<MapConnectionProps>) => {
    return (
      prev.start.x === next.start.x &&
      prev.start.y === next.start.y &&
      prev.end.x === next.end.x &&
      prev.end.y === next.end.y &&
      prev.startVis === next.startVis &&
      prev.endVis === next.endVis
    )
  }
)

MapConnection.displayName = 'MapConnection'
