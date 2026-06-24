import type { QuestDefinition } from '../types/quest'
import { quest_prove_yourself } from './quests/quest_prove_yourself'
import { quest_apology_tour } from './quests/quest_apology_tour'
import { quest_ego_management } from './quests/quest_ego_management'
import { quest_pick_of_destiny } from './quests/quest_pick_of_destiny'
import { quest_viral_dance } from './quests/quest_viral_dance'
import { quest_sponsor_demand } from './quests/quest_sponsor_demand'
import { quest_harmony_project } from './quests/quest_harmony_project'
import { quest_tourbus_inspection } from './quests/quest_tourbus_inspection'
import { quest_studio_demo } from './quests/quest_studio_demo'
import { quest_merch_rush } from './quests/quest_merch_rush'
import { quest_venue_residency } from './quests/quest_venue_residency'
import { quest_region_takeover } from './quests/quest_region_takeover'
import { quest_drama_post } from './quests/quest_drama_post'
import { quest_premium_endorsement } from './quests/quest_premium_endorsement'
import { quest_community_outreach } from './quests/quest_community_outreach'
import { quest_back_from_pit } from './quests/quest_back_from_pit'
import { quest_sincere_redemption } from './quests/quest_sincere_redemption'
import { quest_band_pact } from './quests/quest_band_pact'
import { quest_local_legend } from './quests/quest_local_legend'
import { quest_flawless_run } from './quests/quest_flawless_run'
import { quest_sticky_fingers } from './quests/quest_sticky_fingers'
import { quest_special_delivery } from './quests/quest_special_delivery'
import { quest_persona_non_grata } from './quests/quest_persona_non_grata'
import { quest_murphys_law } from './quests/quest_murphys_law'
import { quest_crisis_manager } from './quests/quest_crisis_manager'
import { quest_chapter_marker } from './quests/quest_chapter_marker'
import { quest_payday } from './quests/quest_payday'
import { quest_make_amends } from './quests/quest_make_amends'
import { quest_burned_bridges } from './quests/quest_burned_bridges'
import { quest_venue_regular } from './quests/quest_venue_regular'
import { quest_brand_ambassador } from './quests/quest_brand_ambassador'
import { quest_alchemist } from './quests/quest_alchemist'

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
export const isQuestRegistryId = (
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
