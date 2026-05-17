/*
 * (#1) Actual Updates: Extracted socket graphics to sub-components, removed TODO.

 */
import { XlrSocket } from './sockets/XlrSocket.tsx'
import { JackSocket } from './sockets/JackSocket.tsx'
import { DcSocket } from './sockets/DcSocket.tsx'
import { IecSocket } from './sockets/IecSocket.tsx'
import { MidiSocket } from './sockets/MidiSocket.tsx'
import type { ConnectorType } from '../../../types/kabelsalat'

export const SocketGraphics = ({ type }: { type: ConnectorType }) => {
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
