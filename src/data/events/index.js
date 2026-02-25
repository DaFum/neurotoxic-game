// Aggregate all event categories
import { TRANSPORT_EVENTS } from './transport.js'
import { BAND_EVENTS } from './band.js'
import { GIG_EVENTS } from './gig.js'
import { FINANCIAL_EVENTS } from './financial.js'
import { SPECIAL_EVENTS } from './special.js'
import { CRISIS_EVENTS } from './crisis.js'
import { CONSEQUENCE_EVENTS } from './consequences.js'
import { RELATIONSHIP_EVENTS } from './relationshipEvents.js'
import { logger } from '../../utils/logger.js'

const VALID_CATEGORIES = ['transport', 'band', 'gig', 'financial', 'special']

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
    if (!VALID_CATEGORIES.includes(e.category)) {
      logger.warn(
        'EventValidation',
        `Invalid Event Category in ${categoryName}: ${e.category} for event ${e.id}`
      )
    }
    return true
  })
}

// Split crisis events into their respective category pools
const crisisBand = CRISIS_EVENTS.filter(e => e.category === 'band')
const crisisFinancial = CRISIS_EVENTS.filter(e => e.category === 'financial')
const crisisSpecial = CRISIS_EVENTS.filter(e => e.category === 'special')

// Split consequence events into their respective category pools
const consequenceBand = CONSEQUENCE_EVENTS.filter(e => e.category === 'band')
const consequenceFinancial = CONSEQUENCE_EVENTS.filter(e => e.category === 'financial')
const consequenceSpecial = CONSEQUENCE_EVENTS.filter(e => e.category === 'special')

export const EVENTS_DB = {
  transport: validateEvents(TRANSPORT_EVENTS, 'transport'),
  band: validateEvents([...BAND_EVENTS, ...crisisBand, ...consequenceBand, ...RELATIONSHIP_EVENTS], 'band'),
  gig: validateEvents(GIG_EVENTS, 'gig'),
  financial: validateEvents([...FINANCIAL_EVENTS, ...crisisFinancial, ...consequenceFinancial], 'financial'),
  special: validateEvents([...SPECIAL_EVENTS, ...crisisSpecial, ...consequenceSpecial], 'special')
}
