import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY, MODULE_PROMPTS } from '../assetRegistryStore'

const MODULES: readonly AssetModule[] = [
  {
    id: 'st_ssl_console',
    ownerKind: 'studio_chassis',
    slotType: 'st_control',
    flavor: 'legit',
    cost: 8000,
    installCost: 500,
    removalRefundFraction: 0.4,
    boni: { songQualityBonus: 0.2 },
    unlock: { minMoney: 8000 },
    imagePromptKey: 'st_ssl_console'
  },
  {
    id: 'st_diy_mixer',
    ownerKind: 'studio_chassis',
    slotType: 'st_control',
    flavor: 'diy',
    cost: 400,
    installCost: 100,
    removalRefundFraction: 0.2,
    boni: { songCostMultiplier: 0.8 },
    unlock: {},
    imagePromptKey: 'st_diy_mixer'
  },
  {
    id: 'st_u87_mic',
    ownerKind: 'studio_chassis',
    slotType: 'st_mic',
    flavor: 'legit',
    cost: 2200,
    installCost: 50,
    removalRefundFraction: 0.5,
    boni: { songQualityBonus: 0.08 },
    unlock: { minFame: 25 },
    imagePromptKey: 'st_u87_mic'
  },
  {
    id: 'st_dynamic_workhorse_mic',
    ownerKind: 'studio_chassis',
    slotType: 'st_mic',
    flavor: 'legit',
    cost: 250,
    installCost: 30,
    removalRefundFraction: 0.5,
    boni: { songCostMultiplier: 0.92 },
    unlock: {},
    imagePromptKey: 'st_dynamic_workhorse_mic'
  },
  {
    id: 'st_stolen_russian_compressors',
    ownerKind: 'studio_chassis',
    slotType: 'st_outboard',
    flavor: 'diy',
    cost: 800,
    installCost: 100,
    removalRefundFraction: 0.2,
    boni: { songQualityBonus: 0.1 },
    riskEventTypes: ['police_check'],
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'st_stolen_russian_compressors'
  },
  {
    id: 'st_tape_echo_handbuilt',
    ownerKind: 'studio_chassis',
    slotType: 'st_outboard',
    flavor: 'diy',
    cost: 600,
    installCost: 80,
    removalRefundFraction: 0.2,
    boni: { songQualityBonus: 0.06 },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'st_tape_echo_handbuilt'
  },
  {
    id: 'st_ns10_monitors',
    ownerKind: 'studio_chassis',
    slotType: 'st_monitoring',
    flavor: 'legit',
    cost: 900,
    installCost: 50,
    removalRefundFraction: 0.5,
    boni: { songQualityBonus: 0.05 },
    unlock: {},
    imagePromptKey: 'st_ns10_monitors'
  },
  {
    id: 'st_auralex_treatment',
    ownerKind: 'studio_chassis',
    slotType: 'st_treatment',
    flavor: 'legit',
    cost: 1200,
    installCost: 200,
    removalRefundFraction: 0.3,
    boni: { songCostMultiplier: 0.95 },
    unlock: { minMoney: 1200 },
    imagePromptKey: 'st_auralex_treatment'
  },
  {
    id: 'st_haunted_reverb_chamber',
    ownerKind: 'studio_chassis',
    slotType: 'st_treatment',
    flavor: 'diy',
    cost: 0,
    installCost: 200,
    removalRefundFraction: 0.0,
    boni: { songQualityBonus: 0.12 },
    riskEventTypes: ['paranormal'],
    unlock: { requiredStoryFlags: ['old_basement_secret'] },
    imagePromptKey: 'st_haunted_reverb_chamber'
  },
  {
    id: 'st_pro_tools_hd',
    ownerKind: 'studio_chassis',
    slotType: 'st_software',
    flavor: 'legit',
    cost: 3500,
    installCost: 100,
    removalRefundFraction: 0.3,
    boni: { enablesReRecording: true },
    unlock: { minMoney: 3500 },
    imagePromptKey: 'st_pro_tools_hd'
  },
  {
    id: 'st_cracked_daw_bundle',
    ownerKind: 'studio_chassis',
    slotType: 'st_software',
    flavor: 'diy',
    cost: 50,
    installCost: 20,
    removalRefundFraction: 0.0,
    boni: { songCostMultiplier: 0.5 },
    riskEventTypes: ['copyright_strike'],
    unlock: {},
    imagePromptKey: 'st_cracked_daw_bundle'
  },
  {
    id: 'st_iso_booth',
    ownerKind: 'studio_chassis',
    slotType: 'st_iso',
    flavor: 'legit',
    cost: 2500,
    installCost: 400,
    removalRefundFraction: 0.4,
    boni: { songQualityBonus: 0.06 },
    unlock: { minChassisTier: 3 },
    imagePromptKey: 'st_iso_booth'
  },
  {
    id: 'st_vintage_synth_corner',
    ownerKind: 'studio_chassis',
    slotType: 'st_vibe',
    flavor: 'legit',
    cost: 1800,
    installCost: 100,
    removalRefundFraction: 0.4,
    boni: { songQualityBonus: 0.05 },
    unlock: { minFame: 50 },
    imagePromptKey: 'st_vintage_synth_corner'
  },
  {
    id: 'st_lava_lamp_beer_fridge',
    ownerKind: 'studio_chassis',
    slotType: 'st_vibe',
    flavor: 'diy',
    cost: 200,
    installCost: 30,
    removalRefundFraction: 0.4,
    boni: { bandMoodPerDay: 1 },
    unlock: {},
    imagePromptKey: 'st_lava_lamp_beer_fridge'
  }
]

const PROMPTS: Record<string, string> = {
  st_ssl_console:
    'pixel art vintage SSL mixing console glowing meters analog studio dark moody',
  st_diy_mixer:
    'pixel art small diy mixer rough soldering exposed wires home studio',
  st_u87_mic:
    'pixel art Neumann U87 condenser microphone shock mount professional studio',
  st_dynamic_workhorse_mic:
    'pixel art SM58 dynamic microphone on stand basic recording',
  st_stolen_russian_compressors:
    'pixel art russian compressor rack vintage soviet era hardware stolen serial scratched',
  st_tape_echo_handbuilt:
    'pixel art handbuilt tape echo unit roland space echo style diy',
  st_ns10_monitors: 'pixel art yamaha ns-10 white cone studio monitors',
  st_auralex_treatment:
    'pixel art studio acoustic foam panels purple gray wall treatment',
  st_haunted_reverb_chamber:
    'pixel art haunted reverb chamber ghostly green glow eerie basement',
  st_pro_tools_hd:
    'pixel art pro tools HD interface and screen modern DAW workstation',
  st_cracked_daw_bundle:
    'pixel art pirated DAW software cracked sticker on laptop diy',
  st_iso_booth: 'pixel art recording iso booth small cabin glass door studio',
  st_vintage_synth_corner:
    'pixel art vintage moog and analog synth corner studio vibe',
  st_lava_lamp_beer_fridge:
    'pixel art lava lamp and mini beer fridge studio chillout corner'
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
