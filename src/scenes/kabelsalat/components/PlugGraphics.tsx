/*
 * (#1) Actual Updates: Extracted plug graphics to sub-components, removed TODO.

 */
import { XlrPlug } from './plugs/XlrPlug.tsx'
import { JackPlug } from './plugs/JackPlug.tsx'
import { DcPlug } from './plugs/DcPlug.tsx'
import { IecPlug } from './plugs/IecPlug.tsx'
import { MidiPlug } from './plugs/MidiPlug.tsx'
import type { ConnectorType } from '../../../types/kabelsalat'

export const PlugGraphics = ({ type }: { type: ConnectorType }) => {
  switch (type) {
    case 'xlr':
      return <XlrPlug />
    case 'jack':
      return <JackPlug />
    case 'dc':
      return <DcPlug />
    case 'iec':
      return <IecPlug />
    case 'midi':
      return <MidiPlug />
    default:
      return null
  }
}
