import { CHARACTERS } from '../data/characters'
import { calculateGuaranteedDailyCost } from './economyEngine'
import { applyReputationDecay } from './socialEngine'
import { calcBaseBreakdownChance } from './upgradeUtils'
import { hasTrait } from './traitUtils'
import { getSafeRandom } from './crypto'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampVanCondition,
  clampMemberStamina,
  clampMemberMood,
  BALANCE_CONSTANTS,
  finiteNumberOr
} from './gameState'
import type { PlayerState, BandState, GameState, SocialState } from '../types'

/**
 * Calculates daily state updates including costs, mood drift, and decay.
 * @param currentState - The full state before update.
 * @param rng - Random number generator for determinism. Defaults to `getSafeRandom`.
 * @returns Partial next-state slices for player, band, and social updates.
 */
const CONTROVERSY_ACCELERATED_DECAY_THRESHOLD = 55
const CONTROVERSY_ACCELERATED_DECAY_AMOUNT = 3
const CONTROVERSY_NORMAL_DECAY_AMOUNT = 1

const updatePlayerFinances = (
  nextPlayer: PlayerState,
  nextBand: BandState,
  nextSocial: SocialState,
  rng: () => number
) => {
  let dailyCost = calculateGuaranteedDailyCost(nextPlayer, nextBand, nextSocial)

  // Newsletter Merch Sales Perk (Note: Can result in net daily income/negative dailyCost)
  if ((nextSocial.newsletter || 0) >= 1000 && rng() < 0.3) {
    dailyCost -= Math.floor((nextSocial.newsletter || 0) / 100) * 5
  }

  const nextMoney = clampPlayerMoney(
    finiteNumberOr(nextPlayer.money, 0) - dailyCost
  )
  nextPlayer.money = nextMoney

  // Wealth-Scaled Daily Expense Drain — only surplus above threshold is taxed
  // so the threshold feels like a floor, not a cliff.
  if (
    nextPlayer.money > BALANCE_CONSTANTS.WEALTH_DRAIN_THRESHOLD &&
    rng() < BALANCE_CONSTANTS.WEALTH_DRAIN_CHANCE
  ) {
    const drainRate =
      BALANCE_CONSTANTS.WEALTH_DRAIN_MIN_RATE +
      rng() *
        (BALANCE_CONSTANTS.WEALTH_DRAIN_MAX_RATE -
          BALANCE_CONSTANTS.WEALTH_DRAIN_MIN_RATE)
    const taxableWealth =
      nextPlayer.money - BALANCE_CONSTANTS.WEALTH_DRAIN_THRESHOLD
    const expense = Math.round(taxableWealth * drainRate)
    nextPlayer.money = clampPlayerMoney(
      finiteNumberOr(nextPlayer.money, 0) - expense
    )
  }
}

const updateVanCondition = (
  nextPlayer: PlayerState,
  controversySnapshot: number
) => {
  // Flat daily van wear — applied every day tick regardless of distance
  // traveled (days mostly advance through travel, so this approximates
  // per-trip wear; it is intentionally not distance-scaled).
  if (nextPlayer.van) {
    nextPlayer.van = { ...nextPlayer.van }
    nextPlayer.van.condition = clampVanCondition(
      (nextPlayer.van.condition ?? 100) - 2
    )
    // Increased breakdown chance when condition is low
    // Calculate base breakdown chance from upgrades every day to avoid compounding multipliers.
    const baseBreakdownChance = calcBaseBreakdownChance(
      nextPlayer.van.upgrades ?? []
    )

    let conditionMultiplier: number
    if (nextPlayer.van.condition < 30) {
      // Very low condition: significantly higher chance to break down
      conditionMultiplier = 3.0
    } else if (nextPlayer.van.condition < 60) {
      // Worn condition: moderately higher chance
      conditionMultiplier = 1.6
    } else {
      // Good condition: baseline chance
      conditionMultiplier = 1.0
    }

    // Controversy penalty: Stress/rush jobs lead to neglected maintenance
    if (controversySnapshot >= 80) conditionMultiplier += 0.5
    else if (controversySnapshot >= 50) conditionMultiplier += 0.2

    const adjustedBreakdownChance = baseBreakdownChance * conditionMultiplier
    // Clamp to a reasonable range so chance stays between 0% and 50%
    nextPlayer.van.breakdownChance = Math.max(
      0,
      Math.min(0.5, Math.round(adjustedBreakdownChance * 100) / 100)
    )
  }
}

const updateBandHarmony = (
  nextPlayer: PlayerState,
  nextBand: BandState,
  nextSocial: SocialState,
  controversySnapshot: number,
  rng: () => number,
  pendingFlags: Record<string, boolean>
) => {
  // Normalize a possibly non-finite persisted harmony up front so every
  // arithmetic-then-clamp below operates on a finite value (AGENTS.md §101).
  // The `> 50` / `< 50` guards already skip the decay/regen branch for NaN, but
  // the bad-show, ego, and controversy clamps further down are unguarded.
  nextBand.harmony = finiteNumberOr(nextBand.harmony, 1)

  // Harmony Decay (Drifts towards 50 like mood)
  if (nextBand.harmony > 50) {
    const nextHarmonyDecay = clampBandHarmony(
      Math.max(50, nextBand.harmony - 2)
    )
    nextBand.harmony = nextHarmonyDecay
  } else if (nextBand.harmony < 50) {
    const nextHarmonyRegen = clampBandHarmony(
      Math.min(50, nextBand.harmony + 3)
    )
    nextBand.harmony = nextHarmonyRegen
  }

  // Bad Show Streak Penalty
  if ((nextPlayer.stats?.consecutiveBadShows || 0) > 0) {
    const nextHarmonyBadShows = clampBandHarmony(
      nextBand.harmony - Math.min(10, nextPlayer.stats.consecutiveBadShows * 2)
    )
    nextBand.harmony = nextHarmonyBadShows
  }

  // Ego System Drain (Lead Singer Syndrome)
  if (nextSocial.egoFocus) {
    const nextHarmonyEgo = clampBandHarmony(nextBand.harmony - 2) // Passive drain for spotlighting a single member
    nextBand.harmony = nextHarmonyEgo
    // Proactive scandal trigger (12% daily chance)
    if (rng() < 0.12) {
      pendingFlags.scandal = true
    }
    // Passive decay chance (20% per day to forget the drama)
    if (rng() < 0.2) {
      nextSocial.egoFocus = null
    }
  }

  if (controversySnapshot >= 50) {
    // Harmony drain is worse under stress
    const nextHarmonyControversy = clampBandHarmony(nextBand.harmony - 1)
    nextBand.harmony = nextHarmonyControversy
  }

  // Clamp harmony to valid range after all modifications
  const nextHarmonySafeguard = clampBandHarmony(nextBand.harmony)
  nextBand.harmony = nextHarmonySafeguard
}

const updateSocialDecay = (
  nextPlayer: PlayerState,
  nextSocial: SocialState,
  rng: () => number
) => {
  // 3. Social Decay
  // finiteNumberOr also rejects Infinity, which `|| 0` would let through.
  nextSocial.viral = finiteNumberOr(nextSocial.viral, 0)
  // Viral decay
  if (nextSocial.viral > 0) nextSocial.viral -= 1

  // Controversy/Shadowban Decay
  // Note: Intentionally using the live nextSocial.controversyLevel here (not the snapshot)
  // so the daily decay is correctly applied to the actual state value.
  if (nextSocial.controversyLevel > 0) {
    // Passive cooldown — accelerated above threshold to prevent death spirals
    const decayAmount =
      nextSocial.controversyLevel > CONTROVERSY_ACCELERATED_DECAY_THRESHOLD
        ? CONTROVERSY_ACCELERATED_DECAY_AMOUNT
        : CONTROVERSY_NORMAL_DECAY_AMOUNT
    nextSocial.controversyLevel = Math.max(
      0,
      nextSocial.controversyLevel - decayAmount
    )
  }

  // Reputation cooldown decay
  if ((nextSocial.reputationCooldown || 0) > 0) {
    nextSocial.reputationCooldown = Math.max(
      0,
      nextSocial.reputationCooldown - 1
    )
  }

  // TikTok Viral Surge Perk
  if ((nextSocial.tiktok || 0) > 10000 && rng() < 0.05) {
    nextSocial.viral += 1 // Free viral token
  }

  // Follower decay for inactive platforms (days since last gig approximated by day count)
  // Apply mild organic decay every 3+ days to prevent stale follower counts
  const daysSinceActivity =
    nextPlayer.day - (nextSocial.lastGigDay ?? nextPlayer.day)
  if (daysSinceActivity >= 3) {
    nextSocial.instagram = applyReputationDecay(
      nextSocial.instagram || 0,
      daysSinceActivity
    )
    nextSocial.tiktok = applyReputationDecay(
      nextSocial.tiktok || 0,
      daysSinceActivity
    )
    nextSocial.youtube = applyReputationDecay(
      nextSocial.youtube || 0,
      daysSinceActivity
    )
    // Newsletter decay (often overlooked, now explicit)
    nextSocial.newsletter = applyReputationDecay(
      nextSocial.newsletter || 0,
      daysSinceActivity
    )
  }
}

const updatePassiveEffectsAndMembers = (
  nextPlayer: PlayerState,
  nextBand: BandState,
  nextSocial: SocialState,
  controversySnapshot: number,
  rng: () => number
) => {
  // 4. Passive Effects
  const hqUpgrades = nextPlayer.hqUpgrades || []
  const hqUpgradesSet = new Set(hqUpgrades)

  // Coffee & Beer Fridge: Mood recovery
  const hasCoffee = hqUpgradesSet.has('hq_room_coffee')
  const hasBeerFridge = hqUpgradesSet.has('hq_room_cheap_beer_fridge')
  // Sofa & Old Couch: Stamina recovery
  const hasSofa = hqUpgradesSet.has('hq_room_sofa')
  const hasOldCouch = hqUpgradesSet.has('hq_room_old_couch')

  const membersArray = Array.isArray(nextBand.members) ? nextBand.members : []
  const nextMembers = new Array(membersArray.length)
  for (let i = 0; i < membersArray.length; i++) {
    const m = membersArray[i]
    if (!m) {
      throw new Error(
        `Sparse nextBand.members invariant violated at index ${i}`
      )
    }

    // 2a. Base Mood Drift
    let mood = finiteNumberOr(m.mood, 50)
    if (mood > 50) mood = Math.max(50, mood - 2)
    else if (mood < 50) mood = Math.min(50, mood + 2)
    mood = clampMemberMood(mood)

    // 2b. High Controversy Mood Penalty
    if (controversySnapshot >= 50) {
      mood = clampMemberMood(mood - 1)
    }

    // 2c. Base Stamina Drift
    let stamina = finiteNumberOr(m.stamina, 100)
    stamina = Math.max(0, stamina - 5)
    if (nextBand.harmony > 60) stamina += 3
    if ((nextSocial.instagram || 0) >= 10000) stamina += 2
    if (hasTrait(m, 'cyber_lungs')) stamina += 3
    stamina = clampMemberStamina(stamina, finiteNumberOr(m.staminaMax, 100))

    // 2d. HQ Upgrades
    if (hasCoffee || hasBeerFridge || hasSofa || hasOldCouch) {
      if (hasCoffee) mood += 2
      if (hasBeerFridge) {
        mood += 1
        if (m.name === CHARACTERS.MARIUS.name && hasTrait(m, 'party_animal')) {
          mood += 2
        }
      }
      mood = clampMemberMood(mood)

      if (hasSofa) stamina += 3
      if (hasOldCouch) stamina += 1
      stamina = clampMemberStamina(stamina, finiteNumberOr(m.staminaMax, 100))
    }

    nextMembers[i] = { ...m, mood, stamina }
  }
  nextBand.members = nextMembers

  // Apply Party Animal RNG penalty in its original global sequence position.
  // Operates on the freshly copied nextMembers so the penalty lands in the
  // returned state and the previous state's member objects stay untouched.
  if (hasBeerFridge) {
    for (let i = 0; i < nextMembers.length; i++) {
      const m = nextMembers[i]
      if (!m) {
        throw new Error(
          `Sparse nextBand.members invariant violated at index ${i} in party animal loop`
        )
      }
      if (m.name === CHARACTERS.MARIUS.name && hasTrait(m, 'party_animal')) {
        if (rng() < 0.3) {
          nextMembers[i] = {
            ...m,
            stamina: clampMemberStamina(
              finiteNumberOr(m.stamina, 0) - 5,
              finiteNumberOr(m.staminaMax, 100)
            )
          }
        }
      }
    }
  }

  // Soundproofing: Harmony boost
  if (hqUpgradesSet.has('hq_room_diy_soundproofing')) {
    const nextHarmonySoundproofing = clampBandHarmony(nextBand.harmony + 1)
    nextBand.harmony = nextHarmonySoundproofing
  }

  if (nextBand.harmonyRegenTravel) {
    // increase harmony by 5 then clamp — matches the travel/arrival regen
    // (getTravelArrivalUpdates, processHarmonyRegen); wrap the addend so a
    // stale undefined/NaN harmony does not silently drop the bonus.
    const nextHarmonyTravel = clampBandHarmony(
      finiteNumberOr(nextBand.harmony, 0) + 5
    )
    nextBand.harmony = nextHarmonyTravel
  }
  // Persisted addend: a truthy check alone lets Infinity through (NaN is falsy).
  const passiveFollowers = finiteNumberOr(nextPlayer.passiveFollowers, 0)
  if (passiveFollowers) {
    // Passive followers currently funnel into Instagram only
    nextSocial.instagram =
      finiteNumberOr(nextSocial.instagram, 0) + passiveFollowers
  }
}

/**
 * Calculates the pure daily player, band, social, and pending-flag updates.
 *
 * @param currentState - Game state at the start of the day tick.
 * @param rng - Random source used for deterministic tests and simulations.
 * @returns Updated player, band, social slices plus pending story flags.
 */
export const calculateDailyUpdates = (
  currentState: GameState,
  rng: () => number = getSafeRandom
) => {
  const nextPlayer = {
    ...currentState.player,
    day: currentState.player.day + 1
  }
  const nextBand = { ...currentState.band }
  const nextSocial = { ...currentState.social }

  // Snapshot controversyLevel at start of daily update to ensure consistent checks
  const controversySnapshot = nextSocial.controversyLevel || 0
  const pendingFlags: Record<string, boolean> = {}

  updatePlayerFinances(nextPlayer, nextBand, nextSocial, rng)
  updateVanCondition(nextPlayer, controversySnapshot)
  updateBandHarmony(
    nextPlayer,
    nextBand,
    nextSocial,
    controversySnapshot,
    rng,
    pendingFlags
  )
  updateSocialDecay(nextPlayer, nextSocial, rng)
  updatePassiveEffectsAndMembers(
    nextPlayer,
    nextBand,
    nextSocial,
    controversySnapshot,
    rng
  )

  return {
    player: nextPlayer,
    band: nextBand,
    social: nextSocial,
    pendingFlags
  }
}
