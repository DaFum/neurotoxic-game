import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY, MODULE_PROMPTS } from '../assetRegistryStore'

/**
 * Merch-workshop module catalogue registered into `MODULE_REGISTRY` on import.
 *
 * @remarks
 * Importing this file has the side effect of adding module definitions and
 * image prompts for the merch-workshop asset section.
 */
const MODULES: readonly AssetModule[] = [
  {
    id: 'mw_4color_carousel',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_print',
    flavor: 'legit',
    cost: 3500,
    installCost: 400,
    removalRefundFraction: 0.3,
    boni: { merchCostMultiplier: 0.75 },
    unlock: { minMoney: 3500 },
    imagePromptKey: 'mw_4color_carousel'
  },
  {
    id: 'mw_manual_press',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_print',
    flavor: 'diy',
    cost: 400,
    installCost: 80,
    removalRefundFraction: 0.2,
    boni: { merchCostMultiplier: 0.9 },
    unlock: {},
    imagePromptKey: 'mw_manual_press'
  },
  {
    id: 'mw_eco_ink_supply',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_storage',
    flavor: 'legit',
    cost: 500,
    installCost: 0,
    removalRefundFraction: 0.2,
    boni: { avgMerchSalePriceBonus: 0.03 },
    unlock: {
      minScenePresence: 40,
      requiredOtherModuleInstalled: ['mw_4color_carousel', 'mw_manual_press']
    },
    imagePromptKey: 'mw_eco_ink_supply'
  },
  {
    id: 'mw_conveyor_dryer',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_drying',
    flavor: 'legit',
    cost: 1500,
    installCost: 200,
    removalRefundFraction: 0.3,
    boni: { merchCapacityBonus: 30 },
    unlock: { minMoney: 1500 },
    imagePromptKey: 'mw_conveyor_dryer'
  },
  {
    id: 'mw_heat_press_box',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_drying',
    flavor: 'diy',
    cost: 300,
    installCost: 50,
    removalRefundFraction: 0.2,
    boni: { merchCostMultiplier: 0.95 },
    unlock: {},
    imagePromptKey: 'mw_heat_press_box'
  },
  {
    id: 'mw_vinyl_cutter',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_cutting',
    flavor: 'legit',
    cost: 1200,
    installCost: 150,
    removalRefundFraction: 0.3,
    boni: { enablesLimitedEditions: true },
    unlock: { minMoney: 1200 },
    imagePromptKey: 'mw_vinyl_cutter'
  },
  {
    id: 'mw_embroidery_machine',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_cutting',
    flavor: 'legit',
    cost: 1800,
    installCost: 200,
    removalRefundFraction: 0.3,
    boni: { avgMerchSalePriceBonus: 0.05 },
    unlock: { minFame: 30 },
    imagePromptKey: 'mw_embroidery_machine'
  },
  {
    id: 'mw_badge_press',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_specialty',
    flavor: 'legit',
    cost: 400,
    installCost: 50,
    removalRefundFraction: 0.3,
    boni: { avgMerchSalePriceBonus: 0.03 },
    unlock: {},
    imagePromptKey: 'mw_badge_press'
  },
  {
    id: 'mw_hot_foil_station',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_specialty',
    flavor: 'legit',
    cost: 2200,
    installCost: 250,
    removalRefundFraction: 0.3,
    boni: { avgMerchSalePriceBonus: 0.1 },
    unlock: { minFame: 50 },
    imagePromptKey: 'mw_hot_foil_station'
  },
  {
    id: 'mw_cassette_dubber',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_specialty',
    flavor: 'diy',
    cost: 350,
    installCost: 50,
    removalRefundFraction: 0.2,
    boni: { baseDailyRevenueDelta: 20 },
    unlock: { requiredStoryFlags: ['tape_culture_revival'] },
    imagePromptKey: 'mw_cassette_dubber'
  },
  {
    id: 'mw_sticker_bot',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_specialty',
    flavor: 'legit',
    cost: 600,
    installCost: 80,
    removalRefundFraction: 0.3,
    boni: { baseDailyRevenueDelta: 10 },
    unlock: {},
    imagePromptKey: 'mw_sticker_bot'
  },
  {
    id: 'mw_storage_racks',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_storage',
    flavor: 'legit',
    cost: 800,
    installCost: 100,
    removalRefundFraction: 0.3,
    boni: { merchCapacityBonus: 60 },
    unlock: {},
    imagePromptKey: 'mw_storage_racks'
  },
  {
    id: 'mw_mailorder_script',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_automation',
    flavor: 'legit',
    cost: 0,
    installCost: 100,
    removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 30 },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 1 } },
    imagePromptKey: 'mw_mailorder_script'
  },
  {
    id: 'mw_bandcamp_bot',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_sales',
    flavor: 'legit',
    cost: 0,
    installCost: 50,
    removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 25 },
    unlock: { minFame: 20 },
    imagePromptKey: 'mw_bandcamp_bot'
  },
  {
    id: 'mw_darkweb_vendor',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_sales',
    flavor: 'diy',
    cost: 0,
    installCost: 200,
    removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 50 },
    riskEventTypes: ['scam_or_bust', 'police_check'],
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 3 } },
    imagePromptKey: 'mw_darkweb_vendor'
  },
  {
    id: 'mw_hype_drop_machine',
    ownerKind: 'merch_workshop_chassis',
    slotType: 'mw_automation',
    flavor: 'legit',
    cost: 1500,
    installCost: 200,
    removalRefundFraction: 0.2,
    boni: { avgMerchSalePriceBonus: 0.08 },
    unlock: { minFame: 70 },
    imagePromptKey: 'mw_hype_drop_machine'
  }
]

const PROMPTS: Record<string, string> = {
  mw_4color_carousel:
    'pixel art 4-color screen printing carousel press merch production workshop',
  mw_manual_press:
    'pixel art manual single-color screen printing press tabletop diy',
  mw_eco_ink_supply:
    'pixel art eco-friendly ink bottles plant-based supplies green leaves',
  mw_conveyor_dryer:
    'pixel art conveyor belt drying tunnel for screen printed shirts',
  mw_heat_press_box:
    'pixel art tabletop heat press box for vinyl transfers diy',
  mw_vinyl_cutter: 'pixel art vinyl cutting plotter cutting band logo decals',
  mw_embroidery_machine:
    'pixel art embroidery machine stitching band patch logo',
  mw_badge_press: 'pixel art badge button press maker pin manufacturing',
  mw_hot_foil_station:
    'pixel art hot foil stamping station gold metallic finish premium',
  mw_cassette_dubber:
    'pixel art cassette tape duplicator dubbing machine retro audio',
  mw_sticker_bot: 'pixel art automated sticker cutting and printing robot',
  mw_storage_racks:
    'pixel art warehouse storage racks full of band merch boxes',
  mw_mailorder_script:
    'pixel art computer running mailorder fulfillment script terminal screen',
  mw_bandcamp_bot:
    'pixel art laptop with bandcamp interface automated shop manager',
  mw_darkweb_vendor:
    'pixel art dark web vendor terminal black market merch interface ominous',
  mw_hype_drop_machine:
    'pixel art limited drop hype machine countdown timer announcement screen'
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
