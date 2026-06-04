import type { ConnectorType } from '../../../types/kabelsalat'
import { CONNECTOR_GRAPHICS } from './ConnectorGraphics.tsx'

/**
 * Selects the plug graphic for a Kabelsalat cable id.
 * @param props - Connector type used to choose a plug graphic.
 */
export const PlugGraphics = ({ type }: { type: ConnectorType }) => {
  const Component = CONNECTOR_GRAPHICS[type]?.Plug
  return Component ? <Component /> : null
}
