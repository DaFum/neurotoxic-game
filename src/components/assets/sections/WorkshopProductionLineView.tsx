import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import {
  getSectionBackgroundPrompt,
  getModuleImagePrompt
} from '../../../utils/imageGen'
import { WORKSHOP_SLOT_ZONES } from '../../../utils/assetSections/workshopConfig'
import { formatSlotZonePercent } from '../../../utils/assetSections/slotLayout'
import { getSlotButtonAriaLabel } from './slotLabels'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

export const WorkshopProductionLineView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='relative'>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt(
          'merch_workshop_chassis',
          asset.chassisFlavor
        )}
        alt={t('assets:section.workshop.alt', {
          defaultValue: 'Workshop production line'
        })}
        aspectRatio='21:9'
        sizeHint={{ width: 1680, height: 720 }}
      />
      <div
        aria-hidden
        className='pointer-events-none absolute'
        style={{
          left: '5%',
          right: '15%',
          top: '55%',
          height: 4,
          background: 'var(--section-accent, var(--color-warning-yellow))',
          opacity: 0.4
        }}
      />
      {asset.slots.map(slot => {
        const zone = WORKSHOP_SLOT_ZONES[slot.slotType]
        if (!zone) return null
        const installed = slot.installedModuleId
        return (
          <button
            key={slot.id}
            type='button'
            aria-label={getSlotButtonAriaLabel(t, slot.slotType, installed)}
            onClick={() => onSlotClick(slot.id)}
            className='absolute'
            style={{
              left: formatSlotZonePercent((zone.x - zone.w / 2) * 100),
              top: formatSlotZonePercent((zone.y - zone.h / 2) * 100),
              width: formatSlotZonePercent(zone.w * 100),
              height: formatSlotZonePercent(zone.h * 100),
              border:
                '2px dashed var(--section-accent, var(--color-warning-yellow))',
              background: installed ? 'transparent' : 'var(--color-hotspot-bg)',
              cursor: 'pointer'
            }}
          >
            {installed && (
              <GeneratedImagePanel
                prompt={getModuleImagePrompt(installed)}
                alt={t(`assets:module.${installed}.name`, {
                  defaultValue: installed
                })}
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
