import { AssetSectionPanel } from '../AssetSectionPanel'
import { TourbusVehicleView } from './TourbusVehicleView'

export const TourbusSection = () => (
  <AssetSectionPanel
    kind='tourbus_chassis'
    renderHero={(asset, onSlotClick) => (
      <TourbusVehicleView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
