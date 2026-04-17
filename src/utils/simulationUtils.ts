/*
 * (#1) Actual Updates: Added missing REVIEW.md comment block.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
// Utility functions for Simulation <-> Action connection
import { CHARACTERS } from '../data/characters'
import { EXPENSE_CONSTANTS } from './economyEngine'
import { applyReputationDecay } from './socialEngine'
import { calcBaseBreakdownChance } from './upgradeUtils'
import { hasTrait } from './traitLogic'
import { getSafeRandom } from './crypto'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampVanCondition,
  clampMemberStamina,
  clampMemberMood,
  BALANCE_CONSTANTS
} from './gameStateUtils'

/**
 * Derives dynamic game modifiers for the Gig scene based on band state and active toggles.
 * @param {object} bandState - The current band state (members, harmony, etc.).
 * @param {object} [gigModifiers={}] - Active PreGig modifiers (e.g. catering, soundcheck).
 * @returns {object} An object containing numeric modifiers and active effect descriptions.
 */
export const getGigModifiers = (bandState, gigModifiers = {}) => {
  const modifiers = {
    hitWindowBonus: 0,
    noteJitter: false,
    drumSpeedMult: 1.0,
    guitarScoreMult: 1.0,
    ...gigModifiers, // Merge active PreGig toggles (soundcheck, energy, etc)
    activeEffects: [] // Text descriptions for UI
  }

  const members = Array.isArray(bandState.members) ? bandState.members : []

  // 1. Harmony Logic
  if (bandState.harmony > 80) {
    modifiers.hitWindowBonus = 20 // ms
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.telepathy',
      fallback: 'TELEPATHY (Harmony > 80): Easier Hits'
    })
  } else if (bandState.harmony < 20) {
    modifiers.noteJitter = true
    modifiers.hitWindowBonus = -25 // Strong penalty
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.toxic',
      fallback: 'TOXIC (Harmony < 20): Severe Jitter & Strict Timing'
    })
  } else if (bandState.harmony < 40) {
    modifiers.noteJitter = true
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.disconnect',
      fallback: 'DISCONNECT (Harmony < 40): Notes Jitter'
    })
  }

  // 2. Member Status
  let matze, Marius
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (m.name === CHARACTERS.MATZE.name) matze = m
    else if (m.name === CHARACTERS.MARIUS.name) Marius = m
  }

  // Matze (Guitar)
  if (matze && matze.mood < 30) {
    modifiers.guitarScoreMult = 0.5
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.grumpy',
      options: { name: CHARACTERS.MATZE.name.toUpperCase() },
      fallback: `GRUMPY ${CHARACTERS.MATZE.name.toUpperCase()}: Guitar Score -50%`
    })
  }

  // Marius (Drums)
  if (Marius && Marius.stamina < 30) {
    modifiers.drumSpeedMult = 1.2 // 20% faster
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.tired',
      options: { name: CHARACTERS.MARIUS.name.toUpperCase() },
      fallback: `TIRED ${CHARACTERS.MARIUS.name.toUpperCase()}: Rushing Tempo`
    })
  }

  return modifiers
}

/**
 * Calculates derived physics variables for the Gig scene based on RPG stats.
 * @param {object} bandState
 * @param {object} song
 */
export const calculateGigPhysics = (bandState, song) => {
  const members = Array.isArray(bandState.members) ? bandState.members : []

  // Pre-calculate song properties
  const isSlowSong = song.bpm < 120
  const isTechnicalSong = (song.difficulty || 2) > 3

  // 1. Hit Windows based on Skill
  // Formula: Base 120ms + (Skill * 4ms)
  // Tightened from 150+5×skill (190ms at skill 8) to 120+4×skill (~152ms at skill 8)
  // to raise the skill floor and make misses more impactful.
  let matze, Marius, Lars
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (m.name === CHARACTERS.MATZE.name) matze = m
    else if (m.name === CHARACTERS.MARIUS.name) Marius = m
    else if (m.name === CHARACTERS.LARS.name) Lars = m
  }

  const getMemberSkill = member =>
    member?.baseStats?.skill ?? member?.skill ?? 0
  const hitWindows = {
    guitar: 120 + getMemberSkill(matze) * 4,
    drums: 120 + getMemberSkill(Marius) * 4,
    bass: 120 + getMemberSkill(Lars) * 4
  }

  // Virtuoso Trait (Matze): +10% Hit Window
  if (hasTrait(matze, 'virtuoso')) {
    hitWindows.guitar *= 1.1
  }

  // 2. Scroll Speed based on Global Stamina
  // Avg Stamina:
  // members array is already guarded above
  let totalStamina = 0
  for (let i = 0; i < members.length; i++) {
    totalStamina += members[i].stamina || 0
  }
  const avgStamina = members.length ? totalStamina / members.length : 0

  // Normal Speed = 500 (pixels per second approx or whatever engine uses)
  // If Stamina < 40, slow down draggingly
  let speedModifier = 1.0
  if (avgStamina < 40) {
    speedModifier = 0.8 // "Drag" effect
  }

  // 3. Score Multipliers based on Traits
  const multipliers = {
    guitar: 1.0,
    drums: 1.0,
    bass: 1.0
  }

  // Check Song Speed (High BPM)
  const isFastSong = song.bpm > 160

  // Marius: Blast Beat Machine
  if (Marius && isFastSong && hasTrait(Marius, 'blast_machine')) {
    multipliers.drums = 1.5
  }

  // Lars: Melodic Genius (Better flow on slow songs)
  if (Lars && isSlowSong && hasTrait(Lars, 'melodic_genius')) {
    // Bonus to hit window instead of score multiplier to simulate "flow"
    hitWindows.bass *= 1.15
  }

  // Matze: Tech Wizard (Bonus score on complex songs)
  if (matze && isTechnicalSong && hasTrait(matze, 'tech_wizard')) {
    multipliers.guitar *= 1.15
  }

  // Marius: Party Animal (Crowd loves the energy)
  if (Marius && hasTrait(Marius, 'party_animal')) {
    multipliers.drums *= 1.1
  }

  // Matze: Gear Nerd (Reliable tone)
  if (matze && hasTrait(matze, 'gear_nerd')) {
    multipliers.guitar *= 1.1
  }

  // Lars: Social Nerd / Manager (Crowd Engagement)
  if (Lars && hasTrait(Lars, 'social_manager')) {
    multipliers.bass *= 1.1
  }

  // Lars: Bandleader (Coordination)
  if (Lars && hasTrait(Lars, 'bandleader')) {
    hitWindows.guitar += 5
    hitWindows.drums += 5
    hitWindows.bass += 5
  }

  // Perfektionist Trait (Matze)
  const hasPerfektionist = hasTrait(matze, 'perfektionist')

  return {
    hitWindows,
    speedModifier,
    multipliers,
    avgStamina,
    hasPerfektionist
  }
}

/**
 * Calculates daily state updates including costs, mood drift, and decay.
 * @param {object} currentState - The full state before update.
 * @param {Function} [rng=getSafeRandom] - Random number generator for determinism.
 * @returns {object} The updated parts of state (player, band, social).
 */
export const CONTROVERSY_ACCELERATED_DECAY_THRESHOLD = 55
export const CONTROVERSY_ACCELERATED_DECAY_AMOUNT = 3
export const CONTROVERSY_NORMAL_DECAY_AMOUNT = 1

export const calculateDailyUpdates = (currentState, rng = getSafeRandom) => {
  const nextPlayer = {
    ...currentState.player,
    day: currentState.player.day + 1
  }
  const nextBand = { ...currentState.band }
  const nextSocial = { ...currentState.social }

  // Snapshot controversyLevel at start of daily update to ensure consistent checks
  const controversySnapshot = nextSocial.controversyLevel || 0

  // 1. Costs
  // Rent/Food scaled by band size
  const bandSize = Array.isArray(nextBand.members) ? nextBand.members.length : 3

  // Base daily cost plus a scaling "Burn Rate" based on fame level (lifestyle inflation)
  const fameLevel = nextPlayer.fameLevel || 0
  const lifestyleInflation = Math.floor(Math.pow(fameLevel, 1.4) * 15)
  let dailyCost =
    EXPENSE_CONSTANTS.DAILY.BASE_COST + bandSize * 8 + lifestyleInflation

  // YouTube Passive Ad Revenue Perk (per 10k subscribers)
  if ((nextSocial.youtube || 0) >= 10000) {
    const adRevenue = Math.floor((nextSocial.youtube || 0) / 10000) * 10
    dailyCost -= adRevenue // Can result in net positive daily income if huge
  }

  // Newsletter Merch Sales Perk (Note: Can result in net daily income/negative dailyCost)
  if ((nextSocial.newsletter || 0) >= 1000 && rng() < 0.3) {
    dailyCost -= Math.floor((nextSocial.newsletter || 0) / 100) * 5
  }

  const nextMoney = clampPlayerMoney(nextPlayer.money - dailyCost)
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
    nextPlayer.money = clampPlayerMoney(nextPlayer.money - expense)
  }

  // Van condition decay (wear from daily travel)
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

    let conditionMultiplier
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

  // Harmony Decay (Drifts towards 50 like mood)
  if (nextBand.harmony > 50) {
    const nextHarmonyDecay = clampBandHarmony(nextBand.harmony - 2)
    nextBand.harmony = nextHarmonyDecay
  } else if (nextBand.harmony < 50) {
    const nextHarmonyRegen = clampBandHarmony(nextBand.harmony + 3)
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
  let pendingFlags = {}
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

  // 3. Social Decay
  nextSocial.viral = nextSocial.viral || 0
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

  // 4. Passive Effects
  const hqUpgrades = nextPlayer.hqUpgrades || []
  const hqUpgradesSet = new Set(hqUpgrades)

  // Coffee & Beer Fridge: Mood recovery
  const hasCoffee = hqUpgradesSet.has('hq_room_coffee')
  const hasBeerFridge = hqUpgradesSet.has('hq_room_cheap_beer_fridge')
  // Sofa & Old Couch: Stamina recovery
  const hasSofa = hqUpgradesSet.has('hq_room_sofa')
  const hasOldCouch = hqUpgradesSet.has('hq_room_old_couch')

  // Optimize: Combine 3 separate `.map()` passes into a single loop, eliminating intermediate arrays
  const nextMembers = new Array(nextBand.members.length)
  for (let i = 0; i < nextBand.members.length; i++) {
    const m = nextBand.members[i]

    // 2a. Base Mood Drift
    let mood = m.mood
    if (mood > 50) mood -= 2
    else if (mood < 50) mood += 2
    mood = clampMemberMood(mood)

    // 2b. High Controversy Mood Penalty
    if (controversySnapshot >= 50) {
      mood = clampMemberMood(mood - 1)
    }

    // 2c. Base Stamina Drift
    let stamina = typeof m.stamina === 'number' ? m.stamina : 100
    stamina = Math.max(0, stamina - 5)
    if (nextBand.harmony > 60) stamina += 3
    if ((nextSocial.instagram || 0) >= 10000) stamina += 2
    if (hasTrait(m, 'cyber_lungs')) stamina += 3
    stamina = clampMemberStamina(stamina, m.staminaMax)

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
      stamina = clampMemberStamina(stamina, m.staminaMax)
    }

    nextMembers[i] = { ...m, mood, stamina }
  }
  nextBand.members = nextMembers

  // Apply Party Animal RNG penalty in its original global sequence position
  if (hasBeerFridge) {
    for (let i = 0; i < nextBand.members.length; i++) {
      const m = nextBand.members[i]
      if (m.name === CHARACTERS.MARIUS.name && hasTrait(m, 'party_animal')) {
        if (rng() < 0.3) {
          m.stamina = clampMemberStamina(m.stamina - 5, m.staminaMax)
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
    // increase harmony by 4 then clamp
    const nextHarmonyTravel = clampBandHarmony(nextBand.harmony + 4)
    nextBand.harmony = nextHarmonyTravel
  }
  if (nextPlayer.passiveFollowers) {
    // Passive followers currently funnel into Instagram only
    nextSocial.instagram =
      (nextSocial.instagram || 0) + nextPlayer.passiveFollowers
  }

  return {
    player: nextPlayer,
    band: nextBand,
    social: nextSocial,
    pendingFlags
  }
}
