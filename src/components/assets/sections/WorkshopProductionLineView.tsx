import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt } from '../../../utils/imageGen'
import { WORKSHOP_SLOT_ZONES } from '../../../utils/assetSections/workshopConfig'
import { SlotZoneButtons } from './SlotZoneButtons'
import type { LongTermAsset } from '../../../types/assets'

interface Props {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

/**
 * Displays the merch workshop production-line background and station zones.
 * @param props - Workshop asset state and slot-click handler.
 */
export const WorkshopProductionLineView = ({ asset, onSlotClick }: Props) => {
  const { t } = useTranslation(['assets'])
  return (
    <div className='asset-hero-visual asset-hero-visual--wide relative'>
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
      <SlotZoneButtons
        slots={asset.slots}
        zones={WORKSHOP_SLOT_ZONES}
        accent='var(--color-warning-yellow)'
        onSlotClick={onSlotClick}
      />
    </div>
  )
}
