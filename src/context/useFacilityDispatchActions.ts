import { useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createUnblacklistVenueAction,
  createCraftItemAction,
  createUseContrabandAction,
  createClinicHealAction,
  graftNeuroOverclock as createGraftNeuroOverclockAction,
  createClinicEnhanceAction,
  createPirateBroadcastAction,
  createDarkWebLeakAction,
  createCultIndoctrinationAction,
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
  graftNeuroOverclock: (memberId: string) => void
  clinicEnhance: (
    payload: Parameters<typeof createClinicEnhanceAction>[0]
  ) => void
  darkWebLeak: (payload: Parameters<typeof createDarkWebLeakAction>[0]) => void
  cultIndoctrination: (
    payload: Parameters<typeof createCultIndoctrinationAction>[0]
  ) => void
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
 * Creates memoized dispatch wrappers for facility-related game actions.
 *
 * @remarks
 * Every helper depends on `dispatch` alone, so all returned references are
 * stable for the provider's lifetime. Consumers rely on that stability in
 * effect dependency arrays — do not introduce a dependency on state here.
 *
 * @param dispatch - Game action dispatcher.
 * @returns Stable facility action dispatch methods.
 */
export function useFacilityDispatchActions(
  dispatch: Dispatch<GameAction>
): FacilityDispatchActions {
  return useMemo(
    () => ({
      unblacklistVenue: payload =>
        dispatch(createUnblacklistVenueAction(payload)),
      craftItem: payload => dispatch(createCraftItemAction(payload)),
      // Public action name, not a React hook.
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      useContraband: (instanceId, contrabandId, memberId) =>
        dispatch(createUseContrabandAction(instanceId, contrabandId, memberId)),
      clinicHeal: payload => dispatch(createClinicHealAction(payload)),
      graftNeuroOverclock: memberId =>
        dispatch(createGraftNeuroOverclockAction(memberId)),
      clinicEnhance: payload => dispatch(createClinicEnhanceAction(payload)),
      pirateBroadcast: payload =>
        dispatch(createPirateBroadcastAction(payload)),
      darkWebLeak: payload => dispatch(createDarkWebLeakAction(payload)),
      cultIndoctrination: payload =>
        dispatch(createCultIndoctrinationAction(payload)),
      merchPress: payload => dispatch(createMerchPressAction(payload)),
      tradeVoidItem: payload => dispatch(createTradeVoidItemAction(payload)),
      bloodBankDonate: payload => dispatch(createBloodBankDonateAction(payload))
    }),
    [dispatch]
  )
}
