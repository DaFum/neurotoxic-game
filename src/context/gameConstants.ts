import type { MinigameState, GamePhase } from '../types'

/**
 * Canonical scene identifiers used by game state, routing, and persistence.
 *
 * @remarks
 * These constants act as the source of truth for all active game phases. They are utilized by the routing engine to render correct views and by the persistence layer to serialize the player's current location.
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
 *
 * @remarks
 * Restricting the loadable scenes prevents players from being loaded into transient states such as minigames or transition screens if the game is interrupted.
 */
export const ALLOWED_SCENE_VALUES = Object.freeze(
  Object.values(GAME_PHASES) as GamePhase[]
)

/**
 * Minigame identifiers stored in the active game state.
 *
 * @remarks
 * Used exclusively within the game state object to determine which specific minigame overlay and logic to load.
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
 *
 * @remarks
 * Determines the margin of error in tuning minigames. Values exceeding this threshold break the active combo streak.
 */
export const AMP_CALIBRATION_TOLERANCE = 50

/**
 * Defines the core structure for initializing or resetting the minigame state.
 */
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
 *
 * @remarks
 * Applied when clearing minigame state to guarantee a predictable, inactive baseline. Prevents leftover data from leaking between minigames.
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
 * Baseline equipment count for the roadie minigame.
 *
 * @remarks
 * Dictates the starting threshold of gear that must be successfully managed before the roadie phase is considered complete.
 */
export const DEFAULT_EQUIPMENT_COUNT = 10

/**
 * Shared balance constants for fixed gameplay systems that do not need runtime tuning.
 *
 * @remarks
 * These values govern the underlying math for static systems like the Blood Bank. They should not be modified by difficulty settings or active modifiers.
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
 * Cost for the Neuro-Overclock experimental graft.
 *
 * @remarks
 * A fixed euro threshold required to unlock the highly volatile, powerful cybernetic upgrade at the clinic.
 */
export const CLINIC_GRAFT_COST = 8500

/**
 * Clinic treatment tuning and the trait granted by enhancement treatment.
 *
 * @remarks
 * Defines scaling multipliers for repeated visits and the base restorative values applied upon treatment.
 */
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
 * @remarks
 * Uses an exponential growth formula to calculate escalating costs based on the player's visit history, discouraging excessive clinic reliance.
 *
 * @param baseCost - The unscaled, default cost of the desired treatment.
 * @param currentVisits - The total number of previous clinic visits made by the player.
 * @returns The final scaled cost, rounded down to the nearest whole integer.
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
 * Scenes that practice mode can safely return to upon completion or cancellation.
 *
 * @remarks
 * Enforces a strict set of fallback destinations to prevent practice mode from depositing players into illegal or transient states.
 */
export const PRACTICE_RETURN_SCENES = new Set<GamePhase>([
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.MENU
])

/**
 * Chance that a rival band maintains its current geographic route instead of relocating.
 *
 * @remarks
 * Evaluated daily during the overworld progression tick to inject a degree of unpredictability into rival movement patterns.
 */
export const RIVAL_STAY_CHANCE = 0.3

/**
 * Crowd decay multiplier applied after sustaining rival gig pressure.
 *
 * @remarks
 * Drastically accelerates the rate at which hype deteriorates if the player fails to counter the rival band's performance.
 */
export const RIVAL_GIG_CROWD_DECAY_PENALTY = 1.5

/**
 * Maximum sponsorship deal chance penalty inflicted by rival pressure.
 *
 * @remarks
 * Caps the negative impact that a dominant rival can have on the player's negotiation probabilities to prevent softlocks.
 */
export const MAX_RIVAL_DEAL_CHANCE_PENALTY = 0.2

/**
 * Harmony cost for accepting the Neurotoxic pedal tradeoff.
 *
 * @remarks
 * Deducted permanently upon acquisition of the pedal, reflecting the toll taken on band cohesion.
 */
export const NEUROTOXIC_PEDAL_HARMONY_PENALTY = 5

/**
 * Crowd decay modifier applied by the active Neurotoxic pedal.
 *
 * @remarks
 * Substantially reduces hype decay as a potent buff, offsetting its heavy initial harmony cost.
 */
export const NEUROTOXIC_PEDAL_CROWD_DECAY_MODIFIER = 0.5

/**
 * Conversion factor for translating rival power into a direct negotiation penalty.
 *
 * @remarks
 * Multiplied against the rival's raw power stat to determine the exact percentage deducted from successful sponsorship rolls.
 */
export const RIVAL_POWER_TO_DEAL_CHANCE_FACTOR = 0.02

/**
 * Fixed chance penalty applied by aggressive rival negotiation interference.
 *
 * @remarks
 * A flat deduction subtracted from the player's final deal success probability when rivals actively sabotage talks.
 */
export const RIVAL_NEGOTIATION_PENALTY = 0.15

/**
 * Base success probability for a safe, low-risk brand deal negotiation strategy.
 *
 * @remarks
 * Yields lower overall payouts but ensures a steady income stream.
 */
export const DEAL_NEGOTIATION_SAFE_CHANCE = 0.8

/**
 * Base success probability for a persuasive, balanced brand deal negotiation strategy.
 *
 * @remarks
 * Carries moderate risk for an equivalently moderate increase in sponsorship yield.
 */
export const DEAL_NEGOTIATION_PERSUASIVE_CHANCE = 0.5

/**
 * Base success probability for an aggressive, high-risk brand deal negotiation strategy.
 *
 * @remarks
 * Highly volatile approach that results in massive payouts upon success or total negotiation collapse upon failure.
 */
export const DEAL_NEGOTIATION_AGGRESSIVE_CHANCE = 0.3
