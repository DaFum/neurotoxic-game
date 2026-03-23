/*
 * (#1) Actual Updates: Refactored SocketList to use imported SocketItem.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { SocketItem } from './SocketItem.jsx'

export const SocketList = ({
  t,
  socketOrder,
  connections,
  isPowerConnected,
  selectedCable,
  isGameOver,
  handleSocketClick
}) => {
  return (
    <>
      {socketOrder.map((socketId, index) => (
        <SocketItem
          key={socketId}
          t={t}
          socketId={socketId}
          index={index}
          connections={connections}
          isPowerConnected={isPowerConnected}
          selectedCable={selectedCable}
          isGameOver={isGameOver}
          handleSocketClick={handleSocketClick}
        />
      ))}
    </>
  )
}

SocketList.propTypes = {
  t: PropTypes.func.isRequired,
  socketOrder: PropTypes.arrayOf(PropTypes.string).isRequired,
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  isPowerConnected: PropTypes.bool.isRequired,
  selectedCable: PropTypes.string,
  isGameOver: PropTypes.bool.isRequired,
  handleSocketClick: PropTypes.func.isRequired
}
