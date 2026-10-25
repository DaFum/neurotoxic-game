import type { GameState } from '../types'
import type {
  InstallModuleFailureReason,
  InstallModulePayload
} from '../types/assets'
import { getExpeditionSpendableCash } from '../domain/expedition/spendableCash'
import { getRegisteredModule } from '../utils/assetModuleRegistry'
import {
  getLockReasons,
  getSlotConflicts,
  isModuleUnlocked,
  selectAssetsMap,
  selectAssetSlotsMap
} from '../utils/assetSelectors'

/** Rechecks every module-install gate against the current state. */
export const validateModuleInstall = (
  raw: Pick<InstallModulePayload, 'assetId' | 'slotId' | 'moduleId'>,
  state: GameState
): InstallModuleFailureReason | null => {
  const module = getRegisteredModule(raw.moduleId)
  if (!module) return 'UNKNOWN_MODULE'
  const asset = selectAssetsMap(state).get(raw.assetId)
  if (!asset) return 'UNKNOWN_ASSET'
  const slot = selectAssetSlotsMap(asset).get(raw.slotId)
  if (!slot) return 'UNKNOWN_SLOT'
  if (slot.installedModuleId !== null) return 'SLOT_OCCUPIED'
  if (slot.slotType !== module.slotType) return 'SLOT_TYPE_MISMATCH'
  if (!isModuleUnlocked(module, state)) return 'LOCKED'
  if (getLockReasons(module, state, asset).length > 0) return 'LOCKED'
  if (!getSlotConflicts(asset, raw.moduleId).canInstall) return 'EXCLUSIVITY'
  const count = asset.slots.filter(
    s => s.installedModuleId === raw.moduleId
  ).length
  if (count >= (module.maxPerAsset ?? 1)) return 'MAX_PER_ASSET'
  // Spendable, not raw: the Expedition cash floor rolls back a debit into the
  // protected slice, which would swallow the install without a failure.
  if (
    !Number.isFinite(state.player.money) ||
    getExpeditionSpendableCash(state) < module.cost + module.installCost
  ) {
    return 'INSUFFICIENT_FUNDS'
  }
  return null
}
