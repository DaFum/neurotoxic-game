import type { QuestDefinition } from '../types/quest'
import {
  quest_prove_yourself,
  quest_apology_tour,
  quest_ego_management,
  quest_pick_of_destiny,
  quest_viral_dance,
  quest_sponsor_demand,
  quest_harmony_project,
  quest_tourbus_inspection,
  quest_studio_demo,
  quest_merch_rush,
  quest_venue_residency,
  quest_region_takeover,
  quest_drama_post,
  quest_premium_endorsement,
  quest_community_outreach,
  quest_back_from_pit,
  quest_sincere_redemption,
  quest_band_pact,
  quest_local_legend,
  quest_flawless_run,
  quest_sticky_fingers,
  quest_special_delivery,
  quest_persona_non_grata,
  quest_murphys_law,
  quest_crisis_manager,
  quest_chapter_marker,
  quest_payday,
  quest_make_amends,
  quest_burned_bridges,
  quest_venue_regular,
  quest_brand_ambassador,
  quest_alchemist
} from './quests'

/**
 * Static quest configuration registry keyed by stable quest id.
 */
export const QUEST_REGISTRY = {
  quest_prove_yourself,
  quest_apology_tour,
  quest_ego_management,
  quest_pick_of_destiny,
  quest_viral_dance,
  quest_sponsor_demand,
  quest_harmony_project,
  quest_tourbus_inspection,
  quest_studio_demo,
  quest_merch_rush,
  quest_venue_residency,
  quest_region_takeover,
  quest_drama_post,
  quest_premium_endorsement,
  quest_community_outreach,
  quest_back_from_pit,
  quest_sincere_redemption,
  quest_band_pact,
  quest_local_legend,
  quest_flawless_run,
  quest_sticky_fingers,
  quest_special_delivery,
  quest_persona_non_grata,
  quest_murphys_law,
  quest_crisis_manager,
  quest_chapter_marker,
  quest_payday,
  quest_make_amends,
  quest_burned_bridges,
  quest_venue_regular,
  quest_brand_ambassador,
  quest_alchemist
} as const satisfies Record<string, QuestDefinition>

/**
 * Looks up a quest's static definition by id. Returns `undefined` for unknown
 * ids so callers can fall back to inline payloads.
 */
const isQuestRegistryId = (
  questId: string
): questId is keyof typeof QUEST_REGISTRY =>
  Object.hasOwn(QUEST_REGISTRY, questId)

/**
 * Looks up a quest's static definition by id.
 */
export const getQuestDefinition = (
  questId: string
): QuestDefinition | undefined =>
  isQuestRegistryId(questId) ? QUEST_REGISTRY[questId] : undefined
