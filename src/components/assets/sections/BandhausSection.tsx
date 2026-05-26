import { AssetSectionPanel } from '../AssetSectionPanel'
import { BandhausCrossSectionView } from './BandhausCrossSectionView'

export const BandhausSection = () => (
  <AssetSectionPanel
    kind='bandhaus_chassis'
    renderHero={(asset, onSlotClick) => (
      <BandhausCrossSectionView asset={asset} onSlotClick={onSlotClick} />
    )}
  />
)
