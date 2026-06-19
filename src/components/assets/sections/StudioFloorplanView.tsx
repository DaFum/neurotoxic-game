import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt } from '../../../utils/imageGen'
import { STUDIO_SLOT_ZONES } from '../../../utils/assetSections/studioConfig'
import { getSlotZonePositionStyle } from '../../../utils/assetSections/slotLayout'
import { AssetSlotButton } from '../shared/AssetSlotButton'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

/**
 * Displays the studio floorplan background and module slot zones.
 * @param props - Studio asset state and slot-click handler.
 */
export const StudioFloorplanView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='asset-hero-visual relative'>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt(
          'studio_chassis',
          asset.chassisFlavor
        )}
        alt={t('assets:section.studio.alt')}
        aspectRatio='4:3'
        sizeHint={{ width: 1024, height: 768 }}
      />
      {asset.slots.map(slot => {
        const zone = STUDIO_SLOT_ZONES[slot.slotType]
        if (!zone) return null
        const installed = slot.installedModuleId
        return (
          <AssetSlotButton
            key={slot.id}
            id={slot.id}
            slotType={slot.slotType}
            installedModuleId={installed}
            onClick={onSlotClick}
            style={{
              ...getSlotZonePositionStyle(zone),
              border:
                '2px dashed var(--section-accent, var(--color-electric-blue))',
              background: installed ? 'transparent' : 'var(--color-hotspot-bg)'
            }}
          />
        )
      })}
    </div>
  )
}
