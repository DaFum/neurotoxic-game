import type { ConnectorType } from '../../../types/kabelsalat'
import { CONNECTOR_GRAPHICS } from './ConnectorGraphics.tsx'

/**
 * Selects the socket graphic for a Kabelsalat socket id.
 * @param props - Connector type used to choose a socket graphic.
 */
export const SocketGraphics = ({ type }: { type: ConnectorType }) => {
  const Component = CONNECTOR_GRAPHICS[type]?.Socket
  return Component ? <Component /> : null
}
