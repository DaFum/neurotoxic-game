import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt } from '../../../utils/imageGen'
import { TOURBUS_SLOT_POSITIONS } from '../../../utils/assetSections/tourbusConfig'
import { TourbusTrailerOverlay } from './TourbusTrailerOverlay'
import { TourbusSlotButton } from './TourbusSlotButton'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

/**
 * Displays the tourbus vehicle background, module hotspots, and trailer overlay.
 * @param props - Tourbus asset state and slot-click handler.
 */
export const TourbusVehicleView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  const hasTrailer = asset.slots.some(
    s => s.installedModuleId === 'tb_trailer_hitch'
  )
  return (
    <div className='asset-hero-visual flex flex-col gap-3 md:relative md:block md:gap-0'>
      {/* Van body — own relative container so hotspots are scoped to it,
          not to the wrapper that also includes the (mobile) trailer below. */}
      <div className='relative'>
        <GeneratedImagePanel
          prompt={getSectionBackgroundPrompt(
            'tourbus_chassis',
            asset.chassisFlavor
          )}
          alt={t('assets:section.tourbus.alt')}
          aspectRatio='16:9'
          sizeHint={{ width: 1280, height: 720 }}
        />
        {asset.slots
          .filter(s => s.slotType !== 'tb_trailer_addon')
          .map(slot => {
            const pos = TOURBUS_SLOT_POSITIONS[slot.slotType]
            if (!pos) return null
            const installed = slot.installedModuleId
            return (
              <TourbusSlotButton
                key={slot.id}
                id={slot.id}
                slotType={slot.slotType}
                installedModuleId={installed}
                onClick={onSlotClick}
                left={`${pos.x * 100}%`}
                top={`${pos.y * 100}%`}
              />
            )
          })}
      </div>
      {hasTrailer && (
        <TourbusTrailerOverlay asset={asset} onSlotClick={onSlotClick} />
      )}
    </div>
  )
}
