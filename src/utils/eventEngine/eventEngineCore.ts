import { selectEvent } from './eventSelection'
import { logEventError, processEvent } from './helpers'
import { checkEvent } from './checkEvent'
import { resolveChoice } from './resolveChoice'
import { processOptions } from './processOptions'
import { applyResult } from './applyResult'
import { filterEvents } from './filterEvents'

/**
 * Event engine facade for selecting, resolving, and applying game events.
 */
export const eventEngine = {
  handleError: logEventError,
  processEvent,
  checkEvent,
  resolveChoice,
  processOptions,
  applyResult,
  selectEvent,
  filterEvents
}
