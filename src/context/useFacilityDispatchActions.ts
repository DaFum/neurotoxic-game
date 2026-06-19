import { useCallback, useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createUnblacklistVenueAction,
  createCraftItemAction,
  createUseContrabandAction,
  createClinicHealAction,
  createClinicEnhanceAction,
  createPirateBroadcastAction,
  createDarkWebLeakAction,
  createMerchPressAction,
  createTradeVoidItemAction,
  createBloodBankDonateAction
} from './actionCreators'

/**
 * Facility dispatch actions interface.
 */
export interface FacilityDispatchActions {
  unblacklistVenue: (
    payload: Parameters<typeof createUnblacklistVenueAction>[0]
  ) => void
  craftItem: (payload: Parameters<typeof createCraftItemAction>[0]) => void
  useContraband: (
    instanceId: Parameters<typeof createUseContrabandAction>[0],
    contrabandId: Parameters<typeof createUseContrabandAction>[1],
    memberId?: Parameters<typeof createUseContrabandAction>[2]
  ) => void
  clinicHeal: (payload: Parameters<typeof createClinicHealAction>[0]) => void
  clinicEnhance: (
    payload: Parameters<typeof createClinicEnhanceAction>[0]
  ) => void
  darkWebLeak: (payload: Parameters<typeof createDarkWebLeakAction>[0]) => void
  pirateBroadcast: (
    payload: Parameters<typeof createPirateBroadcastAction>[0]
  ) => void
  merchPress: (payload: Parameters<typeof createMerchPressAction>[0]) => void
  tradeVoidItem: (
    payload: Parameters<typeof createTradeVoidItemAction>[0]
  ) => void
  bloodBankDonate: (
    payload: Parameters<typeof createBloodBankDonateAction>[0]
  ) => void
}

/**
 * Builds the memoized facility dispatch wrappers.
 * Each helper only depends on `dispatch`.
 * @param dispatch - Game action dispatcher.
 * @returns Stable facility dispatch methods.
 */
export function useFacilityDispatchActions(
  dispatch: Dispatch<GameAction>
): FacilityDispatchActions {
  const unblacklistVenue = useCallback(
    (payload: Parameters<typeof createUnblacklistVenueAction>[0]) =>
      dispatch(createUnblacklistVenueAction(payload)),
    [dispatch]
  )

  const craftItem = useCallback(
    (payload: Parameters<typeof createCraftItemAction>[0]) =>
      dispatch(createCraftItemAction(payload)),
    [dispatch]
  )

  const useContraband = useCallback(
    (
      instanceId: Parameters<typeof createUseContrabandAction>[0],
      contrabandId: Parameters<typeof createUseContrabandAction>[1],
      memberId?: Parameters<typeof createUseContrabandAction>[2]
    ) =>
      dispatch(createUseContrabandAction(instanceId, contrabandId, memberId)),
    [dispatch]
  )

  const clinicHeal = useCallback(
    (payload: Parameters<typeof createClinicHealAction>[0]) =>
      dispatch(createClinicHealAction(payload)),
    [dispatch]
  )

  const clinicEnhance = useCallback(
    (payload: Parameters<typeof createClinicEnhanceAction>[0]) =>
      dispatch(createClinicEnhanceAction(payload)),
    [dispatch]
  )

  const pirateBroadcast = useCallback(
    (payload: Parameters<typeof createPirateBroadcastAction>[0]) =>
      dispatch(createPirateBroadcastAction(payload)),
    [dispatch]
  )

  const darkWebLeak = useCallback(
    (payload: Parameters<typeof createDarkWebLeakAction>[0]) =>
      dispatch(createDarkWebLeakAction(payload)),
    [dispatch]
  )

  const merchPress = useCallback(
    (payload: Parameters<typeof createMerchPressAction>[0]) =>
      dispatch(createMerchPressAction(payload)),
    [dispatch]
  )

  const tradeVoidItem = useCallback(
    (payload: Parameters<typeof createTradeVoidItemAction>[0]) =>
      dispatch(createTradeVoidItemAction(payload)),
    [dispatch]
  )

  const bloodBankDonate = useCallback(
    (payload: Parameters<typeof createBloodBankDonateAction>[0]) =>
      dispatch(createBloodBankDonateAction(payload)),
    [dispatch]
  )

  return useMemo(
    () => ({
      unblacklistVenue,
      craftItem,
      useContraband,
      clinicHeal,
      clinicEnhance,
      pirateBroadcast,
      darkWebLeak,
      merchPress,
      tradeVoidItem,
      bloodBankDonate
    }),
    [
      unblacklistVenue,
      craftItem,
      useContraband,
      clinicHeal,
      clinicEnhance,
      pirateBroadcast,
      darkWebLeak,
      merchPress,
      tradeVoidItem,
      bloodBankDonate
    ]
  )
}
