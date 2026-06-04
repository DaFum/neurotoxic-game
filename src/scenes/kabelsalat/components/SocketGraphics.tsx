import type { ConnectorType } from '../../../types/kabelsalat'
import { CONNECTOR_GRAPHICS } from './ConnectorGraphics.tsx'

/**
 * Renders the Socket Graphics scene from type.
 * @param props - Connector type used to choose a socket graphic.
 * @returns The rendered Socket Graphics UI.
 */
export const SocketGraphics = ({ type }: { type: ConnectorType }) => {
  const Component = CONNECTOR_GRAPHICS[type]?.Socket
  return Component ? <Component /> : null
}
