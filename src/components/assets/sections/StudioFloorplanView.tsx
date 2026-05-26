import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import {
  getSectionBackgroundPrompt,
  getModuleImagePrompt
} from '../../../utils/imageGen'
import { STUDIO_SLOT_ZONES } from '../../../utils/assetSections/studioConfig'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

const toPercent = (value: number): string => `${Number(value.toFixed(4))}%`

export const StudioFloorplanView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='relative'>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt(
          'studio_chassis',
          asset.chassisFlavor
        )}
        alt='Studio floorplan'
        aspectRatio='4:3'
        sizeHint={{ width: 1024, height: 768 }}
      />
      {asset.slots.map(slot => {
        const zone = STUDIO_SLOT_ZONES[slot.slotType]
        if (!zone) return null
        const installed = slot.installedModuleId
        return (
          <button
            key={slot.id}
            type='button'
            aria-label={t(`assets:slot.${slot.slotType}`)}
            onClick={() => onSlotClick(slot.id)}
            className='absolute'
            style={{
              left: toPercent((zone.x - zone.w / 2) * 100),
              top: toPercent((zone.y - zone.h / 2) * 100),
              width: toPercent(zone.w * 100),
              height: toPercent(zone.h * 100),
              border:
                '2px dashed var(--section-accent, var(--color-electric-blue))',
              background: installed ? 'transparent' : 'var(--color-hotspot-bg)',
              cursor: 'pointer'
            }}
          >
            {installed && (
              <GeneratedImagePanel
                prompt={getModuleImagePrompt(installed)}
                alt={installed}
                aspectRatio='1:1'
                variant='hotspot'
                sizeHint={{ width: 256, height: 256 }}
                className='h-full w-full'
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
