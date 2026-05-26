import { AssetSectionPanel } from '../AssetSectionPanel'
import { WorkshopProductionLineView } from './WorkshopProductionLineView'

export const MerchWorkshopSection = () => (
  <AssetSectionPanel
    kind='merch_workshop_chassis'
    renderHero={(asset, onSlotClick) => (
      <WorkshopProductionLineView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
