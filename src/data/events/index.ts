/**
 * Architecture (Event Registry):
 * This module is the single declarative source of truth for aggregating and routing game events.
 * It strictly flattens, validates (e.g. checking uniqueness and validity of categories), and routes
 * all raw event definitions into `EVENTS_DB`. New domain events should be added to the raw arrays
 * and let this registry handle the implicit merge, avoiding manual array merging across the codebase.
 */
import type { UnknownRecord } from '../../types'
import { TRANSPORT_EVENTS } from './transport'
import { BAND_EVENTS } from './band'
import { GIG_EVENTS } from './gig'
import { FINANCIAL_EVENTS } from './financial'
import { SPECIAL_EVENTS } from './special'
import { CRISIS_EVENTS } from './crisis'
import { CONSEQUENCE_EVENTS } from './consequences'
import { RELATIONSHIP_EVENTS } from './relationshipEvents'
import { QUEST_EVENTS } from './quests'
import { logger } from '../../utils/logger'
import { validateGameEvent } from '../../utils/eventValidator'
import { EVENT_CATEGORIES, type EventCategory } from './categories'

export { EVENT_CATEGORIES, type EventCategory } from './categories'

const VALID_CATEGORIES = new Set<EventCategory>(EVENT_CATEGORIES)

// Aggregate all raw event definitions from their domain files
export const ALL_RAW_EVENTS = [
  ...TRANSPORT_EVENTS,
  ...BAND_EVENTS,
  ...GIG_EVENTS,
  ...FINANCIAL_EVENTS,
  ...SPECIAL_EVENTS,
  ...CRISIS_EVENTS,
  ...CONSEQUENCE_EVENTS,
  ...RELATIONSHIP_EVENTS,
  ...QUEST_EVENTS
]

// The final registry of playable events
export const EVENTS_DB = Object.fromEntries(
  EVENT_CATEGORIES.map(cat => [cat, [] as UnknownRecord[]])
) as Record<EventCategory, UnknownRecord[]>

const seenIds = new Set<string>()

// Single validation and routing pass
for (let i = 0; i < ALL_RAW_EVENTS.length; i++) {
  const e = ALL_RAW_EVENTS[i]

  if (!e || typeof e !== 'object' || Array.isArray(e)) {
    logger.error('EventValidation', 'Event must be an object', e)
    continue
  }

  const eObj = e as Record<string, unknown>

  if (typeof eObj.id !== 'string' || eObj.id.trim() === '') {
    logger.error('EventValidation', 'Event missing ID', e)
    continue
  }

  if (typeof eObj.category !== 'string') {
    logger.error('EventValidation', `Event missing category: ${eObj.id}`, e)
    continue
  }

  if (seenIds.has(eObj.id)) {
    logger.error('EventValidation', `Duplicate Event ID: ${eObj.id}`)
    continue
  }

  seenIds.add(eObj.id)

  const category = eObj.category as EventCategory

  if (!VALID_CATEGORIES.has(category)) {
    logger.error(
      'EventValidation',
      `Invalid Event Category: ${category} for event ${eObj.id}`,
      e
    )
    continue
  }

  try {
    validateGameEvent(eObj)
  } catch (err) {
    logger.error(
      'EventValidation',
      `Event "${eObj.id}" failed schema validation`,
      err instanceof Error ? err.message : err
    )
    continue
  }

  EVENTS_DB[category].push(eObj as UnknownRecord)
}
