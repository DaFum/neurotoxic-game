import type { QuestEvent } from '../../types'

/**
 * Shared context input for gig-related quest events.
 */
export interface GigQuestEventInput {
  score: number
  capacity: number
  venueId: string
  region: string
}

const createGigEvent = (
  type: QuestEvent['type'],
  input: GigQuestEventInput
): QuestEvent => ({
  type,
  amount: 1,
  success: true,
  context: {
    score: input.score,
    capacity: input.capacity,
    venueId: input.venueId,
    region: input.region
  }
})

/**
 * Creates a `gig.completed` quest event for any completed gig.
 */
export const createGigCompletedQuestEvent = (
  input: GigQuestEventInput
): QuestEvent => createGigEvent('gig.completed', input)

/**
 * Creates a `gig.good` quest event for gigs meeting good-performance criteria.
 */
export const createGoodGigQuestEvent = (
  input: GigQuestEventInput
): QuestEvent => createGigEvent('gig.good', input)

/**
 * Creates a `gig.smallVenueGood` quest event for strong small-venue gigs.
 */
export const createSmallVenueGoodQuestEvent = (
  input: GigQuestEventInput
): QuestEvent => createGigEvent('gig.smallVenueGood', input)

/**
 * Creates a `band.harmonyChanged` quest event with resulting harmony context.
 */
export const createHarmonyChangedQuestEvent = ({
  amount,
  newHarmony
}: {
  amount: number
  newHarmony: number
}): QuestEvent => ({
  type: 'band.harmonyChanged',
  amount,
  success: true,
  context: { harmony: newHarmony }
})
