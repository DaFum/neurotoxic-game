import type { ConnectorType } from '../../../types/kabelsalat'
import { CONNECTOR_GRAPHICS } from './ConnectorGraphics.tsx'

/**
 * Renders the Plug Graphics scene.
 * @param props - Connector type used to choose a plug graphic.
 */
export const PlugGraphics = ({ type }: { type: ConnectorType }) => {
  const Component = CONNECTOR_GRAPHICS[type]?.Plug
  return Component ? <Component /> : null
}
