import { memo } from 'react'
import PropTypes from 'prop-types'

export const MapConnection = memo(
  ({ start, end, startVis, endVis }) => {
    if (startVis === 'hidden' || endVis === 'hidden') return null

    return (
      <line
        x1={`${start.x}%`}
        y1={`${start.y}%`}
        x2={`${end.x}%`}
        y2={`${end.y}%`}
        stroke='var(--toxic-green)'
        strokeWidth='1'
        opacity={startVis === 'dimmed' || endVis === 'dimmed' ? 0.2 : 0.5}
      />
    )
  },
  (prev, next) => {
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
MapConnection.propTypes = {
  start: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }).isRequired,
  end: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }).isRequired,
  startVis: PropTypes.string.isRequired,
  endVis: PropTypes.string.isRequired
}
