import type { GameState } from '../../types/game'
import { GAME_PHASES } from '../../context/gameConstants'

const getMinMood = (state: GameState, memo: Record<string, unknown>) =>
  memo?.minMood ??
  (state.band?.members
    ? Math.min(...state.band.members.map((m: any) => m.mood ?? Infinity))
    : Infinity)

const getMaxMood = (state: GameState, memo: Record<string, unknown>) =>
  memo?.maxMood ??
  (state.band?.members
    ? Math.max(...state.band.members.map((m: any) => m.mood ?? -Infinity))
    : -Infinity)

const getMinStamina = (state: GameState, memo: Record<string, unknown>) =>
  memo?.minStamina ??
  (state.band?.members
    ? Math.min(...state.band.members.map((m: any) => m.stamina ?? Infinity))
    : Infinity)

const getMaxStamina = (state: GameState, memo: Record<string, unknown>) =>
  memo?.maxStamina ??
  (state.band?.members
    ? Math.max(...state.band.members.map((m: any) => m.stamina ?? -Infinity))
    : -Infinity)

const isPlayerInCity = (state: GameState, citySlug: string) => {
  const location = state.player?.location
  if (!location) return false

  return location === citySlug || location.includes(`venues:${citySlug}`)
}

export const CHATTER_DB = [
  // --- GENERAL TRAVEL / OVERWORLD ---
  {
    text: 'chatter:standard.msg_001',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_002',
    weight: 1,
    category: 'travel',
    speaker: 'Marius',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_003',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_004',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_005',
    weight: 0.5,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_006',
    weight: 0.2,
    category: 'travel',
    speaker: 'Lars',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_007',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_008',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_009',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_010',
    weight: 1,
    category: 'travel',
    speaker: 'Marius',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_011',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_012',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_013',
    weight: 0.5,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_014',
    weight: 0.2,
    category: 'travel',
    speaker: 'Lars',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_015',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_016',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_017',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_018',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_019',
    weight: 0.8,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_020',
    weight: 0.5,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_021',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_022',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_023',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_024',
    weight: 0.8,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_025',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_026',
    weight: 0.5,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_027',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_028',
    weight: 0.8,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_029',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_030',
    weight: 0.7,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_031',
    weight: 0.6,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_032',
    weight: 1,
    category: 'travel',
    speaker: 'Matze',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_033',
    weight: 0.8,
    category: 'travel',
    speaker: 'Marius',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_034',
    weight: 0.6,
    category: 'travel',
    speaker: 'Lars',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_035',
    weight: 1,
    category: 'travel',
    speaker: 'Marius',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_036',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_037',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_038',
    weight: 0.7,
    category: 'travel',
    speaker: 'Marius',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_039',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_040',
    weight: 0.8,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_041',
    weight: 0.5,
    category: 'travel',
    speaker: 'Lars',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_042',
    weight: 0.8,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_043',
    weight: 0.7,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_044',
    weight: 0.6,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_045',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_046',
    weight: 0.4,
    category: 'travel',
    speaker: 'Lars',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_047',
    weight: 0.6,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_048',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_049',
    weight: 0.7,
    category: 'travel',
    speaker: 'Matze',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_050',
    weight: 0.6,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_051',
    weight: 0.7,
    category: 'travel',
    speaker: 'Marius',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_052',
    weight: 0.8,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_053',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_054',
    weight: 1,
    category: 'travel',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },
  {
    text: 'chatter:standard.msg_055',
    weight: 0.4,
    category: 'travel',
    speaker: 'Lars',
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.TRAVEL_MINIGAME ||
      state.currentScene === GAME_PHASES.OVERWORLD
  },

  // --- PRE-GIG (Preparation) ---
  {
    text: 'chatter:standard.msg_056',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_057',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_058',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_059',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_060',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_061',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_062',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_063',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_064',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_065',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_066',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_067',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_068',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_069',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_070',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_071',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_072',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_073',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_074',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_075',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_076',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_077',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_078',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_079',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_080',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_081',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_082',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_083',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_084',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_085',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_086',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_087',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_088',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_089',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_090',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_091',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_092',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_093',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_094',
    weight: 2,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_095',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_096',
    weight: 1,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.PRE_GIG ||
      state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },

  // --- POST-GIG (Reaction) ---
  {
    text: 'chatter:standard.msg_097',
    weight: 5,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.POST_GIG &&
      state.lastGigStats?.score > 10000
  },
  {
    text: 'chatter:standard.msg_098',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_099',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_100',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_101',
    weight: 5,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.POST_GIG &&
      state.lastGigStats?.misses > 10
  },
  {
    text: 'chatter:standard.msg_102',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_103',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_104',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_105',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_106',
    weight: 4,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_107',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_108',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_109',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_110',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_111',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_112',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_113',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_114',
    weight: 4,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_115',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_116',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_117',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_118',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_119',
    weight: 5,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.POST_GIG &&
      (state.lastGigStats?.score || 0) > 9000
  },
  {
    text: 'chatter:standard.msg_120',
    weight: 5,
    condition: (state: GameState) =>
      state.currentScene === GAME_PHASES.POST_GIG &&
      (state.lastGigStats?.misses || 0) > 8
  },
  {
    text: 'chatter:standard.msg_121',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_122',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_123',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_124',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_125',
    weight: 4,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_126',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_127',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_128',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_129',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_130',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_131',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_132',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG
  },
  {
    text: 'chatter:standard.msg_133',
    weight: 2,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.POST_GIG,
    speaker: 'Lars'
  },

  // --- CONDITION: LOW MOOD ---
  {
    text: 'chatter:standard.msg_134',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 30
  },
  {
    text: 'chatter:standard.msg_135',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 20
  },
  {
    text: 'chatter:standard.msg_136',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_137',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 30
  },
  {
    text: 'chatter:standard.msg_138',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 20
  },
  {
    text: 'chatter:standard.msg_139',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_140',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 30
  },
  {
    text: 'chatter:standard.msg_141',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_142',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 30
  },
  {
    text: 'chatter:standard.msg_143',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 20
  },
  {
    text: 'chatter:standard.msg_144',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_145',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 20
  },
  {
    text: 'chatter:standard.msg_146',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_147',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 30
  },
  {
    text: 'chatter:standard.msg_148',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_149',
    weight: 10,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 20
  },
  {
    text: 'chatter:standard.msg_150',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25
  },
  {
    text: 'chatter:standard.msg_151',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 30,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_152',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_153',
    weight: 8,
    condition: (state: GameState, memo: Record<string, unknown>) => getMinMood(state, memo) < 25,
    speaker: 'Lars'
  },

  // --- CONDITION: HIGH MOOD ---
  {
    text: 'chatter:standard.msg_154',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_155',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 90
  },
  {
    text: 'chatter:standard.msg_156',
    weight: 1,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 95
  },
  {
    text: 'chatter:standard.msg_157',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_158',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 90
  },
  {
    text: 'chatter:standard.msg_159',
    weight: 1,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 95
  },
  {
    text: 'chatter:standard.msg_160',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 85
  },
  {
    text: 'chatter:standard.msg_161',
    weight: 4,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_162',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 90
  },
  {
    text: 'chatter:standard.msg_163',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 85
  },
  {
    text: 'chatter:standard.msg_164',
    weight: 1,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 95
  },
  {
    text: 'chatter:standard.msg_165',
    weight: 1,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 95
  },
  {
    text: 'chatter:standard.msg_166',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 85
  },
  {
    text: 'chatter:standard.msg_167',
    weight: 4,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 80,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_168',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 85
  },
  {
    text: 'chatter:standard.msg_169',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 90
  },
  {
    text: 'chatter:standard.msg_170',
    weight: 4,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 80,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_171',
    weight: 3,
    condition: (state: GameState, memo: Record<string, unknown>) => getMaxMood(state, memo) > 90
  },

  // --- CONDITION: MONEY ---
  {
    text: 'chatter:standard.msg_172',
    weight: 10,
    condition: (state: GameState) => state.player.money < 100
  },
  {
    text: 'chatter:standard.msg_173',
    weight: 5,
    condition: (state: GameState) => state.player.money > 2000
  },
  {
    text: 'chatter:standard.msg_174',
    weight: 10,
    condition: (state: GameState) => state.player.money < 100
  },
  {
    text: 'chatter:standard.msg_175',
    weight: 5,
    condition: (state: GameState) => state.player.money > 2000,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_176',
    weight: 10,
    condition: (state: GameState) => state.player.money < 120
  },
  {
    text: 'chatter:standard.msg_177',
    weight: 8,
    condition: (state: GameState) => state.player.money < 150
  },
  {
    text: 'chatter:standard.msg_178',
    weight: 10,
    condition: (state: GameState) => state.player.money < 100
  },
  {
    text: 'chatter:standard.msg_179',
    weight: 4,
    condition: (state: GameState) => state.player.money > 2200
  },
  {
    text: 'chatter:standard.msg_180',
    weight: 5,
    condition: (state: GameState) => state.player.money > 2000
  },
  {
    text: 'chatter:standard.msg_181',
    weight: 4,
    condition: (state: GameState) => state.player.money > 2000,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_182',
    weight: 4,
    condition: (state: GameState) => state.player.money > 2000
  },
  {
    text: 'chatter:standard.msg_183',
    weight: 10,
    condition: (state: GameState) => state.player.money < 120
  },
  {
    text: 'chatter:standard.msg_184',
    weight: 10,
    condition: (state: GameState) => state.player.money < 100
  },
  {
    text: 'chatter:standard.msg_185',
    weight: 8,
    condition: (state: GameState) => state.player.money < 150,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_186',
    weight: 4,
    condition: (state: GameState) => state.player.money > 1800
  },

  // --- CONDITION: FAME/SOCIAL ---
  {
    text: 'chatter:standard.msg_187',
    weight: 3,
    condition: (state: GameState) => state.social?.instagram > 500
  },
  {
    text: 'chatter:standard.msg_188',
    weight: 5,
    condition: (state: GameState) => state.social?.viral > 0
  },
  {
    text: 'chatter:standard.msg_189',
    weight: 3,
    condition: (state: GameState) => state.social?.instagram > 500
  },
  {
    text: 'chatter:standard.msg_190',
    weight: 5,
    condition: (state: GameState) => state.social?.viral > 0
  },
  {
    text: 'chatter:standard.msg_191',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 500
  },
  {
    text: 'chatter:standard.msg_192',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 800
  },
  {
    text: 'chatter:standard.msg_193',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 500
  },
  {
    text: 'chatter:standard.msg_194',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 1000
  },
  {
    text: 'chatter:standard.msg_195',
    weight: 5,
    condition: (state: GameState) => (state.social?.viral || 0) > 0
  },
  {
    text: 'chatter:standard.msg_196',
    weight: 5,
    condition: (state: GameState) => (state.social?.viral || 0) > 0,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_197',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 700
  },
  {
    text: 'chatter:standard.msg_198',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 1000,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_199',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 900,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_200',
    weight: 5,
    condition: (state: GameState) => (state.social?.viral || 0) > 0,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_201',
    weight: 3,
    condition: (state: GameState) => (state.social?.instagram || 0) > 800
  },

  // --- LOCATION SPECIFIC (General) ---
  {
    text: 'chatter:standard.msg_202',
    weight: 10,
    condition: (state: GameState) => isPlayerInCity(state, 'stendal')
  },
  {
    text: 'chatter:standard.msg_203',
    weight: 5,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },
  {
    text: 'chatter:standard.msg_204',
    weight: 10,
    condition: (state: GameState) => isPlayerInCity(state, 'stendal')
  },
  {
    text: 'chatter:standard.msg_205',
    weight: 5,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },
  {
    text: 'chatter:standard.msg_206',
    weight: 10,
    condition: (state: GameState) => isPlayerInCity(state, 'stendal')
  },
  {
    text: 'chatter:standard.msg_207',
    weight: 8,
    condition: (state: GameState) => isPlayerInCity(state, 'stendal')
  },
  {
    text: 'chatter:standard.msg_208',
    weight: 5,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },
  {
    text: 'chatter:standard.msg_209',
    weight: 5,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },
  {
    text: 'chatter:standard.msg_210',
    weight: 4,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },
  {
    text: 'chatter:standard.msg_211',
    weight: 8,
    condition: (state: GameState) => isPlayerInCity(state, 'stendal'),
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_212',
    weight: 5,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },
  {
    text: 'chatter:standard.msg_213',
    weight: 8,
    condition: (state: GameState) => isPlayerInCity(state, 'stendal')
  },
  {
    text: 'chatter:standard.msg_214',
    weight: 4,
    condition: (state: GameState) => isPlayerInCity(state, 'berlin')
  },

  // --- GIG SPECIFIC (In-Game) ---
  {
    text: 'chatter:standard.msg_215',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_216',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 30,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_217',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_218',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 30,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_219',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_220',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 80
  },
  {
    text: 'chatter:standard.msg_221',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 75
  },
  {
    text: 'chatter:standard.msg_222',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 35,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_223',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 30,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_224',
    weight: 4,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 35,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_225',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 80,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_226',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 75
  },
  {
    text: 'chatter:standard.msg_227',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 30,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_228',
    weight: 4,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMinStamina(state, memo) < 35,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_229',
    weight: 5,
    condition: (state: GameState, memo: Record<string, unknown>) =>
      state.currentScene === GAME_PHASES.GIG && getMaxStamina(state, memo) > 80
  },

  // --- CONDITION: BAND HARMONY ---
  {
    text: 'chatter:standard.msg_230',
    weight: 8,
    condition: (state: GameState) => state.band.harmony < 40
  },
  {
    text: 'chatter:standard.msg_231',
    weight: 8,
    condition: (state: GameState) => state.band.harmony < 35
  },
  {
    text: 'chatter:standard.msg_232',
    weight: 8,
    condition: (state: GameState) => state.band.harmony < 40,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_233',
    weight: 10,
    condition: (state: GameState) => state.band.harmony < 30
  },
  {
    text: 'chatter:standard.msg_234',
    weight: 8,
    condition: (state: GameState) => state.band.harmony < 35
  },
  {
    text: 'chatter:standard.msg_235',
    weight: 8,
    condition: (state: GameState) => state.band.harmony < 30,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_236',
    weight: 8,
    condition: (state: GameState) => state.band.harmony < 40
  },
  {
    text: 'chatter:standard.msg_237',
    weight: 5,
    condition: (state: GameState) => state.band.harmony > 85
  },
  {
    text: 'chatter:standard.msg_238',
    weight: 5,
    condition: (state: GameState) => state.band.harmony > 85
  },
  {
    text: 'chatter:standard.msg_239',
    weight: 5,
    condition: (state: GameState) => state.band.harmony > 90
  },
  {
    text: 'chatter:standard.msg_240',
    weight: 4,
    condition: (state: GameState) => state.band.harmony > 85,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_241',
    weight: 4,
    condition: (state: GameState) => state.band.harmony > 90
  },
  {
    text: 'chatter:standard.msg_242',
    weight: 3,
    condition: (state: GameState) => state.band.harmony > 90,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_243',
    weight: 4,
    condition: (state: GameState) => state.band.harmony > 85
  },

  // --- CONDITION: VAN STATE ---
  {
    text: 'chatter:standard.msg_244',
    weight: 10,
    condition: (state: GameState) => state.player.van.fuel < 25
  },
  {
    text: 'chatter:standard.msg_245',
    weight: 10,
    condition: (state: GameState) => state.player.van.fuel < 20
  },
  {
    text: 'chatter:standard.msg_246',
    weight: 8,
    condition: (state: GameState) => state.player.van.fuel < 25
  },
  {
    text: 'chatter:standard.msg_247',
    weight: 10,
    condition: (state: GameState) => state.player.van.fuel < 15,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_248',
    weight: 8,
    condition: (state: GameState) => state.player.van.fuel < 20,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_249',
    weight: 10,
    condition: (state: GameState) => state.player.van.condition < 30
  },
  {
    text: 'chatter:standard.msg_250',
    weight: 10,
    condition: (state: GameState) => state.player.van.condition < 25
  },
  {
    text: 'chatter:standard.msg_251',
    weight: 8,
    condition: (state: GameState) => state.player.van.condition < 35,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_252',
    weight: 8,
    condition: (state: GameState) => state.player.van.condition < 30
  },
  {
    text: 'chatter:standard.msg_253',
    weight: 10,
    condition: (state: GameState) => state.player.van.condition < 20
  },
  {
    text: 'chatter:standard.msg_254',
    weight: 4,
    condition: (state: GameState) => state.player.van.condition > 90
  },
  {
    text: 'chatter:standard.msg_255',
    weight: 4,
    condition: (state: GameState) => state.player.van.fuel > 85
  },
  {
    text: 'chatter:standard.msg_256',
    weight: 3,
    condition: (state: GameState) => state.player.van.condition > 90,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_257',
    weight: 3,
    condition: (state: GameState) =>
      state.player.van.fuel > 80 && state.player.van.condition > 80
  },

  // --- CONDITION: TOUR PROGRESSION ---
  {
    text: 'chatter:standard.msg_258',
    weight: 8,
    condition: (state: GameState) => state.player.day <= 2
  },
  {
    text: 'chatter:standard.msg_259',
    weight: 8,
    condition: (state: GameState) => state.player.day <= 3,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_260',
    weight: 6,
    condition: (state: GameState) => state.player.day <= 3
  },
  {
    text: 'chatter:standard.msg_261',
    weight: 6,
    condition: (state: GameState) => state.player.day <= 4
  },
  {
    text: 'chatter:standard.msg_262',
    weight: 5,
    condition: (state: GameState) => state.player.day >= 10 && state.player.day <= 20
  },
  {
    text: 'chatter:standard.msg_263',
    weight: 5,
    condition: (state: GameState) => state.player.day >= 12
  },
  {
    text: 'chatter:standard.msg_264',
    weight: 5,
    condition: (state: GameState) => state.player.day >= 15,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_265',
    weight: 8,
    condition: (state: GameState) => state.player.day >= 25
  },
  {
    text: 'chatter:standard.msg_266',
    weight: 8,
    condition: (state: GameState) => state.player.day >= 25,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_267',
    weight: 8,
    condition: (state: GameState) => state.player.day >= 28
  },
  {
    text: 'chatter:standard.msg_268',
    weight: 6,
    condition: (state: GameState) => state.player.totalTravels <= 2
  },
  {
    text: 'chatter:standard.msg_269',
    weight: 4,
    condition: (state: GameState) => state.player.totalTravels >= 15
  },
  {
    text: 'chatter:standard.msg_270',
    weight: 4,
    condition: (state: GameState) => state.player.totalTravels >= 20,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_271',
    weight: 4,
    condition: (state: GameState) => state.player.totalTravels >= 18
  },

  // --- CONDITION: FAME MILESTONES ---
  {
    text: 'chatter:standard.msg_272',
    weight: 6,
    condition: (state: GameState) => (state.player.fame || 0) < 50
  },
  {
    text: 'chatter:standard.msg_273',
    weight: 6,
    condition: (state: GameState) => (state.player.fame || 0) < 50,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_274',
    weight: 6,
    condition: (state: GameState) => (state.player.fame || 0) < 30
  },
  {
    text: 'chatter:standard.msg_275',
    weight: 5,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 2
  },
  {
    text: 'chatter:standard.msg_276',
    weight: 5,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 2,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_277',
    weight: 5,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 2
  },
  {
    text: 'chatter:standard.msg_278',
    weight: 4,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 3
  },
  {
    text: 'chatter:standard.msg_279',
    weight: 4,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 3,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_280',
    weight: 3,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 4
  },
  {
    text: 'chatter:standard.msg_281',
    weight: 3,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 4
  },
  {
    text: 'chatter:standard.msg_282',
    weight: 2,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 5,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_283',
    weight: 2,
    condition: (state: GameState) => (state.player.fameLevel || 0) >= 5
  },

  // --- CONDITION: INVENTORY AWARENESS ---
  {
    text: 'chatter:standard.msg_284',
    weight: 10,
    condition: (state: GameState) => state.band.inventory?.strings === false,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_285',
    weight: 10,
    condition: (state: GameState) => state.band.inventory?.cables === false
  },
  {
    text: 'chatter:standard.msg_286',
    weight: 10,
    condition: (state: GameState) => state.band.inventory?.drum_parts === false
  },
  {
    text: 'chatter:standard.msg_287',
    weight: 8,
    condition: (state: GameState) => state.band.inventory?.strings === false
  },
  {
    text: 'chatter:standard.msg_288',
    weight: 8,
    condition: (state: GameState) => state.band.inventory?.cables === false,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_289',
    weight: 8,
    condition: (state: GameState) => state.band.inventory?.drum_parts === false,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_290',
    weight: 3,
    condition: (state: GameState) => state.band.inventory?.golden_pick === true
  },
  {
    text: 'chatter:standard.msg_291',
    weight: 3,
    condition: (state: GameState) => state.band.inventory?.golden_pick === true,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_292',
    weight: 2,
    condition: (state: GameState) =>
      state.band.inventory?.strings === true &&
      state.band.inventory?.cables === true &&
      state.band.inventory?.drum_parts === true
  },
  {
    text: 'chatter:standard.msg_293',
    weight: 2,
    condition: (state: GameState) =>
      state.band.inventory?.strings === true &&
      state.band.inventory?.cables === true &&
      state.band.inventory?.drum_parts === true
  },
  {
    text: 'chatter:standard.msg_294',
    weight: 6,
    condition: (state: GameState) => state.band.inventory?.shirts < 10
  },
  {
    text: 'chatter:standard.msg_295',
    weight: 6,
    condition: (state: GameState) => state.band.inventory?.hoodies <= 0
  },

  // --- CONDITION: GIG MODIFIERS ---
  {
    text: 'chatter:standard.msg_296',
    weight: 5,
    condition: (state: GameState) => state.gigModifiers?.catering === true
  },
  {
    text: 'chatter:standard.msg_297',
    weight: 5,
    condition: (state: GameState) => state.gigModifiers?.catering === true,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_298',
    weight: 5,
    condition: (state: GameState) => state.gigModifiers?.promo === true
  },
  {
    text: 'chatter:standard.msg_299',
    weight: 5,
    condition: (state: GameState) => state.gigModifiers?.promo === true,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_300',
    weight: 5,
    condition: (state: GameState) => state.gigModifiers?.soundcheck === true
  },
  {
    text: 'chatter:standard.msg_301',
    weight: 5,
    condition: (state: GameState) => state.gigModifiers?.soundcheck === true,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_302',
    weight: 4,
    condition: (state: GameState) => state.gigModifiers?.guestlist === true
  },
  {
    text: 'chatter:standard.msg_303',
    weight: 4,
    condition: (state: GameState) => state.gigModifiers?.merch === true
  },
  {
    text: 'chatter:standard.msg_304',
    weight: 6,
    condition: (state: GameState) =>
      state.gigModifiers?.soundcheck !== true &&
      state.gigModifiers?.promo !== true &&
      state.gigModifiers?.catering !== true
  },
  {
    text: 'chatter:standard.msg_305',
    weight: 3,
    condition: (state: GameState) =>
      state.gigModifiers?.soundcheck === true &&
      state.gigModifiers?.promo === true &&
      state.gigModifiers?.catering === true
  },

  // --- CONDITION: LUCK ---
  {
    text: 'chatter:standard.msg_306',
    weight: 5,
    condition: (state: GameState) => (state.band.luck || 0) > 3
  },
  {
    text: 'chatter:standard.msg_307',
    weight: 5,
    condition: (state: GameState) => (state.band.luck || 0) > 3,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_308',
    weight: 4,
    condition: (state: GameState) => (state.band.luck || 0) > 4
  },
  {
    text: 'chatter:standard.msg_309',
    weight: 4,
    condition: (state: GameState) => (state.band.luck || 0) > 5,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_310',
    weight: 8,
    condition: (state: GameState) => (state.band.luck || 0) < -2
  },
  {
    text: 'chatter:standard.msg_311',
    weight: 8,
    condition: (state: GameState) => (state.band.luck || 0) < -2
  },
  {
    text: 'chatter:standard.msg_312',
    weight: 10,
    condition: (state: GameState) => (state.band.luck || 0) < -4,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_313',
    weight: 8,
    condition: (state: GameState) => (state.band.luck || 0) < -3,
    speaker: 'Marius'
  },

  // --- MINIGAME: TRAVEL ---
  {
    text: 'chatter:standard.msg_314',
    weight: 5,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.TRAVEL_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_315',
    weight: 5,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.TRAVEL_MINIGAME
  },
  {
    text: 'chatter:standard.msg_316',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.TRAVEL_MINIGAME
  },
  {
    text: 'chatter:standard.msg_317',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.TRAVEL_MINIGAME,
    speaker: 'Lars'
  },
  {
    text: 'chatter:standard.msg_318',
    weight: 4,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.TRAVEL_MINIGAME
  },

  // --- MINIGAME: ROADIE ---
  {
    text: 'chatter:standard.msg_319',
    weight: 5,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_320',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Matze'
  },
  {
    text: 'chatter:standard.msg_321',
    weight: 5,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Marius'
  },
  {
    text: 'chatter:standard.msg_322',
    weight: 4,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME
  },
  {
    text: 'chatter:standard.msg_323',
    weight: 3,
    condition: (state: GameState) => state.currentScene === GAME_PHASES.PRE_GIG_MINIGAME,
    speaker: 'Lars'
  }
]

export const ALLOWED_DEFAULT_SCENES = [
  GAME_PHASES.MENU,
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.PRE_GIG,
  GAME_PHASES.POST_GIG,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME
]
