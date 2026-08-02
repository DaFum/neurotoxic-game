/**
 * Routes a hostile payload case to the parser boundary it targets.
 *
 * Runner-agnostic on purpose: both fuzz suites import it. Exceptions are not
 * caught here — the suites assert that none escape.
 */
import { createInitialState } from '../../src/context/initialState'
import { handleApplyEventDelta } from '../../src/context/reducers/eventReducer'
import { addQuest } from '../../src/domain/questAdd'
import { advanceQuest, setQuestProgress } from '../../src/domain/questAdvance'
import { VALID_QUEST } from './hostilePayloadCases'

/**
 * Builds a state that already carries the valid baseline quest, so the
 * advance/progress boundaries have something to resolve against.
 *
 * @returns {object} Fresh state with one active quest.
 */
const stateWithQuest = () => addQuest(createInitialState(), { ...VALID_QUEST })

/**
 * Drives one hostile case through its boundary.
 *
 * @param {{boundary: string, payload: unknown}} testCase - Case to run.
 * @returns {object} Resulting game state.
 * @throws Whatever the boundary throws — deliberately not swallowed.
 */
export const driveHostileCase = testCase => {
  switch (testCase.boundary) {
    case 'event-delta':
      return handleApplyEventDelta(createInitialState(), testCase.payload)
    case 'quest':
      return addQuest(createInitialState(), testCase.payload)
    case 'quest-advance':
      return advanceQuest(stateWithQuest(), testCase.payload)
    case 'quest-progress':
      return setQuestProgress(stateWithQuest(), testCase.payload)
    default:
      throw new Error(`Unknown fuzz boundary: ${String(testCase.boundary)}`)
  }
}
