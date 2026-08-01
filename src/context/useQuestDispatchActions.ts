import { useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createAddQuestAction,
  createAdvanceQuestAction,
  createApplyQuestEventAction
} from './actionCreators'

/**
 * Quest dispatch actions interface.
 */
export interface QuestDispatchActions {
  addQuest: (payload: Parameters<typeof createAddQuestAction>[0]) => void
  advanceQuest: (
    questId: Parameters<typeof createAdvanceQuestAction>[0],
    progressAmount: Parameters<typeof createAdvanceQuestAction>[1]
  ) => void
  applyQuestEvent: (
    event: Parameters<typeof createApplyQuestEventAction>[0]
  ) => void
}

/**
 * Builds the memoized quest dispatch wrappers.
 * Each helper only depends on `dispatch`.
 * @param dispatch - Game action dispatcher.
 * @returns Stable quest dispatch methods.
 */
export function useQuestDispatchActions(
  dispatch: Dispatch<GameAction>
): QuestDispatchActions {
  return useMemo(
    () => ({
      addQuest: payload => dispatch(createAddQuestAction(payload)),
      advanceQuest: (questId, progressAmount) =>
        dispatch(createAdvanceQuestAction(questId, progressAmount)),
      applyQuestEvent: event => dispatch(createApplyQuestEventAction(event))
    }),
    [dispatch]
  )
}
