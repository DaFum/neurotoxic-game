/*
 * (#1) Actual Updates: Extracted CableItem component to improve maintainability.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
// TODO: Extract complex UI sub-components into standalone files for better maintainability
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
      {CABLES.map(cable => (
        <CableItem
          key={cable.id}
          t={t}
          cable={cable}
          connections={connections}
          selectedCable={selectedCable}
          isShocked={isShocked}
          isGameOver={isGameOver}
          handleCableClick={handleCableClick}
        />
      ))}
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
