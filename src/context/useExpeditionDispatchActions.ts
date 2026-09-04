import { useMemo, type Dispatch, type MutableRefObject } from 'react'
import type { GameAction, GameState } from '../types'
import type {
  ExpeditionIntelSource,
  ExpeditionLoadout,
  ExpeditionRewardSourceType
} from '../types/expedition'
import {
  acceptExpeditionFailure as acceptExpeditionFailureAction,
  addExpeditionReward as addExpeditionRewardAction,
  advanceExpeditionRoute as advanceExpeditionRouteAction,
  completeExpedition as completeExpeditionAction,
  extractExpedition as extractExpeditionAction,
  prepareExpeditionRun as prepareExpeditionRunAction,
  prepareNextExpedition as prepareNextExpeditionAction,
  resolveExpeditionCrisis as resolveExpeditionCrisisAction,
  revealExpeditionNodeIntel as revealExpeditionNodeIntelAction,
  startExpedition as startExpeditionAction
} from './expeditionActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

/**
 * Expedition dispatch wrappers, sliced from {@link GameDispatchActions}.
 */
export type ExpeditionDispatchActions = Pick<
  GameDispatchActions,
  | 'prepareExpeditionRun'
  | 'startExpedition'
  | 'advanceExpeditionRoute'
  | 'revealExpeditionNodeIntel'
  | 'addExpeditionReward'
  | 'extractExpedition'
  | 'completeExpedition'
  | 'acceptExpeditionFailure'
  | 'prepareNextExpedition'
  | 'resolveExpeditionCrisis'
>

interface UseExpeditionDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  stateRef: MutableRefObject<GameState>
}

/**
 * Builds the memoized Expedition dispatch wrappers.
 *
 * @param props - Dispatcher and the state ref creators read their snapshot from.
 * @returns Stable Expedition dispatch methods.
 *
 * @remarks
 * Each helper reads `stateRef.current` so the snapshot a creator derives ids,
 * seeds and stale guards from is the same one the reducer validates against.
 * The two creators that can legitimately have nothing to dispatch return
 * `null`, which is skipped here rather than turned into a forged payload.
 */
export function useExpeditionDispatchActions({
  dispatch,
  stateRef
}: UseExpeditionDispatchActionsProps): ExpeditionDispatchActions {
  return useMemo(
    () => ({
      prepareExpeditionRun: () =>
        dispatch(prepareExpeditionRunAction(stateRef.current)),
      startExpedition: (loadout: ExpeditionLoadout) =>
        dispatch(startExpeditionAction(stateRef.current, loadout)),
      advanceExpeditionRoute: (nodeId: string) =>
        dispatch(advanceExpeditionRouteAction(stateRef.current, nodeId)),
      revealExpeditionNodeIntel: (input: {
        nodeId: string
        source: ExpeditionIntelSource
        grantId?: string
      }) => dispatch(revealExpeditionNodeIntelAction(stateRef.current, input)),
      addExpeditionReward: (input: {
        expectedRewardId: string
        sourceType: ExpeditionRewardSourceType
        sourceId: string
      }) => dispatch(addExpeditionRewardAction(stateRef.current, input)),
      extractExpedition: (explicitRareRewardIds: string[] = []) =>
        dispatch(
          extractExpeditionAction(stateRef.current, explicitRareRewardIds)
        ),
      completeExpedition: (finaleResultId: string) =>
        dispatch(completeExpeditionAction(stateRef.current, finaleResultId)),
      acceptExpeditionFailure: () => {
        const action = acceptExpeditionFailureAction(stateRef.current)
        if (action) dispatch(action)
      },
      prepareNextExpedition: () => {
        const action = prepareNextExpeditionAction(stateRef.current)
        if (action) dispatch(action)
      },
      resolveExpeditionCrisis: (choice: 'refuel' | 'tow') => {
        const action = resolveExpeditionCrisisAction(stateRef.current, choice)
        if (action) dispatch(action)
      }
    }),
    [dispatch, stateRef]
  )
}
