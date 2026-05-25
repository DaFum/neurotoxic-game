import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getTrailerImagePrompt } from '../../../utils/imageGen'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

/**
 * Renders the trailer panel left of the tour van, with hotspots for any
 * `tb_trailer_addon` slots. Mounted by `TourbusVehicleView` only when
 * `tb_trailer_hitch` is installed on the asset.
 */
export const TourbusTrailerOverlay = ({ asset, onSlotClick }: Props) => {
  const addonSlots = asset.slots.filter(s => s.slotType === 'tb_trailer_addon')
  return (
    <div
      className='absolute'
      style={{ left: '-30%', top: '20%', width: '30%' }}
    >
      <GeneratedImagePanel
        prompt={getTrailerImagePrompt(asset.chassisFlavor)}
        alt='Trailer'
        aspectRatio='16:9'
        sizeHint={{ width: 640, height: 360 }}
      />
      {addonSlots.map((slot, i) => (
        <button
          key={slot.id}
          type='button'
          aria-label={`slot ${slot.slotType}`}
          onClick={() => onSlotClick(slot.id)}
          className='absolute -translate-x-1/2 -translate-y-1/2'
          style={{
            left: `${30 + i * 30}%`,
            top: '50%',
            width: 48,
            height: 48,
            border:
              '2px dashed var(--section-accent, var(--color-toxic-green))',
            background: 'rgba(0,0,0,0.5)',
            color: 'var(--section-accent, var(--color-toxic-green))'
          }}
        >
          +
        </button>
      ))}
    </div>
  )
}
