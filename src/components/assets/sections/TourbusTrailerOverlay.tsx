import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getTrailerImagePrompt } from '../../../utils/imageGen'
import type { LongTermAsset } from '../../../types/assets'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const addonSlots = asset.slots.filter(s => s.slotType === 'tb_trailer_addon')
  return (
    <div className='relative w-full md:absolute md:left-[-30%] md:top-[20%] md:w-[30%]'>
      <GeneratedImagePanel
        prompt={getTrailerImagePrompt(asset.chassisFlavor)}
        alt={t('ui:assets.tourbus.trailer_alt', {
          defaultValue: 'Trailer'
        })}
        aspectRatio='16:9'
        sizeHint={{ width: 640, height: 360 }}
      />
      {addonSlots.map((slot, i) => (
        <button
          key={slot.id}
          type='button'
          aria-label={t('ui:assets.tourbus.trailer_slot', {
            slotType: slot.slotType,
            defaultValue: `slot ${slot.slotType}`
          })}
          onClick={() => onSlotClick(slot.id)}
          className='absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 sm:h-12 sm:w-12'
          style={{
            left: `${30 + i * 30}%`,
            top: '50%',
            border:
              '2px dashed var(--section-accent, var(--color-toxic-green))',
            background: 'var(--color-hotspot-bg)',
            color: 'var(--section-accent, var(--color-toxic-green))'
          }}
        >
          +
        </button>
      ))}
    </div>
  )
}
