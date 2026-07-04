import { getSlotZonePositionStyle } from '../../../utils/assetSections/slotLayout'
import { AssetSlotButton } from '../shared/AssetSlotButton'
import type { AssetSlot, SlotType } from '../../../types/assets'

/**
 * Per-slot presentation overrides returned by a section's {@link SlotZoneButtonsProps.slotOverride}.
 * Returning `null` from `slotOverride` skips the slot entirely (e.g. tier-gated slots).
 */
export interface SlotOverride {
  background?: string
  imageAspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  imageSizeHint?: { width: number; height: number }
}

/**
 * Shared props for rendering an asset's slots as dashed zone hotspots over a hero background.
 */
export interface SlotZoneButtonsProps {
  slots: AssetSlot[]
  zones: Partial<
    Record<SlotType, { x: number; y: number; w: number; h: number }>
  >
  /** Accent token used as the `--section-accent` fallback, e.g. `var(--color-electric-blue)`. */
  accent: string
  onSlotClick: (slotId: string) => void
  /**
   * Optional per-slot customization. Return `null` to skip a slot, or an
   * {@link SlotOverride} to override background/image metadata.
   */
  slotOverride?: (
    slot: AssetSlot,
    installedModuleId: string | null
  ) => SlotOverride | null
}

/**
 * Maps an asset's slots to dashed-border {@link AssetSlotButton} zone hotspots positioned
 * over a section hero background. Shared by the Studio, Workshop, and Bandhaus hero views.
 * @param props - Slots, zone rectangle map, accent fallback token, click handler, and optional per-slot overrides.
 */
export const SlotZoneButtons = ({
  slots,
  zones,
  accent,
  onSlotClick,
  slotOverride
}: SlotZoneButtonsProps) => {
  return (
    <>
      {slots.map(slot => {
        const installed = slot.installedModuleId
        const override = slotOverride?.(slot, installed)
        if (override === null) return null
        const zone = zones[slot.slotType]
        if (!zone) return null
        const background =
          override?.background ??
          (installed ? 'transparent' : 'var(--color-hotspot-bg)')
        return (
          <AssetSlotButton
            key={slot.id}
            id={slot.id}
            slotType={slot.slotType}
            installedModuleId={installed}
            onClick={onSlotClick}
            imageAspectRatio={override?.imageAspectRatio}
            imageSizeHint={override?.imageSizeHint}
            style={{
              ...getSlotZonePositionStyle(zone),
              border: `2px dashed var(--section-accent, ${accent})`,
              background
            }}
          />
        )
      })}
    </>
  )
}
