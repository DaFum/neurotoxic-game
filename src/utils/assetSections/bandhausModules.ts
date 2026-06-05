import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY, MODULE_PROMPTS } from '../assetRegistryStore'

/**
 * Bandhaus module catalogue registered into `MODULE_REGISTRY` on import.
 *
 * @remarks
 * Importing this file has the side effect of adding module definitions and
 * image prompts for the bandhaus asset section.
 */
const MODULES: readonly AssetModule[] = [
  {
    id: 'bh_pro_pa_system',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_stage',
    flavor: 'legit',
    cost: 2200,
    installCost: 200,
    removalRefundFraction: 0.4,
    boni: { trainingCostMultiplier: 0.85 },
    unlock: { minMoney: 2200 },
    imagePromptKey: 'bh_pro_pa_system'
  },
  {
    id: 'bh_salvaged_pa',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_stage',
    flavor: 'diy',
    cost: 400,
    installCost: 100,
    removalRefundFraction: 0.2,
    boni: { trainingCostMultiplier: 0.95 },
    unlock: {},
    imagePromptKey: 'bh_salvaged_pa'
  },
  {
    id: 'bh_soundproofing',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_stage',
    flavor: 'legit',
    cost: 800,
    installCost: 300,
    removalRefundFraction: 0.2,
    boni: { infightingDamper: true },
    unlock: {},
    imagePromptKey: 'bh_soundproofing'
  },
  {
    id: 'bh_bunk_beds',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_sleeping',
    flavor: 'legit',
    cost: 600,
    installCost: 100,
    removalRefundFraction: 0.4,
    boni: { staminaRegenBonusPerDay: 3 },
    unlock: {},
    imagePromptKey: 'bh_bunk_beds'
  },
  {
    id: 'bh_stocked_kitchen',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_kitchen',
    flavor: 'legit',
    cost: 900,
    installCost: 150,
    removalRefundFraction: 0.4,
    boni: { staminaRegenBonusPerDay: 2, bandMoodPerDay: 1 },
    unlock: { minMoney: 800 },
    imagePromptKey: 'bh_stocked_kitchen'
  },
  {
    id: 'bh_weed_garden',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_backyard',
    flavor: 'diy',
    cost: 300,
    installCost: 100,
    removalRefundFraction: 0.1,
    boni: { bandMoodPerDay: 2 },
    riskEventTypes: ['raid'],
    unlock: {},
    imagePromptKey: 'bh_weed_garden'
  },
  {
    id: 'bh_bouncer_dog',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_security',
    flavor: 'legit',
    cost: 500,
    installCost: 100,
    removalRefundFraction: 0.0,
    boni: { baseRiskChanceMultiplier: 0.5 },
    unlock: { minFame: 40 },
    imagePromptKey: 'bh_bouncer_dog'
  },
  {
    id: 'bh_security_cam_mesh',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_security',
    flavor: 'legit',
    cost: 800,
    installCost: 200,
    removalRefundFraction: 0.3,
    boni: { baseRiskChanceMultiplier: 0.7 },
    unlock: { minMoney: 800 },
    imagePromptKey: 'bh_security_cam_mesh'
  },
  {
    id: 'bh_wall_mural',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_identity',
    flavor: 'legit',
    cost: 0,
    installCost: 200,
    removalRefundFraction: 0.0,
    boni: { famePassivePerDay: 0.5 },
    unlock: { requiredStoryFlags: ['saved_local_venue'] },
    imagePromptKey: 'bh_wall_mural'
  },
  {
    id: 'bh_basement_bar',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_lounge',
    flavor: 'legit',
    cost: 1500,
    installCost: 300,
    removalRefundFraction: 0.3,
    boni: { baseDailyRevenueDelta: 25 },
    unlock: { minFame: 60 },
    imagePromptKey: 'bh_basement_bar'
  },
  {
    id: 'bh_hot_tub',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_lounge',
    flavor: 'legit',
    cost: 4000,
    installCost: 500,
    removalRefundFraction: 0.3,
    boni: { bandMoodPerDay: 2, infightingDamper: true },
    unlock: { minMoney: 4000 },
    imagePromptKey: 'bh_hot_tub'
  },
  {
    id: 'bh_art_sublet',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_identity',
    flavor: 'legit',
    cost: 0,
    installCost: 100,
    removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 35 },
    unlock: { minFame: 30, minScenePresence: 25 },
    imagePromptKey: 'bh_art_sublet'
  },
  {
    id: 'bh_zine_library',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_lounge',
    flavor: 'diy',
    cost: 100,
    installCost: 50,
    removalRefundFraction: 0.1,
    boni: { bandMoodPerDay: 0.5, famePassivePerDay: 0.1 },
    unlock: {},
    imagePromptKey: 'bh_zine_library'
  },
  {
    id: 'bh_vinyl_press_corner',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_secret',
    flavor: 'diy',
    cost: 3500,
    installCost: 400,
    removalRefundFraction: 0.3,
    boni: { merchCapacityBonus: 50, baseDailyRevenueDelta: 20 },
    unlock: { minFame: 70 },
    imagePromptKey: 'bh_vinyl_press_corner'
  },
  {
    id: 'bh_pirate_radio_antenna',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_secret',
    flavor: 'diy',
    cost: 600,
    installCost: 150,
    removalRefundFraction: 0.1,
    boni: { famePassivePerDay: 1.0 },
    riskEventTypes: ['police_check'],
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'bh_pirate_radio_antenna'
  },
  {
    id: 'bh_squat_dog',
    ownerKind: 'bandhaus_chassis',
    slotType: 'bh_security',
    flavor: 'diy',
    cost: 0,
    installCost: 0,
    removalRefundFraction: 0.0,
    boni: { baseRiskChanceMultiplier: 0.7 },
    unlock: {},
    imagePromptKey: 'bh_squat_dog'
  }
]

const PROMPTS: Record<string, string> = {
  bh_pro_pa_system:
    'pixel art professional PA system stack stage rehearsal room',
  bh_salvaged_pa:
    'pixel art salvaged PA system mismatched speakers diy rehearsal',
  bh_soundproofing:
    'pixel art soundproofing foam wall thick padding band practice',
  bh_bunk_beds: 'pixel art bunk beds 4 berths punk band sleeping room',
  bh_stocked_kitchen: 'pixel art stocked band kitchen fridge full beer snacks',
  bh_weed_garden:
    'pixel art indoor weed garden hydroponics secret room green glow',
  bh_bouncer_dog: 'pixel art big mean bouncer dog guarding band house entrance',
  bh_security_cam_mesh:
    'pixel art security camera mesh band house exterior surveillance',
  bh_wall_mural:
    'pixel art massive punk wall mural band house facade graffiti art',
  bh_basement_bar: 'pixel art basement bar band house lounge dim lights',
  bh_hot_tub: 'pixel art hot tub band house backyard lounge punk luxury',
  bh_art_sublet: 'pixel art art space sublet band house rentable studio room',
  bh_zine_library:
    'pixel art zine library shelf full of punk magazines lounge corner',
  bh_vinyl_press_corner:
    'pixel art small vinyl pressing machine secret basement corner',
  bh_pirate_radio_antenna:
    'pixel art pirate radio antenna rooftop band house transmitter',
  bh_squat_dog: 'pixel art scrappy squatter dog mutt guarding band house diy'
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
