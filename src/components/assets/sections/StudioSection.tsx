import { AssetSectionPanel } from '../AssetSectionPanel'
import { StudioFloorplanView } from './StudioFloorplanView'

/**
 * Renders the Studio asset section through the shared section panel.
 */
export const StudioSection = () => (
  <AssetSectionPanel
    kind='studio_chassis'
    renderHero={(asset, onSlotClick) => (
      <StudioFloorplanView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
