import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getTrailerImagePrompt } from '../../../utils/imageGen'
import type { LongTermAsset } from '../../../types/assets'
import { useTranslation } from 'react-i18next'
import { TourbusSlotButton } from './TourbusSlotButton'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

/**
 * Mobile: stacks beneath the van. Desktop (md+): docks to the left of the
 * van as an absolutely-positioned overlay so the trailer looks "hitched".
 * Mounted by `TourbusVehicleView` only when `tb_trailer_hitch` is installed.
 */
export const TourbusTrailerOverlay = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation('ui')
  const addonSlots = asset.slots.filter(s => s.slotType === 'tb_trailer_addon')
  return (
    <div className='relative w-full md:absolute md:-left-1/3 md:top-1/5 md:w-1/3'>
      <GeneratedImagePanel
        prompt={getTrailerImagePrompt(asset.chassisFlavor)}
        alt={t('ui:assets.tourbus.trailer_alt', {
          defaultValue: 'Trailer'
        })}
        aspectRatio='16:9'
        sizeHint={{ width: 640, height: 360 }}
      />
      {addonSlots.map((slot, i) => {
        const translatedSlotType = t(
          `ui:assets.tourbus.slotType.${slot.slotType}`,
          {
            defaultValue: slot.slotType.replaceAll('_', ' ')
          }
        )
        return (
          <TourbusSlotButton
            key={slot.id}
            id={slot.id}
            slotType={slot.slotType}
            installedModuleId={slot.installedModuleId}
            onClick={onSlotClick}
            variant='trailer'
            left={`${30 + i * 30}%`}
            top='50%'
            ariaLabel={t('ui:assets.tourbus.trailer_slot', {
              slotType: translatedSlotType,
              defaultValue: `slot ${translatedSlotType}`
            })}
          />
        )
      })}
    </div>
  )
}
