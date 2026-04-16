// @ts-nocheck
/*
 * (#1) Actual Updates: Refactored ConnectionPaths to use the newly extracted ConnectionPath sub-component.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { ConnectionPath } from './ConnectionPath.tsx'

export const ConnectionPaths = ({
  connections,
  isPowerConnected,
  socketOrder
}) => {
  return (
    <>
      {Object.entries(connections).map(([sockId, cabId]) => (
        <ConnectionPath
          key={sockId}
          sockId={sockId}
          cabId={cabId}
          isPowerConnected={isPowerConnected}
          socketOrder={socketOrder}
        />
      ))}
    </>
  )
}

ConnectionPaths.propTypes = {
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired
}
