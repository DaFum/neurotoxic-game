import type { ConnectorType } from '../../../types/kabelsalat'
import { CONNECTOR_GRAPHICS } from './ConnectorGraphics.tsx'

export const SocketGraphics = ({ type }: { type: ConnectorType }) => {
  const Component = CONNECTOR_GRAPHICS[type]?.Socket
  return Component ? <Component /> : null
}
