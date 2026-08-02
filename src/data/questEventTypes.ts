/**
 * Canonical quest event identifiers.
 *
 * @remarks
 * Single source of truth for both the runtime membership check in
 * `src/utils/questProgress.ts` and the `QuestEventType` union in
 * `src/types/quest.d.ts`, which is derived from this tuple.
 */
export const CANONICAL_QUEST_EVENT_TYPES = [
  'gig.completed',
  'gig.good',
  'gig.smallVenueGood',
  'social.postResolved',
  'social.followersGained',
  'social.loyaltyChanged',
  'social.controversyChanged',
  'social.trendMatched',
  'brand.offerAccepted',
  'brand.dealCompleted',
  'brand.dealFailed',
  'brand.trustChanged',
  'asset.acquired',
  'asset.repaired',
  'asset.moduleInstalled',
  'asset.riskTriggered',
  'asset.riskResolved',
  'asset.conditionChanged',
  'item.collected',
  'item.used',
  'item.crafted',
  'item.delivered',
  'minigame.completed',
  'minigame.perfect',
  'minigame.failed',
  'travel.completed',
  'economy.moneyEarned',
  'fame.gained',
  'band.harmonyChanged',
  'venue.gigCompleted',
  'venue.goodGig',
  'venue.blacklisted',
  'venue.unblacklisted',
  'region.reputationChanged',
  'story.flagAdded'
] as const
