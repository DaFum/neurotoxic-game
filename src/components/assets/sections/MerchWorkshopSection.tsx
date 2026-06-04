import { AssetSectionPanel } from '../AssetSectionPanel'
import { WorkshopProductionLineView } from './WorkshopProductionLineView'

/**
 * Renders the merch workshop asset section through the shared section panel.
 */
export const MerchWorkshopSection = () => (
  <AssetSectionPanel
    kind='merch_workshop_chassis'
    renderHero={(asset, onSlotClick) => (
      <WorkshopProductionLineView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
