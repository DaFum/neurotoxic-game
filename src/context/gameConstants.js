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
  INTRO: 'INTRO',
  CLINIC: 'CLINIC'
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

export const CLINIC_CONFIG = Object.freeze({
  VISIT_MULTIPLIER: 1.2,
  HEAL_BASE_COST_MONEY: 150,
  ENHANCE_BASE_COST_FAME: 500,
  HEAL_STAMINA_GAIN: 30,
  HEAL_MOOD_GAIN: 10,
  CYBER_LUNGS_TRAIT_ID: 'cyber_lungs'
})

export const calculateClinicCost = (baseCost, currentVisits) => {
  return Math.floor(
    baseCost * Math.pow(CLINIC_CONFIG.VISIT_MULTIPLIER, currentVisits)
  )
}
