import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt } from '../../../utils/imageGen'
import { STUDIO_SLOT_ZONES } from '../../../utils/assetSections/studioConfig'
import { SlotZoneButtons } from './SlotZoneButtons'
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
      <SlotZoneButtons
        slots={asset.slots}
        zones={STUDIO_SLOT_ZONES}
        accent='var(--color-electric-blue)'
        onSlotClick={onSlotClick}
      />
    </div>
  )
}
