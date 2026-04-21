/*
 * (#1) Actual Updates: Extracted socket graphics to sub-components, removed TODO.


 */
import PropTypes from 'prop-types'
import { CONNECTOR_TYPES } from '../constants'
import { XlrSocket } from './sockets/XlrSocket.tsx'
import { JackSocket } from './sockets/JackSocket.tsx'
import { DcSocket } from './sockets/DcSocket.tsx'
import { IecSocket } from './sockets/IecSocket.tsx'
import { MidiSocket } from './sockets/MidiSocket.tsx'

type ConnectorType = 'xlr' | 'jack' | 'dc' | 'iec' | 'midi'

export const SocketGraphics = ({ type }: { type: ConnectorType | string }) => {
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
