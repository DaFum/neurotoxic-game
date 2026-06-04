import type { TFunction } from 'i18next'
import type { SlotType } from '../../../types/assets'

/**
 * Builds the accessible label for an asset slot button.
 * @param t - Translation callback.
 * @param slotType - Slot type being rendered.
 * @param installedModuleId - Installed module id, if any.
 * @returns Computed result.
 */
export const getSlotButtonAriaLabel = (
  t: TFunction,
  slotType: SlotType,
  installedModuleId: string | null
): string => {
  const slotName = String(t(`assets:slot.${slotType}`))
  if (installedModuleId === null) return slotName
  const moduleName = String(
    t(`assets:module.${installedModuleId}.name`, {
      defaultValue: installedModuleId
    })
  )
  return `${slotName}: ${moduleName}`
}
