import { AssetSectionPanel } from '../AssetSectionPanel'
import { StudioFloorplanView } from './StudioFloorplanView'

export const StudioSection = () => (
  <AssetSectionPanel
    kind='studio_chassis'
    renderHero={(asset, onSlotClick) => (
      <StudioFloorplanView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
