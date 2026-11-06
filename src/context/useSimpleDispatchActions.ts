import { useMemo, startTransition, type Dispatch } from 'react'
import type { GameAction, SocialState, UpdateBandPayload, UpdatePlayerPayload, GameState } from '../types'
import {
  createUpdatePlayerAction,
  createUpdateBandAction,
  createSettleSoldMerchAction,
  createRecordPendingGigSettlementAction,
  createClearPendingGigSettlementAction,
  toggleNeuroDecimator as createToggleNeuroDecimatorAction,
  createHoldBandMeetingAction,
  createRestockMerchAction,
  createUpdateSocialAction,
  createApplyGigSocialReconciliationAction,
  createSetMapAction,
  createSetGigAction,
  createStartGigAction,
  createSetSetlistAction,
  createSetLastGigStatsAction,
  createRemoveToastAction,
  createSetGigModifiersAction,
  createConsumeItemAction,
  createUnlockTraitAction,
  createSetPendingBandHQOpenAction,
  createSetPendingSupplyStopInventoryAction,
  dismissForeclosureNotice as dismissForeclosureNoticeAction,
  createSetPendingRiskEventAction,
  createUpdateSettingsAction
} from './actionCreators'
import { sanitizeSettingsPayload } from '../utils/settingsSanitizer'
import { logger } from '../utils/logger'
import { readGlobalSettings, safeStorageOperation, writeGlobalSettings } from '../utils/storage'
import { useStorage } from './StorageContext'

export interface SimpleDispatchActions {
  updatePlayer: (updates: UpdatePlayerPayload) => void
  updateBand: (updates: UpdateBandPayload) => void
  settleSoldMerch: (soldMerch: Record<string, number>) => void
  recordPendingGigSettlement: (settlement: Parameters<typeof createRecordPendingGigSettlementAction>[0]) => void
  clearPendingGigSettlement: (id: string) => void
  toggleNeuroDecimator: (isActive: Parameters<typeof createToggleNeuroDecimatorAction>[0]) => void
  holdBandMeeting: () => void
  restockMerch: (merchKey: string) => void
  updateSocial: (updates: Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)) => void
  applyGigSocialReconciliation: (
    socialUpdate: Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>),
    settlementId?: string | null
  ) => void
  setGameMap: (mapData: GameState['gameMap']) => void
  setCurrentGig: (gig: GameState['currentGig']) => void
  startGig: (gig: Parameters<typeof createStartGigAction>[0]) => void
  setSetlist: (list: Parameters<typeof createSetSetlistAction>[0]) => void
  setLastGigStats: (stats: Parameters<typeof createSetLastGigStatsAction>[0]) => void
  removeToast: (id: string) => void
  setGigModifiers: (modifiers: Parameters<typeof createSetGigModifiersAction>[0]) => void
  consumeItem: (itemId: string) => void
  unlockTrait: (memberId: string, traitId: string) => void
  setPendingBandHQOpen: (isOpen: boolean) => void
  setPendingSupplyStopInventory: (inventory: Parameters<typeof createSetPendingSupplyStopInventoryAction>[0]) => void
  dismissForeclosureNotice: (kind: Parameters<typeof dismissForeclosureNoticeAction>[0]) => void
  setPendingRiskEvent: (event: Parameters<typeof createSetPendingRiskEventAction>[0]) => void
  updateSettings: (updates: Record<string, unknown>) => void
}

export function useSimpleDispatchActions(dispatch: Dispatch<GameAction>): SimpleDispatchActions {
  const storage = useStorage()

  return useMemo<SimpleDispatchActions>(
    () => ({
      updatePlayer: (updates: UpdatePlayerPayload) =>
        dispatch(createUpdatePlayerAction(updates)),
      updateBand: (updates: UpdateBandPayload) =>
        dispatch(createUpdateBandAction(updates)),
      settleSoldMerch: (soldMerch: Record<string, number>) =>
        dispatch(createSettleSoldMerchAction(soldMerch)),
      recordPendingGigSettlement: settlement => {
        const action = createRecordPendingGigSettlementAction(settlement)
        if (action) dispatch(action)
      },
      clearPendingGigSettlement: (id: string) =>
        dispatch(createClearPendingGigSettlementAction(id)),
      toggleNeuroDecimator: isActive =>
        dispatch(createToggleNeuroDecimatorAction(isActive)),
      holdBandMeeting: () => dispatch(createHoldBandMeetingAction()),
      restockMerch: (merchKey: string) =>
        dispatch(createRestockMerchAction(merchKey)),
      updateSocial: (
        updates:
          Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)
      ) => dispatch(createUpdateSocialAction(updates)),
      applyGigSocialReconciliation: (
        socialUpdate:
          Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>),
        settlementId?: string | null
      ) =>
        dispatch(
          createApplyGigSocialReconciliationAction(socialUpdate, settlementId)
        ),
      setGameMap: mapData => dispatch(createSetMapAction(mapData)),
      setCurrentGig: gig => dispatch(createSetGigAction(gig)),
      startGig: gig =>
        startTransition(() => dispatch(createStartGigAction(gig))),
      setSetlist: list => dispatch(createSetSetlistAction(list)),
      setLastGigStats: stats => dispatch(createSetLastGigStatsAction(stats)),
      removeToast: id => dispatch(createRemoveToastAction(id)),
      setGigModifiers: modifiers =>
        dispatch(createSetGigModifiersAction(modifiers)),
      consumeItem: itemId => dispatch(createConsumeItemAction(itemId)),
      unlockTrait: (memberId, traitId) =>
        dispatch(createUnlockTraitAction(memberId, traitId)),
      setPendingBandHQOpen: isOpen =>
        dispatch(createSetPendingBandHQOpenAction(isOpen)),
      setPendingSupplyStopInventory: inventory =>
        dispatch(createSetPendingSupplyStopInventoryAction(inventory)),
      dismissForeclosureNotice: kind =>
        dispatch(dismissForeclosureNoticeAction(kind)),
      setPendingRiskEvent: event => {
        const action = createSetPendingRiskEventAction(event)
        if (action) dispatch(action)
      },
      updateSettings: (updates: Record<string, unknown>) => {
        dispatch(createUpdateSettingsAction(updates))

        const sanitizedUpdates = sanitizeSettingsPayload(updates)

        if (updates.logLevel !== undefined) {
          const { logLevel } = sanitizedUpdates
          if (logLevel !== undefined) {
            logger.setLevel(logLevel)
          } else {
            logger.warn(
              'GameState',
              'Rejected persisted invalid logLevel update',
              updates.logLevel
            )
          }
        }

        safeStorageOperation('saveGlobalSettings', () => {
          writeGlobalSettings(
            {
              ...readGlobalSettings(storage),
              ...sanitizedUpdates
            },
            storage
          )
        })
      }
    }),
    [dispatch, storage]
  )
}
