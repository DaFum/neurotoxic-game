import { memo } from 'react'

import type { NodeVisibility } from '../types/map'
import { nodeToPercentPosition } from '../utils/mapUtils'

/**
 * Defines the coordinate space for a map routing endpoint.
 */
interface MapConnectionEndpoint {
  /**
   * Horizontal position as a percentage of the map SVG viewport.
   */
  x: number
  /**
   * Vertical position as a percentage of the map SVG viewport.
   */
  y: number
}

/**
 * Configuration properties for drawing a map route segment.
 */
interface MapConnectionProps {
  /**
   * Start node position for the route segment.
   */
  start: MapConnectionEndpoint
  /**
   * End node position for the route segment.
   */
  end: MapConnectionEndpoint
  /**
   * Visibility state of the start node. Hidden nodes suppress the segment.
   */
  startVis: NodeVisibility
  /**
   * Visibility state of the end node. Hidden nodes suppress the segment.
   */
  endVis: NodeVisibility
}

/**
 * Draws a route segment between two visible map nodes.
 *
 * @remarks
 * Coordinates are percentage units in the parent SVG. If either endpoint is
 * hidden, no line is rendered; if either endpoint is dimmed, the line stays
 * visible at reduced opacity.
 *
 * @param props - Configuration properties for the map connection.
 * @returns An SVG line element representing the connection, or null if hidden.
 */
export const MapConnection = memo(
  ({ start, end, startVis, endVis }: MapConnectionProps) => {
    if (startVis === 'hidden' || endVis === 'hidden') return null

    const startPos = nodeToPercentPosition(start)
    const endPos = nodeToPercentPosition(end)

    return (
      <line
        x1={startPos.left}
        y1={startPos.top}
        x2={endPos.left}
        y2={endPos.top}
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
