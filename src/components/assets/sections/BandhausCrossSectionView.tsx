import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import {
  getSectionBackgroundPrompt,
  getModuleImagePrompt
} from '../../../utils/imageGen'
import { BANDHAUS_SLOT_ZONES } from '../../../utils/assetSections/bandhausConfig'
import { formatSlotZonePercent } from '../../../utils/assetSections/slotLayout'
import { getSlotButtonAriaLabel } from './slotLabels'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

export const BandhausCrossSectionView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='asset-hero-visual relative'>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt(
          'bandhaus_chassis',
          asset.chassisFlavor
        )}
        alt={t('assets:section.bandhaus.alt')}
        aspectRatio='3:4'
        sizeHint={{ width: 768, height: 1024 }}
      />
      {asset.slots.map(slot => {
        // bh_secret is Tier-3 only — keep it hidden on lower-tier chassis
        // even if a sanitizer or migration leaves the slot in place.
        if (slot.slotType === 'bh_secret' && asset.chassisTier < 3) return null
        const zone = BANDHAUS_SLOT_ZONES[slot.slotType]
        if (!zone) return null
        const installed = slot.installedModuleId
        const isMural = slot.slotType === 'bh_identity' && installed !== null
        // Mural needs a dark backdrop so the wide facade overlay reads against
        // the background image; non-mural installed slots stay transparent.
        const background =
          installed && !isMural ? 'transparent' : 'var(--color-hotspot-bg)'
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
                '2px dashed var(--section-accent, var(--color-cosmic-purple))',
              background,
              cursor: 'pointer'
            }}
          >
            {installed && (
              <GeneratedImagePanel
                prompt={getModuleImagePrompt(installed)}
                alt={t(`assets:module.${installed}.name`, {
                  defaultValue: installed
                })}
                // Mural slot is wide-flat (zone w=0.8, h=0.15 → roughly 4:1).
                // 21:9 is the closest available aspect ratio to the actual
                // container's 4:1 — anything narrower causes a vertical
                // squish from the panel's internal CSS aspect-ratio rule.
                aspectRatio={isMural ? '21:9' : '1:1'}
                variant='hotspot'
                sizeHint={
                  isMural
                    ? { width: 512, height: 128 }
                    : { width: 256, height: 256 }
                }
                className='h-full w-full'
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
