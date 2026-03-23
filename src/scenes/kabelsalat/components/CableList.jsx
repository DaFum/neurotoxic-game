/*
 * (#1) Actual Updates: Extracted CableItem for maintainability.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { CABLES } from '../constants.js'
import PropTypes from 'prop-types'
import { CableItem } from './CableItem.jsx'

export const CableList = ({
  t,
  connections,
  selectedCable,
  isShocked,
  isGameOver,
  handleCableClick
}) => {
  return (
    <>
      {CABLES.map(cable => {
        const isConnected = Object.values(connections).includes(cable.id)
        const isSelected = selectedCable === cable.id

        return (
          <CableItem
            key={cable.id}
            t={t}
            cable={cable}
            isConnected={isConnected}
            isSelected={isSelected}
            isShocked={isShocked}
            isGameOver={isGameOver}
            handleCableClick={handleCableClick}
          />
        )
      })}
    </>
  )
}

CableList.propTypes = {
  t: PropTypes.func.isRequired,
  connections: PropTypes.objectOf(PropTypes.string).isRequired,
  selectedCable: PropTypes.string,
  isShocked: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  handleCableClick: PropTypes.func.isRequired
}
