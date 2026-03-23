/*
 * (#1) Actual Updates: Added PropTypes.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import PropTypes from 'prop-types'
import { CONNECTOR_TYPES } from '../constants.js'
import { XlrSocket } from './sockets/XlrSocket.jsx'
import { JackSocket } from './sockets/JackSocket.jsx'
import { DcSocket } from './sockets/DcSocket.jsx'
import { IecSocket } from './sockets/IecSocket.jsx'
import { MidiSocket } from './sockets/MidiSocket.jsx'

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
