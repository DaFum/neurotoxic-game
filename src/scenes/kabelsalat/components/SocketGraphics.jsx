/*
 * (#1) Actual Updates: Extracted socket graphics to sub-components, removed TODO.
 * (#2) Next Steps: Extract PlugGraphics components.
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { CONNECTOR_TYPES } from '../constants.js'
import {
  XlrSocket,
  JackSocket,
  DcSocket,
  IecSocket,
  MidiSocket
} from './socket-graphics/index.js'

export const SocketGraphics = ({ type }) => {
  switch (type) {
    case 'xlr':
      return <XlrSocket />
    case 'jack':
      return <JackSocket />
    case 'dc':
      return <DcSocket />
    case 'iec':
      return <IecSocket />
    case 'midi':
      return <MidiSocket />
    default:
      return null
  }
}

SocketGraphics.propTypes = {
  type: PropTypes.oneOf(CONNECTOR_TYPES).isRequired
}
