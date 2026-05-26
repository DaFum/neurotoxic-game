import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import {
  getSectionBackgroundPrompt,
  getModuleImagePrompt
} from '../../../utils/imageGen'
import { TOURBUS_SLOT_POSITIONS } from '../../../utils/assetSections/tourbusConfig'
import { TourbusTrailerOverlay } from './TourbusTrailerOverlay'
import { getSlotButtonAriaLabel } from './slotLabels'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

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
              <button
                key={slot.id}
                type='button'
                aria-label={getSlotButtonAriaLabel(t, slot.slotType, installed)}
                onClick={() => onSlotClick(slot.id)}
                className='absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 border-2 sm:h-12 sm:w-12 md:h-16 md:w-16'
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  borderColor:
                    'var(--section-accent, var(--color-toxic-green))',
                  borderRadius: '50%',
                  background: installed
                    ? 'transparent'
                    : 'var(--color-hotspot-bg)',
                  cursor: 'pointer'
                }}
              >
                {installed ? (
                  <GeneratedImagePanel
                    prompt={getModuleImagePrompt(installed)}
                    alt={t(`assets:module.${installed}.name`, {
                      defaultValue: installed
                    })}
                    aspectRatio='1:1'
                    variant='hotspot'
                    sizeHint={{ width: 128, height: 128 }}
                    className='h-full w-full'
                  />
                ) : (
                  <span
                    className='text-base sm:text-xl md:text-2xl'
                    style={{
                      color: 'var(--section-accent, var(--color-toxic-green))'
                    }}
                  >
                    +
                  </span>
                )}
              </button>
            )
          })}
      </div>
      {hasTrailer && (
        <TourbusTrailerOverlay asset={asset} onSlotClick={onSlotClick} />
      )}
    </div>
  )
}
