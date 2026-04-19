// TODO: Review this file
// Aggregate all event categories
import type { UnknownRecord } from '../../types/game'
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

const VALID_CATEGORIES = new Set([
  'transport',
  'band',
  'gig',
  'financial',
  'special'
])

// Validation Helper
const validateEvents = (
  events: unknown[],
  categoryName = 'unknown'
): UnknownRecord[] => {
  const ids = new Set()
  return events.filter((e: unknown) => {
    const eObj =
      typeof e === 'object' && e !== null ? (e as Record<string, unknown>) : {}
    if (!eObj.id) {
      logger.error('EventValidation', `Event missing ID in ${categoryName}`, e)
      return false
    }
    if (ids.has(eObj.id)) {
      logger.error(
        'EventValidation',
        `Duplicate Event ID in ${categoryName}: ${eObj.id}`
      )
      return false
    }
    ids.add(eObj.id)
    if (!VALID_CATEGORIES.has(eObj.category as string)) {
      logger.error(
        'EventValidation',
        `Invalid Event Category in ${categoryName}: ${eObj.category} for event ${eObj.id}`
      )
      return false
    }
    return true
  }) as UnknownRecord[]
}

const categorizeEvents = (
  events: UnknownRecord[]
): {
  band: UnknownRecord[]
  financial: UnknownRecord[]
  special: UnknownRecord[]
} => {
  const result: {
    band: UnknownRecord[]
    financial: UnknownRecord[]
    special: UnknownRecord[]
  } = {
    band: [],
    financial: [],
    special: []
  }

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    if (!e) continue
    const category = typeof e.category === 'string' ? e.category : 'unknown'
    if (Object.hasOwn(result, category) && category in result) {
      result[category as keyof typeof result].push(e)
    } else {
      logger.error(
        'EventCategorization',
        `Event ${e.id || 'unknown'} has invalid or unhandled category: ${category}`,
        e
      )
    }
  }

  return result
}

// Split crisis events into their respective category pools
const {
  band: crisisBand,
  financial: crisisFinancial,
  special: crisisSpecial
} = categorizeEvents(CRISIS_EVENTS)

// Split quest events into their respective category pools
const {
  band: questBand,
  financial: questFinancial,
  special: questSpecial
} = categorizeEvents(QUEST_EVENTS)

// Split consequence events into their respective category pools
const {
  band: consequenceBand,
  financial: consequenceFinancial,
  special: consequenceSpecial
} = categorizeEvents(CONSEQUENCE_EVENTS)

export const EVENTS_DB = {
  transport: validateEvents(TRANSPORT_EVENTS, 'transport'),
  band: validateEvents(
    [
      ...BAND_EVENTS,
      ...crisisBand,
      ...consequenceBand,
      ...questBand,
      ...RELATIONSHIP_EVENTS
    ],
    'band'
  ),
  gig: validateEvents(GIG_EVENTS, 'gig'),
  financial: validateEvents(
    [
      ...FINANCIAL_EVENTS,
      ...crisisFinancial,
      ...consequenceFinancial,
      ...questFinancial
    ],
    'financial'
  ),
  special: validateEvents(
    [
      ...SPECIAL_EVENTS,
      ...crisisSpecial,
      ...consequenceSpecial,
      ...questSpecial
    ],
    'special'
  )
}
