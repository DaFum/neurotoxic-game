/*
 * (#1) Actual Updates: Extracted ConnectionPath component from ConnectionPaths.jsx for better maintainability.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { CABLE_MAP } from '../constants.js'
import { getMessyPath } from '../utils.js'
import PropTypes from 'prop-types'

export const ConnectionPath = ({ sockId, cabId, isPowerConnected, socketOrder }) => {
  const cable = CABLE_MAP[cabId]
  const isActive = isPowerConnected || cabId === 'iec'
  const cableColor = isActive ? cable.color : 'var(--color-concrete-gray)'

  return (
    <path
      d={getMessyPath(cabId, sockId, socketOrder)}
      fill='none'
      stroke={cableColor}
      strokeWidth='12'
      strokeLinecap='round'
      className='animate-[dash_0.6s_ease-out_forwards]'
      strokeDasharray='1500'
      strokeDashoffset='1500'
      style={{
        filter: isActive
          ? `drop-shadow(0 5px 10px ${cable.color})`
          : `drop-shadow(0 10px 10px var(--color-shadow-black))`
      }}
    />
  )
}

ConnectionPath.propTypes = {
  sockId: PropTypes.string.isRequired,
  cabId: PropTypes.string.isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired
}
