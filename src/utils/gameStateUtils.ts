import { hasTrait } from './traitUtils'
import { EXPENSE_CONSTANTS } from './economyEngine'
import { logger } from './logger'
import type { BandMember, GameState } from '../types/game'

/**
 * Clamps a value to be at least 0.
 *
 * @param {number} value - Candidate value.
 * @returns {number} Clamped value ensuring non-negative.
 */
export const clampNonNegative = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

export const isPlainObject = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Derives fame level from raw fame.
 * @param {number} fame - Raw fame amount.
 * @returns {number} Derived fame level.
 */
export const calculateFameLevel = (fame: number): number => {
  const clampedFame = clampNonNegative(fame)
  return Math.floor(clampedFame / 100)
}

/**
 * Clamps a band member's stamina to be between 0 and their staminaMax (default 100).
 *
 * @param {number} stamina - Candidate stamina value.
 * @param {number} [staminaMax=100] - The member's maximum stamina.
 * @returns {number} Clamped stamina value.
 */
export const clampMemberStamina = (
  stamina: number,
  staminaMax = 100
): number => {
  if (!Number.isFinite(stamina)) return 0
  const resolvedStaminaMax = Number.isFinite(staminaMax) ? staminaMax : 100
  return Math.max(0, Math.min(resolvedStaminaMax, Math.floor(stamina)))
}

/**
 * Clamps a band member's mood to be between 0 and 100.
 *
 * @param {number} mood - Candidate mood value.
 * @returns {number} Clamped mood value.
 */
export const clampMemberMood = (mood: number): number => {
  if (!Number.isFinite(mood)) return 0
  return Math.max(0, Math.min(100, Math.floor(mood)))
}

/**
 * Clamps player fame to be at least 0.
 *
 * @param {number} fame - Candidate fame value.
 * @returns {number} Clamped non-negative fame value.
 */
export const clampPlayerFame = (fame: number): number => {
  if (!Number.isFinite(fame)) return 0
  return Math.max(0, Math.floor(fame))
}

export const FAME_PROGRESS_CONSTANTS = Object.freeze({
  GIG_BASE_REWARD: 100,
  GIG_SCORE_MULTIPLIER: 10,
  DIMINISHING_RETURNS_START: 30000,
  DIMINISHING_RETURNS_RATE: 0.0001
})

/**
 * Calculates the raw fame reward for a successful gig before any diminishing returns.
 * Tuned so the full fame catalog remains reachable in roughly 20-30 strong gigs.
 *
 * @param {number} performanceScore - Gig performance score.
 * @returns {number} Raw gig fame reward.
 */
export const calculateGigFameReward = (performanceScore: number): number => {
  const safePerformanceScore = Number.isFinite(performanceScore)
    ? Math.max(0, performanceScore)
    : 0

  return (
    FAME_PROGRESS_CONSTANTS.GIG_BASE_REWARD +
    Math.floor(
      safePerformanceScore * FAME_PROGRESS_CONSTANTS.GIG_SCORE_MULTIPLIER
    )
  )
}

/**
 * Calculates fame gain with exponential diminishing returns.
 * Ensures the logic is synced across the app and simulation.
 * @param {number} rawGain - The uncapped fame gain calculated from performance.
 * @param {number} currentFame - The player's current fame.
 * @param {number} [maxGain=2000] - Hard cap on raw gain.
 * @returns {number} The final damped fame gain.
 */
export const calculateFameGain = (
  rawGain: number,
  currentFame: number,
  maxGain = 2000
): number => {
  let fameGain = Math.min(maxGain, rawGain)
  const prevFame = currentFame ?? 0

  if (
    fameGain > 0 &&
    prevFame > FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_START
  ) {
    const diminishingMultiplier = Math.exp(
      -(prevFame - FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_START) *
        FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_RATE
    )
    fameGain = Math.max(1, Math.round(fameGain * diminishingMultiplier))
  }

  return fameGain
}

/**
 * Clamps a social controversy level to be between 0 and 100.
 *
 * @param {number} level - Candidate controversy level.
 * @returns {number} Clamped controversy level in range [0, 100].
 */
export const clampControversyLevel = (level: number): number => {
  if (!Number.isFinite(level)) return 0
  const safeLevel = Math.floor(level)
  return Math.max(0, Math.min(100, safeLevel))
}

/**
 * Clamps player money to a safe, non-negative integer.
 * Prevents negative balances and ensures integer boundaries.
 *
 * @param {number} money - Candidate money value.
 * @returns {number} Clamped money value ensuring non-negative integer.
 */
export const clampPlayerMoney = (money: number): number => {
  if (!Number.isFinite(money)) return 0
  return Math.floor(Math.max(0, money))
}

// Shared Balance Constants
export const BALANCE_CONSTANTS = {
  FAME_LOSS_BAD_GIG: 9,
  MAX_FAME_GAIN: 2000,
  LOW_HARMONY_THRESHOLD: 15,
  LOW_HARMONY_CANCELLATION_CHANCE: 0.2,
  // Miss-penalty on bad gigs (perfScore < 62)
  MISS_TOLERANCE: 8,
  MISS_PENALTY_RATE: 1.2, // fame loss per excess miss (was 0.5)
  MISS_MONEY_PENALTY: 12, // €12 per excess miss (direct money deduction)
  // Sponsor daily payout range (fame-scaled)
  SPONSORSHIP_PAYOUT_FLOOR: 200,
  SPONSORSHIP_PAYOUT_CAP: 380,
  // Wealth-scaled daily drain thresholds
  WEALTH_DRAIN_THRESHOLD: 2000,
  WEALTH_DRAIN_CHANCE: 0.12,
  WEALTH_DRAIN_MIN_RATE: 0.015,
  WEALTH_DRAIN_MAX_RATE: 0.05
}

export const RELATIONSHIP_GRUDGE_HOLDER_MULTIPLIER = 1.5
export const RELATIONSHIP_PEACEMAKER_POSITIVE_MULTIPLIER = 1.5
export const RELATIONSHIP_PEACEMAKER_NEGATIVE_MULTIPLIER = 0.5
export const RELATIONSHIP_DEFAULT_SCORE = 50
export const RELATIONSHIP_MIN_SCORE = 0
export const RELATIONSHIP_MAX_SCORE = 100

/**
 * Clamps band harmony to the canonical gameplay range.
 *
 * @param {number} harmony - Candidate harmony value.
 * @returns {number} Clamped harmony value in range [1, 100].
 */
export const clampBandHarmony = (harmony: number): number => {
  if (!Number.isFinite(harmony)) return 1
  const safeHarmony = Math.floor(harmony)
  return Math.max(1, Math.min(100, safeHarmony))
}

/**
 * Clamps van condition to the allowed percentage (0-100).
 *
 * @param {number} condition - Candidate condition value.
 * @returns {number} Clamped condition value.
 */
export const clampVanCondition = (condition: number): number => {
  if (!Number.isFinite(condition)) return 0
  return Math.floor(Math.max(0, Math.min(100, condition)))
}

/**
 * Clamps van fuel to the allowed capacity.
 *
 * @param {number} fuel - Candidate fuel value.
 * @param {number} maxFuel - Maximum capacity.
 * @returns {number} Clamped fuel value.
 */
export const clampVanFuel = (
  fuel: number,
  maxFuel = EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
): number => {
  if (!Number.isFinite(fuel)) return 0
  return Math.max(0, Math.min(maxFuel, fuel))
}

/**
 * Applies an inventory delta to a single inventory slot.
 * @param {boolean|number|undefined} currentValue - Existing inventory value.
 * @param {boolean|number} deltaValue - Delta to apply.
 * @returns {boolean|number|undefined} Updated inventory value.
 */
export const applyInventoryItemDelta = (
  currentValue: boolean | number | undefined,
  deltaValue: boolean | number
): boolean | number | undefined => {
  if (deltaValue === true || deltaValue === false) {
    return deltaValue
  }

  if (typeof deltaValue === 'number') {
    const currentCount = typeof currentValue === 'number' ? currentValue : 0
    return Math.max(0, currentCount + deltaValue)
  }

  return currentValue
}

/**
 * A hardened Set of prohibited object property keys used during state-merge operations.
 * Explicitly guards against prototype pollution vulnerabilities by blocking recursive assignment
 * into sensitive prototype traversal chains (e.g. `__proto__`, `constructor`, `prototype`).
 * Usage ensures event deltas cannot maliciously or accidentally mutate the global Object space.
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
export const isForbiddenKey = (key: string): boolean => FORBIDDEN_KEYS.has(key)

/**
 * Applies event delta changes to the current game state.
 * Prevents prototype pollution and merges object properties.
 *
 * @param {object} state - Current game state.
 * @param {object} delta - Event delta payload.
 * @returns {object} Updated game state.
 */

const calculateClampedStatDelta = (
  currentValue: number | null | undefined,
  deltaValue: number
): number => {
  const baseValue = typeof currentValue === 'number' ? currentValue : 0
  const nextValue = Math.max(0, baseValue + deltaValue)
  return nextValue - baseValue
}

const calculateClampedControversyDelta = (
  currentValue: number | null | undefined,
  deltaValue: number
): number => {
  const baseValue = typeof currentValue === 'number' ? currentValue : 0
  const nextValue = clampControversyLevel(baseValue + deltaValue)
  return nextValue - baseValue
}

/**
 * Copies enumerable own properties from source to a new object, filtering out forbidden keys.
 * @param {object} source - Source object to copy from.
 * @returns {object} New object with filtered properties.
 */
type FilteredRecord = Record<string, unknown>

type RelationshipChange = {
  member1: string
  member2: string
  change: number
}

type MemberDelta = FilteredRecord & {
  moodChange?: number
  staminaChange?: number
}

type EventDelta = {
  score?: number
  player?: FilteredRecord & {
    money?: number
    time?: number
    fame?: number
    score?: number
    day?: number
    location?: string
    currentNodeId?: string
    stats?: Record<string, string | number | boolean>
    van?: {
      fuel?: number
      condition?: number
      [key: string]: unknown
    }
  }
  band?: FilteredRecord & {
    harmony?: number
    inventory?: Record<string, unknown>
    members?: unknown
    membersDelta?: unknown
    relationshipChange?: unknown
    luck?: number
    skill?: number
    stashRemove?: unknown[]
  }
  social?: Record<string, unknown> & {
    controversyLevel?: number
    viral?: number
    loyalty?: number
  }
  flags?: FilteredRecord & {
    addStoryFlag?: unknown
    queueEvent?: unknown
    addCooldown?: unknown
  }
}

type MutableGameState = GameState & {
  player: GameState['player'] & {
    stats: Record<string, string | number | boolean | unknown>
  }
  band: GameState['band'] & {
    inventory: Record<string, boolean | number | unknown>
    stash: Record<string, unknown>
  }
  social: GameState['social'] & Record<string, unknown>
  activeStoryFlags: string[]
  pendingEvents: unknown[]
  eventCooldowns: string[]
}

type DeltaPreviewState = {
  player?: Record<string, unknown> & {
    money?: number
    time?: number
    fame?: number
    score?: number
    day?: number
    stats?: Record<string, string | number | boolean | unknown>
    van?: Record<string, unknown>
  }
  band?: Record<string, unknown> & {
    harmony?: number
    members?: Array<Partial<BandMember> | null | undefined>
    inventory?: Record<string, unknown>
    luck?: number
    skill?: number
  }
  social?: Record<string, unknown> & {
    controversyLevel?: number
    viral?: number
    loyalty?: number
  }
}

type AppliedDelta = {
  player: FilteredRecord & { van?: FilteredRecord; stats?: FilteredRecord }
  band: FilteredRecord & {
    inventory?: FilteredRecord
    members?: FilteredRecord[]
    membersDelta?: FilteredRecord[]
    relationshipChange?: RelationshipChange[] | FilteredRecord
  }
  social: FilteredRecord
  flags?: FilteredRecord
  score?: number
}

const copyFilteredProperties = (source: unknown): FilteredRecord => {
  if (typeof source !== 'object' || source === null) return Object.create(null)

  // Explicit check for prototype pollution before copying properties
  if (
    Object.hasOwn(source, '__proto__') ||
    Object.hasOwn(source, 'constructor') ||
    Object.hasOwn(source, 'prototype')
  ) {
    logger?.warn?.(
      'Security',
      'Blocked attempt to copy prototype properties in copyFilteredProperties'
    )
  }

  // Create an object with no prototype to safely copy properties into
  const destination: FilteredRecord = Object.create(null)
  const sourceRecord = source as Record<string, unknown>

  for (const key in sourceRecord) {
    if (!Object.hasOwn(sourceRecord, key)) continue
    if (!isForbiddenKey(key)) {
      destination[key] = sourceRecord[key]
    }
  }
  return destination
}

const asMemberDelta = (value: unknown): MemberDelta | null =>
  isPlainObject(value) ? value : null

const isRelationshipChange = (value: unknown): value is RelationshipChange => {
  if (!isPlainObject(value)) return false
  return (
    typeof value.member1 === 'string' &&
    typeof value.member2 === 'string' &&
    typeof value.change === 'number'
  )
}

export const calculateAppliedDelta = (
  state: DeltaPreviewState,
  delta: EventDelta
): AppliedDelta => {
  const applied: AppliedDelta = { player: {}, band: {}, social: {} }

  if (delta.flags) {
    applied.flags = copyFilteredProperties(delta.flags)
  } else {
    applied.flags = {}
  }

  if (delta.player) {
    if (typeof delta.player.money === 'number') {
      const currentMoney = Math.max(
        0,
        typeof state.player?.money === 'number' ? state.player.money : 0
      )
      const nextMoney = clampPlayerMoney(currentMoney + delta.player.money)
      applied.player.money = nextMoney - currentMoney
    }
    if (typeof delta.player.time === 'number') {
      applied.player.time = delta.player.time // time is unbounded
    }
    if (typeof delta.player.fame === 'number') {
      const currentFame = Math.max(
        0,
        typeof state.player?.fame === 'number' ? state.player.fame : 0
      )
      const nextFame = clampPlayerFame(currentFame + delta.player.fame)
      applied.player.fame = nextFame - currentFame
    }
    const scoreDelta =
      typeof delta.player?.score === 'number'
        ? delta.player.score
        : typeof delta.score === 'number'
          ? delta.score
          : 0
    if (scoreDelta !== 0) {
      const currentScore =
        typeof state.player?.score === 'number' ? state.player.score : 0
      const nextScore = Math.max(0, currentScore + scoreDelta)
      applied.score = nextScore - currentScore
    }
    if (delta.player.van) {
      applied.player.van = {}
      if (typeof delta.player.van.fuel === 'number') {
        const currentFuel =
          typeof state.player?.van?.fuel === 'number'
            ? state.player.van.fuel
            : 0
        const nextFuel = clampVanFuel(currentFuel + delta.player.van.fuel)
        applied.player.van.fuel = nextFuel - currentFuel
      }
      if (typeof delta.player.van.condition === 'number') {
        const currentCondition =
          typeof state.player?.van?.condition === 'number'
            ? state.player.van.condition
            : 0
        const nextCondition = clampVanCondition(
          currentCondition + delta.player.van.condition
        )
        applied.player.van.condition = nextCondition - currentCondition
      }
    }
    if (typeof delta.player.day === 'number') {
      applied.player.day = delta.player.day
    }
    if (delta.player.stats) {
      applied.player.stats = copyFilteredProperties(delta.player.stats)
    }
  }

  if (delta.social) {
    if (typeof delta.social.controversyLevel === 'number') {
      applied.social.controversyLevel = calculateClampedControversyDelta(
        state.social?.controversyLevel,
        delta.social.controversyLevel
      )
    }
    if (typeof delta.social.viral === 'number') {
      applied.social.viral = calculateClampedStatDelta(
        state.social?.viral,
        delta.social.viral
      )
    }
    if (typeof delta.social.loyalty === 'number') {
      applied.social.loyalty = calculateClampedStatDelta(
        state.social?.loyalty,
        delta.social.loyalty
      )
    }
  }

  if (delta.band) {
    if (typeof delta.band.harmony === 'number') {
      const currentHarmony = clampBandHarmony(state.band?.harmony ?? 1)
      const nextHarmony = clampBandHarmony(currentHarmony + delta.band.harmony)
      applied.band.harmony = nextHarmony - currentHarmony
    }

    // Inventory
    if (delta.band.inventory) {
      applied.band.inventory = {}
      // Optimization: using Object.keys avoids prototype chain traversal and Object.hasOwn checks
      const inventoryKeys = Object.keys(delta.band.inventory)
      for (let i = 0; i < inventoryKeys.length; i++) {
        const itemId = inventoryKeys[i]
        if (!itemId) continue
        if (isForbiddenKey(itemId)) continue

        const qty = delta.band.inventory[itemId]
        const currentCount =
          typeof state.band?.inventory?.[itemId] === 'number'
            ? state.band.inventory[itemId]
            : 0

        if (typeof qty === 'number') {
          if (qty !== 0) {
            const nextCount = Math.max(0, currentCount + qty)
            const actualChange = nextCount - currentCount
            if (actualChange !== 0) {
              applied.band.inventory[itemId] = actualChange
            }
          }
        } else if (qty === true) {
          applied.band.inventory[itemId] = true
        } else if (qty === false) {
          if (currentCount > 0) {
            applied.band.inventory[itemId] = -currentCount
          } else {
            applied.band.inventory[itemId] = false
          }
        }
      }
    }

    const membersDelta =
      delta.band.membersDelta !== undefined
        ? delta.band.membersDelta
        : delta.band.members

    if (
      membersDelta &&
      (Array.isArray(membersDelta) || isPlainObject(membersDelta))
    ) {
      const isArrayDelta = Array.isArray(membersDelta)
      const members = Array.isArray(state.band?.members)
        ? state.band.members
        : []

      const computedMembersDelta: FilteredRecord[] = []

      for (let i = 0; i < members.length; i++) {
        const member = members[i]
        if (!member) {
          computedMembersDelta.push(Object.create(null))
          continue
        }
        const rawMemberDelta = isArrayDelta ? membersDelta[i] : membersDelta
        const memberDelta = asMemberDelta(rawMemberDelta)
        const mDelta = memberDelta
          ? copyFilteredProperties(memberDelta)
          : Object.create(null)

        const moodChange =
          typeof mDelta.moodChange === 'number' ? mDelta.moodChange : 0
        const staminaChange =
          typeof mDelta.staminaChange === 'number' ? mDelta.staminaChange : 0

        const currentMood = typeof member.mood === 'number' ? member.mood : 0
        const currentStamina =
          typeof member.stamina === 'number' ? member.stamina : 0
        const staminaMax =
          typeof member.staminaMax === 'number' ? member.staminaMax : 100

        const newMood = clampMemberMood(currentMood + moodChange)
        const newStamina = clampMemberStamina(
          currentStamina + staminaChange,
          staminaMax
        )

        const actualMoodChange = newMood - currentMood
        const actualStaminaChange = newStamina - currentStamina

        // Keep all other properties of the original delta, override only mood and stamina if they exist
        const newDelta = copyFilteredProperties(mDelta)
        if (typeof mDelta.moodChange === 'number')
          newDelta.moodChange = actualMoodChange
        if (typeof mDelta.staminaChange === 'number')
          newDelta.staminaChange = actualStaminaChange

        computedMembersDelta.push(newDelta)
      }

      // We always resolve to an array delta because global deltas apply differently to each member based on clamps
      applied.band.membersDelta = computedMembersDelta
    }

    if (typeof delta.band.luck === 'number') {
      const currentLuck =
        typeof state.band?.luck === 'number' ? state.band.luck : 0
      const nextLuck = Math.max(0, currentLuck + delta.band.luck)
      applied.band.luck = nextLuck - currentLuck
    }

    if (typeof delta.band.skill === 'number') {
      const members = Array.isArray(state.band?.members)
        ? state.band.members
        : []
      let totalSkillDelta = 0
      applied.band.members = []
      for (let i = 0; i < members.length; i++) {
        const member = members[i]
        if (!member) continue
        const currentSkill =
          member.baseStats && typeof member.baseStats.skill === 'number'
            ? member.baseStats.skill
            : 5
        const nextSkill = Math.max(
          1,
          Math.min(10, currentSkill + delta.band.skill)
        )
        const memberDelta = nextSkill - currentSkill
        applied.band.members.push({ skill: memberDelta })
        totalSkillDelta += memberDelta
      }
      const validCount = applied.band.members.length
      if (validCount > 0) {
        applied.band.skill = Math.round(totalSkillDelta / validCount)
      }
    }

    if (delta.band.relationshipChange) {
      const isNotSelfRelationship = (rc: RelationshipChange) =>
        rc.member1 !== rc.member2
      if (Array.isArray(delta.band.relationshipChange)) {
        applied.band.relationshipChange = delta.band.relationshipChange.filter(
          rc =>
            isRelationshipChange(rc) &&
            isNotSelfRelationship(rc as RelationshipChange)
        )
      } else {
        applied.band.relationshipChange =
          isRelationshipChange(delta.band.relationshipChange) &&
          isNotSelfRelationship(
            delta.band.relationshipChange as RelationshipChange
          )
            ? [delta.band.relationshipChange]
            : []
      }
    }
  }

  return applied
}

/**
 * Calculates the relationship change between members.
 *
 * @param {object} change - The relationship change data.
 * @param {string} memberName - The name of the member being evaluated.
 * @param {boolean} hasGrudgeHolder - If the member has grudge_holder trait.
 * @param {boolean} hasPeacemaker - If the member has peacemaker trait.
 * @param {object} currentRelationships - The current relationships of the member.
 * @returns {object|null} The calculated change or null if none.
 */
export const calculateMemberRelationshipChange = (
  change: RelationshipChange,
  memberName: string,
  hasGrudgeHolder: boolean,
  hasPeacemaker: boolean,
  currentRelationships: Record<string, number>
): { other: string; newScore: number } | null => {
  const isM1 = change.member1 === memberName
  const isM2 = change.member2 === memberName

  if (!isM1 && !isM2) return null

  const other = isM1 ? change.member2 : change.member1
  if (isForbiddenKey(other)) return null

  let amount = change.change
  // Apply traits
  if (amount < 0 && hasGrudgeHolder) {
    amount *= RELATIONSHIP_GRUDGE_HOLDER_MULTIPLIER
  }
  if (amount > 0 && hasPeacemaker) {
    amount *= RELATIONSHIP_PEACEMAKER_POSITIVE_MULTIPLIER
  }
  if (amount < 0 && hasPeacemaker) {
    amount *= RELATIONSHIP_PEACEMAKER_NEGATIVE_MULTIPLIER
  }

  const currentScore = currentRelationships[other] ?? RELATIONSHIP_DEFAULT_SCORE
  const newScore = Math.max(
    RELATIONSHIP_MIN_SCORE,
    Math.min(RELATIONSHIP_MAX_SCORE, Math.round(currentScore + amount))
  )

  return { other, newScore }
}

export const applyEventDelta = (
  state: MutableGameState,
  delta: EventDelta
): MutableGameState => {
  const nextState: MutableGameState = { ...state }

  if (delta.player) {
    const nextPlayer = { ...nextState.player }
    if (typeof delta.player.money === 'number') {
      const nextMoney = clampPlayerMoney(nextPlayer.money + delta.player.money)
      nextPlayer.money = nextMoney
    }
    if (typeof delta.player.time === 'number') {
      nextPlayer.time = nextPlayer.time + delta.player.time
    }
    if (typeof delta.player.fame === 'number') {
      nextPlayer.fame = clampPlayerFame(nextPlayer.fame + delta.player.fame)
      nextPlayer.fameLevel = calculateFameLevel(nextPlayer.fame)
    }
    const scoreDelta =
      typeof delta.player.score === 'number'
        ? delta.player.score
        : typeof delta.score === 'number'
          ? delta.score
          : 0

    if (scoreDelta !== 0) {
      const boundedScore = clampNonNegative(nextPlayer.score)
      nextPlayer.score = boundedScore + scoreDelta
    }

    // Player Stats
    if (delta.player.stats) {
      nextPlayer.stats = { ...nextPlayer.stats }
      const statKeys = Object.keys(delta.player.stats)
      for (let i = 0; i < statKeys.length; i++) {
        const key = statKeys[i]
        if (!key) continue
        if (isForbiddenKey(key)) continue

        const statDelta = delta.player.stats[key]
        if (typeof statDelta === 'number') {
          const currentStat =
            typeof nextPlayer.stats[key] === 'number'
              ? nextPlayer.stats[key]
              : 0
          const boundedStat = clampNonNegative(currentStat)
          nextPlayer.stats[key] = boundedStat + statDelta
        } else if (
          typeof statDelta === 'string' ||
          typeof statDelta === 'boolean'
        ) {
          nextPlayer.stats[key] = statDelta
        }
      }
    }

    if (delta.player.van) {
      const nextVan = { ...nextPlayer.van }
      if (typeof delta.player.van.fuel === 'number') {
        nextVan.fuel = clampVanFuel(nextVan.fuel + delta.player.van.fuel)
      }
      if (typeof delta.player.van.condition === 'number') {
        const nextCondition = clampVanCondition(
          nextVan.condition + delta.player.van.condition
        )
        nextVan.condition = nextCondition
      }
      nextPlayer.van = nextVan
    }
    if (delta.player.location) nextPlayer.location = delta.player.location
    if (delta.player.currentNodeId)
      nextPlayer.currentNodeId = delta.player.currentNodeId
    if (typeof delta.player.day === 'number')
      nextPlayer.day = nextPlayer.day + delta.player.day

    nextState.player = nextPlayer
  }

  if (delta.band) {
    const nextBand = { ...nextState.band }
    if (typeof delta.band.harmony === 'number') {
      const nextHarmony = clampBandHarmony(
        nextBand.harmony + delta.band.harmony
      )
      nextBand.harmony = nextHarmony
    }

    const membersDelta = delta.band.membersDelta ?? delta.band.members

    const isNotSelfRelationship = (rc: RelationshipChange) =>
      rc.member1 !== rc.member2

    const relationshipChange = Array.isArray(delta.band.relationshipChange)
      ? delta.band.relationshipChange.filter(
          rc =>
            isRelationshipChange(rc) &&
            isNotSelfRelationship(rc as RelationshipChange)
        )
      : isRelationshipChange(delta.band.relationshipChange) &&
          isNotSelfRelationship(
            delta.band.relationshipChange as RelationshipChange
          )
        ? [delta.band.relationshipChange]
        : []
    const skillDelta = delta.band.skill

    if (
      membersDelta ||
      relationshipChange.length > 0 ||
      typeof skillDelta === 'number'
    ) {
      const isArrayDelta = Array.isArray(membersDelta)
      const memberCount = nextBand.members.length
      let updatedMembers: BandMember[] | null = null
      let bandChanged = false

      for (let i = 0; i < memberCount; i++) {
        const member = nextBand.members[i]
        if (!member) continue
        let nextMember = member
        let memberHasChanges = false

        // 1. Mood & Stamina
        if (
          membersDelta &&
          (Array.isArray(membersDelta) || isPlainObject(membersDelta))
        ) {
          const rawMemberDelta = isArrayDelta ? membersDelta[i] : membersDelta
          const mDelta = asMemberDelta(rawMemberDelta) ?? Object.create(null)
          const moodChange =
            typeof mDelta.moodChange === 'number' ? mDelta.moodChange : 0
          const staminaChange =
            typeof mDelta.staminaChange === 'number' ? mDelta.staminaChange : 0

          if (moodChange !== 0 || staminaChange !== 0) {
            const newMood = clampMemberMood(member.mood + moodChange)
            const newStamina = clampMemberStamina(
              member.stamina + staminaChange,
              member.staminaMax
            )

            if (newMood !== member.mood || newStamina !== member.stamina) {
              nextMember = { ...nextMember, mood: newMood, stamina: newStamina }
              memberHasChanges = true
            }
          }
        }

        // 2. Relationships
        if (relationshipChange.length > 0) {
          let newRelationships: Record<string, number> | null = null
          const hasGrudgeHolder = hasTrait(member, 'grudge_holder')
          const hasPeacemaker = hasTrait(member, 'peacemaker')
          const memberName =
            typeof member.name === 'string'
              ? member.name
              : typeof member.id === 'string'
                ? member.id
                : ''

          for (let j = 0; j < relationshipChange.length; j++) {
            const change = relationshipChange[j]
            if (!change || !memberName) continue
            const relSource = newRelationships || nextMember.relationships || {}

            const result = calculateMemberRelationshipChange(
              change,
              memberName,
              hasGrudgeHolder,
              hasPeacemaker,
              relSource
            )

            if (result) {
              const { other, newScore } = result
              const oldExists = Object.hasOwn(relSource, other)

              if (oldExists || newScore !== RELATIONSHIP_DEFAULT_SCORE) {
                if (!newRelationships) {
                  newRelationships = { ...(nextMember.relationships || {}) }
                }
                newRelationships[other] = newScore
              }
            }
          }

          if (newRelationships) {
            let relationshipsActuallyChanged = false
            const newRelKeys = Object.keys(newRelationships)
            for (let k = 0; k < newRelKeys.length; k++) {
              const key = newRelKeys[k]
              if (!key) continue
              if (newRelationships[key] !== member.relationships?.[key]) {
                relationshipsActuallyChanged = true
                break
              }
            }

            if (relationshipsActuallyChanged) {
              if (nextMember === member) nextMember = { ...member }
              nextMember.relationships = newRelationships
              memberHasChanges = true
            }
          }
        }

        // 3. Skill
        if (typeof skillDelta === 'number' && skillDelta !== 0) {
          const currentSkill =
            member.baseStats && typeof member.baseStats.skill === 'number'
              ? member.baseStats.skill
              : 5
          const newSkill = Math.max(1, Math.min(10, currentSkill + skillDelta))

          if (newSkill !== currentSkill) {
            if (nextMember === member) nextMember = { ...member }
            nextMember.baseStats = {
              ...(nextMember.baseStats ?? {}),
              skill: newSkill
            }
            memberHasChanges = true
          }
        }

        if (memberHasChanges) {
          if (!bandChanged) {
            bandChanged = true
            updatedMembers = [...nextBand.members]
          }
          // updatedMembers is initialized above when bandChanged flips to true
          if (updatedMembers) {
            updatedMembers[i] = nextMember
          }
        } else if (bandChanged) {
          // If bandChanged already true, ensure updatedMembers exists then assign
          if (!updatedMembers) updatedMembers = [...nextBand.members]
          updatedMembers[i] = member
        }
      }

      if (bandChanged && updatedMembers) {
        nextBand.members = updatedMembers
      }
    }

    if (delta.band.inventory) {
      nextBand.inventory = { ...nextBand.inventory }
      const bandInventoryKeys = Object.keys(delta.band.inventory)
      for (let i = 0; i < bandInventoryKeys.length; i++) {
        const item = bandInventoryKeys[i]
        if (!item) continue
        if (isForbiddenKey(item)) continue
        const val = delta.band.inventory[item]
        if (typeof val !== 'number' && typeof val !== 'boolean') continue
        const currentInventoryValue = nextBand.inventory[item]
        const currentValue =
          typeof currentInventoryValue === 'number' ||
          typeof currentInventoryValue === 'boolean'
            ? currentInventoryValue
            : undefined
        nextBand.inventory[item] = applyInventoryItemDelta(currentValue, val)
      }
    }

    if (delta.band.stashRemove && Array.isArray(delta.band.stashRemove)) {
      nextBand.stash = Object.assign(Object.create(null), nextBand.stash || {})
      for (let i = 0; i < delta.band.stashRemove.length; i++) {
        const itemId = delta.band.stashRemove[i]
        if (!itemId) continue
        if (typeof itemId === 'string' && !isForbiddenKey(itemId)) {
          delete nextBand.stash[itemId]
        }
      }
    }

    if (typeof delta.band.luck === 'number') {
      const boundedLuck = clampNonNegative(nextBand.luck)
      nextBand.luck = boundedLuck + delta.band.luck
    }
    nextState.band = nextBand
  }

  if (delta.social) {
    const nextSocial = { ...nextState.social }
    const socialKeys = Object.keys(delta.social)
    for (let i = 0; i < socialKeys.length; i++) {
      const key = socialKeys[i]
      if (!key) continue
      if (isForbiddenKey(key)) continue
      const value = delta.social[key]

      if (key === 'controversyLevel') {
        if (typeof value === 'number') {
          const newValue = clampControversyLevel(
            (typeof nextSocial[key] === 'number' ? nextSocial[key] : 0) + value
          )
          nextSocial[key] = newValue
        }
      } else if (key === 'influencers') {
        if (isPlainObject(value)) {
          const safeInfluencersUpdate: Record<
            string,
            Record<string, unknown>
          > = Object.create(null)
          for (const influencerId of Object.keys(value)) {
            if (isForbiddenKey(influencerId)) continue
            const influencerValue = value[influencerId]
            if (isPlainObject(influencerValue)) {
              safeInfluencersUpdate[influencerId] =
                copyFilteredProperties(influencerValue)
            }
          }
          nextSocial.influencers = {
            ...nextSocial.influencers,
            ...safeInfluencersUpdate
          }
        }
      } else if (key === 'egoFocus') {
        if (value === null || typeof value === 'string') {
          nextSocial[key] = value
        }
      } else if (key === 'trend') {
        if (typeof value === 'string') {
          nextSocial[key] = value
        }
      } else if (key === 'lastGigDay' || key === 'lastGigDifficulty') {
        if (
          value === null ||
          (typeof value === 'number' && Number.isFinite(value))
        ) {
          nextSocial[key] = value
        }
      } else if (typeof value === 'number') {
        const currentValue =
          typeof nextSocial[key] === 'number' ? nextSocial[key] : 0
        nextSocial[key] = Math.max(0, currentValue + value)
      }
    }
    nextState.social = nextSocial
  }

  if (delta.flags) {
    if (typeof delta.flags.addStoryFlag === 'string') {
      if (!nextState.activeStoryFlags.includes(delta.flags.addStoryFlag)) {
        nextState.activeStoryFlags = [
          ...nextState.activeStoryFlags,
          delta.flags.addStoryFlag
        ]
      }
    }
    if (typeof delta.flags.queueEvent === 'string') {
      nextState.pendingEvents = [
        ...nextState.pendingEvents,
        delta.flags.queueEvent
      ]
    }
    if (typeof delta.flags.addCooldown === 'string') {
      if (!nextState.eventCooldowns.includes(delta.flags.addCooldown)) {
        nextState.eventCooldowns = [
          ...nextState.eventCooldowns,
          delta.flags.addCooldown
        ]
      }
    }
  }

  return nextState
}

/**
 * Checks if a collection (Set or Array) contains an item.
 * Used primarily for optimizedState which passes Sets instead of Arrays for performance.
 *
 * @param {Set|Array} collection - The collection to check.
 * @param {any} item - The item to look for.
 * @returns {boolean} True if the collection contains the item.
 */
export const hasStateItem = (
  collection: Set<unknown> | unknown[] | null | undefined,
  item: unknown
): boolean => {
  return collection instanceof Set
    ? collection.has(item)
    : (collection || []).includes(item)
}

/**
 * Checks if the player has an active, non-expired sponsorship brand deal.
 * activeDeals stores deal objects with { id, type, remainingGigs, ... }.
 * Deals with remainingGigs <= 0 are considered expired even if not yet filtered.
 * @param {object} socialState
 * @returns {boolean}
 */
type SponsorshipDealLike = {
  type?: unknown
  remainingGigs?: unknown
}

export const hasActiveSponsorship = (
  socialState: { activeDeals?: unknown[] } | null | undefined
): boolean => {
  if (!Array.isArray(socialState?.activeDeals)) {
    return false
  }
  return socialState.activeDeals.some(deal => {
    if (!isPlainObject(deal)) return false
    const d: SponsorshipDealLike = deal
    return (
      d.type === 'SPONSORSHIP' &&
      (typeof d.remainingGigs === 'number' ? d.remainingGigs : 1) > 0
    )
  })
}

/**
 * Normalizes an unknown setlist payload to an array of objects with an 'id' property.
 * @param {unknown} setlist - The setlist payload to normalize.
 * @returns {Array<{ id: string }>} Normalized setlist.
 */
export const normalizeSetlistForSave = (
  setlist: unknown
): Array<{ id: string }> => {
  if (!Array.isArray(setlist)) return []

  const result: { id: string }[] = []
  for (const song of setlist) {
    if (typeof song === 'string') {
      result.push({ id: song })
    } else if (
      song &&
      typeof song === 'object' &&
      typeof (song as { id?: unknown }).id === 'string'
    ) {
      result.push({ id: (song as { id: string }).id })
    }
  }
  return result
}
