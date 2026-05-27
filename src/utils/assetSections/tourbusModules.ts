import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY, MODULE_PROMPTS } from '../assetRegistryStore'

const MODULES: readonly AssetModule[] = [
  {
    id: 'tb_solar_panel',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 1200,
    installCost: 100,
    removalRefundFraction: 0.4,
    boni: { fuelMultiplier: 0.85 },
    unlock: { minFame: 30 },
    imagePromptKey: 'tb_solar_panel'
  },
  {
    id: 'tb_roof_rack',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 400,
    installCost: 50,
    removalRefundFraction: 0.5,
    boni: { merchCapacityBonus: 30 },
    unlock: {},
    imagePromptKey: 'tb_roof_rack'
  },
  {
    id: 'tb_subwoofer_stack',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_audio',
    flavor: 'diy',
    cost: 800,
    installCost: 100,
    removalRefundFraction: 0.3,
    boni: { tipBonusGigs: 0.1 },
    unlock: { minFame: 20 },
    exclusiveWithGroup: 'tb_power_hog',
    imagePromptKey: 'tb_subwoofer_stack'
  },
  {
    id: 'tb_vintage_stereo',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_audio',
    flavor: 'legit',
    cost: 600,
    installCost: 50,
    removalRefundFraction: 0.5,
    boni: { bandMoodPerDay: 2 },
    unlock: { requiredStoryFlags: ['found_record_collection'] },
    imagePromptKey: 'tb_vintage_stereo'
  },
  {
    id: 'tb_alloy_rims',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_decal',
    flavor: 'legit',
    cost: 1500,
    installCost: 200,
    removalRefundFraction: 0.4,
    boni: { famePassivePerDay: 0.5 },
    unlock: { minMoney: 1500 },
    imagePromptKey: 'tb_alloy_rims'
  },
  {
    id: 'tb_fox_tail',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_decal',
    flavor: 'diy',
    cost: 30,
    installCost: 0,
    removalRefundFraction: 0.0,
    boni: { famePassivePerDay: 0.2 },
    unlock: { minFame: 10 },
    imagePromptKey: 'tb_fox_tail'
  },
  {
    id: 'tb_neon_underglow',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_decal',
    flavor: 'diy',
    cost: 200,
    installCost: 50,
    removalRefundFraction: 0.3,
    boni: { famePassivePerDay: 0.4 },
    unlock: { requiredStoryFlags: ['underground_show'] },
    imagePromptKey: 'tb_neon_underglow'
  },
  {
    id: 'tb_racing_seats',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_interior_driver',
    flavor: 'legit',
    cost: 900,
    installCost: 100,
    removalRefundFraction: 0.4,
    boni: { staminaRegenBonusPerDay: 3 },
    unlock: {},
    imagePromptKey: 'tb_racing_seats'
  },
  {
    id: 'tb_sleeping_bunks',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_interior_cabin',
    flavor: 'legit',
    cost: 700,
    installCost: 150,
    removalRefundFraction: 0.5,
    boni: { travelStaminaRegen: 5 },
    unlock: { minChassisTier: 2 },
    imagePromptKey: 'tb_sleeping_bunks'
  },
  {
    id: 'tb_mini_fridge',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_interior_cabin',
    flavor: 'legit',
    cost: 250,
    installCost: 30,
    removalRefundFraction: 0.5,
    boni: { bandMoodPerDay: 1 },
    unlock: { minMoney: 600 },
    imagePromptKey: 'tb_mini_fridge'
  },
  {
    id: 'tb_espresso_machine',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_interior_cabin',
    flavor: 'legit',
    cost: 350,
    installCost: 40,
    removalRefundFraction: 0.5,
    boni: { travelStaminaRegen: 3 },
    unlock: { requiredMemberSkill: { skill: 'charisma', tier: 1 } },
    imagePromptKey: 'tb_espresso_machine'
  },
  {
    id: 'tb_cb_radio_mesh',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_front',
    flavor: 'legit',
    cost: 200,
    installCost: 40,
    removalRefundFraction: 0.4,
    boni: { fuelMultiplier: 0.95 },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 1 } },
    imagePromptKey: 'tb_cb_radio_mesh'
  },
  {
    id: 'tb_gps_jammer',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_front',
    flavor: 'diy',
    cost: 400,
    installCost: 80,
    removalRefundFraction: 0.2,
    boni: { diyRiskMultiplier: 0.5 },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 3 } },
    imagePromptKey: 'tb_gps_jammer'
  },
  {
    id: 'tb_trailer_hitch',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_trailer_mount',
    flavor: 'legit',
    cost: 1500,
    installCost: 200,
    removalRefundFraction: 0.4,
    boni: { merchCapacityBonus: 50 },
    addsSlots: [{ slotType: 'tb_trailer_addon', count: 2 }],
    maxPerAsset: 1,
    unlock: { minFame: 40, minChassisTier: 3 },
    imagePromptKey: 'tb_trailer_hitch'
  },
  {
    id: 'tb_fake_police_lights',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_front',
    flavor: 'diy',
    cost: 150,
    installCost: 30,
    removalRefundFraction: 0.2,
    boni: { tipBonusGigs: 0.05 },
    riskEventTypes: ['police_check'],
    unlock: { minFame: 30 },
    imagePromptKey: 'tb_fake_police_lights'
  },
  {
    id: 'tb_smoke_screen',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_front',
    flavor: 'diy',
    cost: 350,
    installCost: 60,
    removalRefundFraction: 0.3,
    boni: { reducesTheftRiskTravel: true },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'tb_smoke_screen'
  },
  {
    id: 'tb_side_graphics',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_side',
    flavor: 'legit',
    cost: 600,
    installCost: 100,
    removalRefundFraction: 0.3,
    boni: { famePassivePerDay: 0.3 },
    unlock: { minChassisTier: 2 },
    imagePromptKey: 'tb_side_graphics'
  }
]

const PROMPTS: Record<string, string> = {
  tb_solar_panel:
    'pixel art solar panel array mounted on tour van roof toxic green accents close-up',
  tb_roof_rack: 'pixel art roof rack with cargo box on tour van side view',
  tb_subwoofer_stack:
    'pixel art massive subwoofer speaker stack inside van punk concert gear',
  tb_vintage_stereo:
    'pixel art vintage tape deck stereo system retro tour van interior',
  tb_alloy_rims: 'pixel art shiny chrome alloy rims on tour van close-up',
  tb_fox_tail:
    'pixel art fox tail antenna decoration on van side mirror trashy charm',
  tb_neon_underglow:
    'pixel art neon underglow toxic green light beneath tour van night scene',
  tb_racing_seats: 'pixel art racing bucket seats tour van driver cockpit',
  tb_sleeping_bunks: 'pixel art sleeping bunks tour van interior cozy beds',
  tb_mini_fridge: 'pixel art mini fridge with beer in tour van interior',
  tb_espresso_machine:
    'pixel art espresso machine on tour van counter coffee steam',
  tb_cb_radio_mesh:
    'pixel art CB radio dashboard with route map tour van front',
  tb_gps_jammer:
    'pixel art smuggled russian GPS jammer device blinking lights diy',
  tb_trailer_hitch:
    'pixel art tour van with trailer hitch and small trailer attached side view',
  tb_fake_police_lights:
    'pixel art tour van with fake police lights on top suspicious diy',
  tb_smoke_screen:
    'pixel art tour van smoke screen ejection device fleeing scene',
  tb_side_graphics:
    'pixel art tour van side panel with large band logo and graphics paint job'
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
