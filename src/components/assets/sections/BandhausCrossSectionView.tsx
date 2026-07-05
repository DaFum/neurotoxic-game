import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt } from '../../../utils/imageGen'
import { BANDHAUS_SLOT_ZONES } from '../../../utils/assetSections/bandhausConfig'
import { SlotZoneButtons } from './SlotZoneButtons'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

/**
 * Displays the Bandhaus cross-section background and room slot zones.
 * @param props - Bandhaus asset state and slot-click handler.
 */
export const BandhausCrossSectionView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='asset-hero-visual relative'>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt(
          'bandhaus_chassis',
          asset.chassisFlavor
        )}
        alt={t('assets:section.bandhaus.alt')}
        aspectRatio='3:4'
        sizeHint={{ width: 768, height: 1024 }}
      />
      <SlotZoneButtons
        slots={asset.slots}
        zones={BANDHAUS_SLOT_ZONES}
        accent='var(--color-cosmic-purple)'
        onSlotClick={onSlotClick}
        slotOverride={(slot, installed) => {
          // bh_secret is Tier-3 only — keep it hidden on lower-tier chassis
          // even if a sanitizer or migration leaves the slot in place.
          if (slot.slotType === 'bh_secret' && asset.chassisTier < 3) {
            return null
          }
          const isMural = slot.slotType === 'bh_identity' && installed !== null
          // Mural needs a dark backdrop so the wide facade overlay reads
          // against the background image; non-mural installed slots stay
          // transparent.
          return {
            background:
              installed && !isMural ? 'transparent' : 'var(--color-hotspot-bg)',
            imageAspectRatio: isMural ? '21:9' : '1:1',
            imageSizeHint: isMural
              ? { width: 512, height: 128 }
              : { width: 256, height: 256 }
          }
        }}
      />
    </div>
  )
}
