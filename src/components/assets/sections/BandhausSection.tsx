import { AssetSectionPanel } from '../AssetSectionPanel'
import { BandhausCrossSectionView } from './BandhausCrossSectionView'

/**
 * Renders the Bandhaus asset section through the shared section panel.
 * @returns The rendered Bandhaus Section UI.
 */
export const BandhausSection = () => (
  <AssetSectionPanel
    kind='bandhaus_chassis'
    renderHero={(asset, onSlotClick) => (
      <BandhausCrossSectionView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
