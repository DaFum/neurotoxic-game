export const GAME_PHASES = Object.freeze({
  OVERWORLD: 'OVERWORLD',
  TRAVEL_MINIGAME: 'TRAVEL_MINIGAME',
  PRE_GIG: 'PREGIG',
  PRE_GIG_MINIGAME: 'PRE_GIG_MINIGAME',
  GIG: 'GIG',
  POST_GIG: 'POSTGIG',
  PRACTICE: 'PRACTICE',
  MENU: 'MENU',
  SETTINGS: 'SETTINGS',
  CREDITS: 'CREDITS',
  GAMEOVER: 'GAMEOVER',
  INTRO: 'INTRO'
})

export const MINIGAME_TYPES = {
  TOURBUS: 'TOURBUS',
  ROADIE: 'ROADIE',
  KABELSALAT: 'KABELSALAT'
}

export const DEFAULT_MINIGAME_STATE = {
  active: false,
  type: null,
  targetDestination: null,
  gigId: null,
  equipmentRemaining: 0,
  accumulatedDamage: 0,
  score: 0
}

export const DEFAULT_EQUIPMENT_COUNT = 10
