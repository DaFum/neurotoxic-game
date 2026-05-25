import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import {
  getSectionBackgroundPrompt,
  getModuleImagePrompt,
  resolveGenImageUrl,
  appendImageSize
} from '../../../utils/imageGen'
import { TOURBUS_SLOT_POSITIONS } from '../../../utils/assetSections/tourbusConfig'
import { TourbusTrailerOverlay } from './TourbusTrailerOverlay'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

export const TourbusVehicleView = ({ asset, onSlotClick }: Props) => {
  const hasTrailer = asset.slots.some(
    s => s.installedModuleId === 'tb_trailer_hitch'
  )
  return (
    <div className='relative'>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt(
          'tourbus_chassis',
          asset.chassisFlavor
        )}
        alt='Tourbus'
        aspectRatio='16:9'
        sizeHint={{ width: 1280, height: 720 }}
      />
      {hasTrailer && (
        <TourbusTrailerOverlay asset={asset} onSlotClick={onSlotClick} />
      )}
      {asset.slots
        .filter(s => s.slotType !== 'tb_trailer_addon')
        .map(slot => {
          const pos = TOURBUS_SLOT_POSITIONS[slot.slotType]
          if (!pos) return null
          const installed = slot.installedModuleId
          return (
            <button
              key={slot.id}
              type='button'
              aria-label={`slot ${slot.slotType}`}
              onClick={() => onSlotClick(slot.id)}
              className='absolute -translate-x-1/2 -translate-y-1/2 border-2'
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                width: 64,
                height: 64,
                borderColor: 'var(--section-accent, var(--color-toxic-green))',
                borderRadius: '50%',
                background: installed ? 'transparent' : 'rgba(0,0,0,0.5)',
                cursor: 'pointer'
              }}
            >
              {installed ? (
                <img
                  src={appendImageSize(
                    resolveGenImageUrl(getModuleImagePrompt(installed)),
                    128,
                    128
                  )}
                  alt={installed}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  style={{
                    color: 'var(--section-accent, var(--color-toxic-green))',
                    fontSize: 24
                  }}
                >
                  +
                </span>
              )}
            </button>
          )
        })}
    </div>
  )
}
