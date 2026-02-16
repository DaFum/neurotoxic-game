// Aggregate all event categories
import { TRANSPORT_EVENTS } from './transport.js'
import { BAND_EVENTS } from './band.js'
import { GIG_EVENTS } from './gig.js'
import { FINANCIAL_EVENTS } from './financial.js'
import { SPECIAL_EVENTS } from './special.js'
import { logger } from '../../utils/logger.js'

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
    if (
      !['transport', 'band', 'gig', 'financial', 'special'].includes(e.category)
    ) {
      logger.warn(
        'EventValidation',
        `Invalid Event Category in ${categoryName}: ${e.category} for event ${e.id}`
      )
    }
    return true
  })
}

export const EVENTS_DB = {
  transport: validateEvents(TRANSPORT_EVENTS, 'transport'),
  band: validateEvents(BAND_EVENTS, 'band'),
  gig: validateEvents(GIG_EVENTS, 'gig'),
  financial: validateEvents(FINANCIAL_EVENTS, 'financial'),
  special: validateEvents(SPECIAL_EVENTS, 'special')
}
