import type { TFunction } from 'i18next'
import type { SlotType } from '../../../types/assets'

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
