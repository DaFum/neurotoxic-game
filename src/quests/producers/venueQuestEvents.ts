import type { QuestEvent } from '../../types'

/**
 * Creates a `venue.gigCompleted` quest event for a venue gig.
 */
export const createVenueGigCompletedQuestEvent = ({
  venueId,
  region,
  score
}: {
  venueId: string
  region: string
  score: number
}): QuestEvent => ({
  type: 'venue.gigCompleted',
  amount: 1,
  success: true,
  context: { venueId, region, score },
  tags: [venueId, region]
})

/**
 * Creates a `venue.goodGig` quest event for a strong venue performance.
 */
export const createVenueGoodGigQuestEvent = ({
  venueId,
  region,
  score,
  capacity
}: {
  venueId: string
  region: string
  score: number
  capacity?: number
}): QuestEvent => ({
  type: 'venue.goodGig',
  amount: 1,
  success: true,
  context: { venueId, region, score, capacity },
  tags: [venueId, region]
})

/**
 * Creates a `venue.reputationChanged` quest event for venue reputation deltas.
 */
export const createVenueReputationChangedQuestEvent = ({
  venueId,
  amount,
  reason
}: {
  venueId: string
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'venue.reputationChanged',
  amount,
  success: amount >= 0,
  context: { venueId, reason },
  tags: [venueId, reason].filter(
    (entry): entry is string => typeof entry === 'string'
  )
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
  tags: [region, reason].filter(
    (entry): entry is string => typeof entry === 'string'
  )
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
