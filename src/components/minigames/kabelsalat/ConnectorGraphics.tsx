import type React from 'react'
import { XlrPlug } from './plugs/XlrPlug.tsx'
import { JackPlug } from './plugs/JackPlug.tsx'
import { DcPlug } from './plugs/DcPlug.tsx'
import { IecPlug } from './plugs/IecPlug.tsx'
import { MidiPlug } from './plugs/MidiPlug.tsx'
import { XlrSocket } from './sockets/XlrSocket.tsx'
import { JackSocket } from './sockets/JackSocket.tsx'
import { DcSocket } from './sockets/DcSocket.tsx'
import { IecSocket } from './sockets/IecSocket.tsx'
import { MidiSocket } from './sockets/MidiSocket.tsx'
import type { ConnectorType } from '../../../types/kabelsalat'

/**
 * Registers Kabelsalat connector graphics by connector type.
 */
export const CONNECTOR_GRAPHICS: Record<
  ConnectorType,
  { Plug: React.FC; Socket: React.FC }
> = {
  xlr: { Plug: XlrPlug, Socket: XlrSocket },
  jack: { Plug: JackPlug, Socket: JackSocket },
  dc: { Plug: DcPlug, Socket: DcSocket },
  iec: { Plug: IecPlug, Socket: IecSocket },
  midi: { Plug: MidiPlug, Socket: MidiSocket }
}
