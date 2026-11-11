import type { QuestEvent } from '../../types'
import { sanitizeStringArray } from '../../utils/gameState'

/**
 * Creates a `venue.gigCompleted` quest event for a venue gig.
 */
export const createVenueGigCompletedQuestEvent = ({
  venueId,
  region,
  score,
  capacity,
  accuracy,
  failed
}: {
  venueId: string
  region: string
  score: number
  capacity?: number
  accuracy?: number
  failed?: boolean
}): QuestEvent => ({
  type: 'venue.gigCompleted',
  amount: 1,
  success: failed !== true,
  context: {
    venueId,
    region,
    score,
    ...(capacity !== undefined && { capacity }),
    ...(accuracy !== undefined && { accuracy }),
    ...(failed !== undefined && { failed })
  },
  tags: [venueId, region]
})

/**
 * Creates a `venue.goodGig` quest event for a strong venue performance.
 */
export const createVenueGoodGigQuestEvent = ({
  venueId,
  region,
  score,
  capacity,
  accuracy,
  failed
}: {
  venueId: string
  region: string
  score: number
  capacity?: number
  accuracy?: number
  failed?: boolean
}): QuestEvent => ({
  type: 'venue.goodGig',
  amount: 1,
  success: failed !== true,
  context: {
    venueId,
    region,
    score,
    ...(capacity !== undefined && { capacity }),
    ...(accuracy !== undefined && { accuracy }),
    ...(failed !== undefined && { failed })
  },
  tags: [venueId, region]
})

/**
 * Creates a `region.reputationChanged` quest event for regional reputation deltas.
 */
export const createRegionReputationChangedQuestEvent = ({
  region,
  amount,
  reason
}: {
  region: string
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'region.reputationChanged',
  amount,
  success: amount >= 0,
  context: { region, reason },
  tags: sanitizeStringArray([region, reason])
})

/**
 * Creates a `venue.blacklisted` quest event for venue blacklisting.
 */
export const createVenueBlacklistedQuestEvent = ({
  venueId,
  reason
}: {
  venueId: string
  reason: string
}): QuestEvent => ({
  type: 'venue.blacklisted',
  amount: 1,
  success: false,
  context: { venueId, reason },
  tags: [venueId, reason]
})

/**
 * Creates a `venue.unblacklisted` quest event for removing a blacklist.
 */
export const createVenueUnblacklistedQuestEvent = ({
  venueId,
  reason
}: {
  venueId: string
  reason: string
}): QuestEvent => ({
  type: 'venue.unblacklisted',
  amount: 1,
  success: true,
  context: { venueId, reason },
  tags: [venueId, reason]
})
