import type { QuestEventType, QuestProgressSource } from '../types/quest'

/**
 * Legacy `progressSource` identifiers mapped to their canonical quest event.
 *
 * @remarks
 * Single source of truth for the runtime normalization in
 * `src/utils/questProgress.ts` and the admission check in
 * `src/domain/questValidation.ts`. It lives in `data/` because the validator
 * cannot import the progress engine: that module pulls in the quest lifecycle,
 * which the validator is part of.
 */
export const LEGACY_QUEST_EVENT_TYPES: Record<
  QuestProgressSource,
  QuestEventType
> = {
  gig_completed: 'gig.completed',
  good_gig: 'gig.good',
  small_venue_good_gig: 'gig.smallVenueGood',
  social_post: 'social.postResolved',
  followers_gained: 'social.followersGained',
  fame_gained: 'fame.gained',
  money_earned: 'economy.moneyEarned',
  harmony_recovered: 'band.harmonyChanged',
  item_collected: 'item.collected',
  item_delivered: 'item.delivered',
  item_crafted: 'item.crafted',
  brand_deal_completed: 'brand.dealCompleted',
  brand_deal_failed: 'brand.dealFailed',
  brand_trust_changed: 'brand.trustChanged',
  travel_completed: 'travel.completed',
  minigame_perfected: 'minigame.perfect',
  asset_risk_triggered: 'asset.riskTriggered',
  asset_risk_resolved: 'asset.riskResolved',
  venue_blacklisted: 'venue.blacklisted',
  venue_unblacklisted: 'venue.unblacklisted',
  region_reputation_changed: 'region.reputationChanged',
  story_flag_added: 'story.flagAdded'
}

/** Legacy `progressSource` names accepted by quest rules. */
export const QUEST_PROGRESS_SOURCES: ReadonlySet<string> = new Set(
  Object.keys(LEGACY_QUEST_EVENT_TYPES)
)
