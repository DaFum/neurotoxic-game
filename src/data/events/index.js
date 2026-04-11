// TODO: Review this file
// Aggregate all event categories
import { TRANSPORT_EVENTS } from './transport.js'
import { BAND_EVENTS } from './band.js'
import { GIG_EVENTS } from './gig.js'
import { FINANCIAL_EVENTS } from './financial.js'
import { SPECIAL_EVENTS } from './special.js'
import { CRISIS_EVENTS } from './crisis.js'
import { CONSEQUENCE_EVENTS } from './consequences.js'
import { RELATIONSHIP_EVENTS } from './relationshipEvents.js'
import { QUEST_EVENTS } from './quests.js'
import { logger } from '../../utils/logger.js'

const VALID_CATEGORIES = new Set([
  'transport',
  'band',
  'gig',
  'financial',
  'special'
])

// Validation Helper
const validateEvents = (events, categoryName = 'unknown') => {
  const ids = new Set()
  return events.filter(e => {
    if (!e.id) {
      logger.error('EventValidation', `Event missing ID in ${categoryName}`, e)
      return false
    }
    if (ids.has(e.id)) {
      logger.error(
        'EventValidation',
        `Duplicate Event ID in ${categoryName}: ${e.id}`
      )
      return false
    }
    ids.add(e.id)
    if (!VALID_CATEGORIES.has(e.category)) {
      logger.error(
        'EventValidation',
        `Invalid Event Category in ${categoryName}: ${e.category} for event ${e.id}`
      )
      return false
    }
    return true
  })
}

const categorizeEvents = events => {
  const result = { band: [], financial: [], special: [] }

  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    if (Object.hasOwn(result, e.category)) {
      result[e.category].push(e)
    } else {
      logger.error('EventCategorization', `Event ${e.id || 'unknown'} has invalid or unhandled category: ${e.category}`)
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
