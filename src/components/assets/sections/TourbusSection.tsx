import { AssetSectionPanel } from '../AssetSectionPanel'
import { TourbusVehicleView } from './TourbusVehicleView'

/**
 * Renders the Tourbus asset section through the shared section panel.
 * @returns The rendered Tourbus Section UI.
 */
export const TourbusSection = () => (
  <AssetSectionPanel
    kind='tourbus_chassis'
    renderHero={(asset, onSlotClick) => (
      <TourbusVehicleView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
