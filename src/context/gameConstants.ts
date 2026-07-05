import type { MinigameState, GamePhase } from '../types'

/**
 * Canonical scene identifiers used by game state, routing, and persistence.
 */
export const GAME_PHASES = Object.freeze({
  OVERWORLD: 'OVERWORLD',
  TRAVEL_MINIGAME: 'TRAVEL_MINIGAME',
  PRE_GIG: 'PREGIG',
  PRE_GIG_MINIGAME: 'PRE_GIG_MINIGAME',
  GIG: 'GIG',
  POST_GIG: 'POSTGIG',
  PRACTICE: 'PRACTICE',
  MENU: 'MENU',
  CREDITS: 'CREDITS',
  GAMEOVER: 'GAMEOVER',
  INTRO: 'INTRO',
  CLINIC: 'CLINIC',
  ASSETS: 'ASSETS'
} as const satisfies Record<string, string>)

/**
 * Whitelist of persisted scene values that can be restored from saves.
 */
export const ALLOWED_SCENE_VALUES = Object.freeze(
  Object.values(GAME_PHASES) as GamePhase[]
)

/**
 * Minigame identifiers stored in `MinigameState.type`.
 */
export const MINIGAME_TYPES = {
  TOURBUS: 'TOURBUS',
  ROADIE: 'ROADIE',
  KABELSALAT: 'KABELSALAT',
  AMP_CALIBRATION: 'AMP_CALIBRATION'
} as const satisfies Record<
  'TOURBUS' | 'ROADIE' | 'KABELSALAT' | 'AMP_CALIBRATION',
  string
>

/**
 * Allowed pitch drift before amp calibration counts as a miss.
 */
export const AMP_CALIBRATION_TOLERANCE = 50

type DefaultMinigameState = Required<
  Pick<
    MinigameState,
    | 'active'
    | 'type'
    | 'targetDestination'
    | 'gigId'
    | 'equipmentRemaining'
    | 'accumulatedDamage'
    | 'score'
  >
>

/**
 * Empty minigame state used when no overlay minigame is active.
 */
export const DEFAULT_MINIGAME_STATE: DefaultMinigameState = {
  active: false,
  type: null,
  targetDestination: null,
  gigId: null,
  equipmentRemaining: 0,
  accumulatedDamage: 0,
  score: 0
}

/**
 * Baseline roadie equipment count for the roadie minigame.
 */
export const DEFAULT_EQUIPMENT_COUNT = 10

/**
 * Shared balance constants for fixed gameplay systems that do not need runtime tuning.
 */
export const GAME_CONSTANTS = Object.freeze({
  BLOOD_BANK: {
    BLOOD_BASE_MONEY: 100,
    BLOOD_HARMONY_COST: 15,
    BLOOD_STAMINA_COST: 30,
    BLOOD_CONTROVERSY_GAIN: 5,
    MARROW_BASE_MONEY: 500,
    MARROW_HARMONY_COST: 40,
    MARROW_STAMINA_COST: 60,
    MARROW_CONTROVERSY_GAIN: 20
  }
})

/**
 * Clinic treatment tuning and the trait granted by enhancement treatment.
 */
/**
 * Cost for the Neuro-Overclock experimental graft.
 */
export const CLINIC_GRAFT_COST = 8500

export const CLINIC_CONFIG = Object.freeze({
  VISIT_MULTIPLIER: 1.2,
  HEAL_BASE_COST_MONEY: 280,
  ENHANCE_BASE_COST_FAME: 500,
  HEAL_STAMINA_GAIN: 30,
  HEAL_MOOD_GAIN: 10,
  CYBER_LUNGS_TRAIT_ID: 'cyber_lungs'
})

/**
 * Scales repeat clinic visit costs by the configured visit multiplier.
 *
 * @param baseCost - Unscaled base treatment cost.
 * @param currentVisits - Number of previous clinic visits.
 * @returns Cost rounded down to whole euros or fame points.
 */
export const calculateClinicCost = (
  baseCost: number,
  currentVisits: number
): number => {
  return Math.floor(
    baseCost * Math.pow(CLINIC_CONFIG.VISIT_MULTIPLIER, currentVisits)
  )
}

/**
 * Scenes that practice mode can return to without a custom destination.
 */
export const PRACTICE_RETURN_SCENES = new Set<GamePhase>([
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.MENU
])

/**
 * Chance that a rival band keeps its current route instead of moving.
 */
export const RIVAL_STAY_CHANCE = 0.3

/**
 * Crowd decay multiplier applied after rival gig pressure.
 */
export const RIVAL_GIG_CROWD_DECAY_PENALTY = 1.5

/**
 * Maximum deal chance penalty from rival pressure.
 */
export const MAX_RIVAL_DEAL_CHANCE_PENALTY = 0.2

/**
 * Harmony cost for accepting the Neurotoxic pedal tradeoff.
 */
export const NEUROTOXIC_PEDAL_HARMONY_PENALTY = 5

/**
 * Crowd decay modifier applied by the Neurotoxic pedal.
 */
export const NEUROTOXIC_PEDAL_CROWD_DECAY_MODIFIER = 0.5

/**
 * Rival power conversion factor for sponsorship negotiation pressure.
 */
export const RIVAL_POWER_TO_DEAL_CHANCE_FACTOR = 0.02

/**
 * Chance penalty applied by rival negotiation interference.
 */
export const RIVAL_NEGOTIATION_PENALTY = 0.15

/**
 * Success chance for safe brand-deal negotiation.
 */
export const DEAL_NEGOTIATION_SAFE_CHANCE = 0.8

/**
 * Success chance for persuasive brand-deal negotiation.
 */
export const DEAL_NEGOTIATION_PERSUASIVE_CHANCE = 0.5

/**
 * Success chance for aggressive brand-deal negotiation.
 */
export const DEAL_NEGOTIATION_AGGRESSIVE_CHANCE = 0.3
