import { AssetSectionPanel } from '../AssetSectionPanel'
import { TourbusVehicleView } from './TourbusVehicleView'

/**
 * Presents the tourbus asset section through the shared section panel.
 */
export const TourbusSection = () => (
  <AssetSectionPanel
    kind='tourbus_chassis'
    renderHero={(asset, onSlotClick) => (
      <TourbusVehicleView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
