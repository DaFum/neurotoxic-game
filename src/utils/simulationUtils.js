// TODO: Review this file
// Utility functions for Simulation <-> Action connection
import { CHARACTERS } from '../data/characters.js'
import { EXPENSE_CONSTANTS } from './economyEngine.js'
import { applyReputationDecay } from './socialEngine.js'
import { calcBaseBreakdownChance } from './upgradeUtils.js'
import { hasTrait } from './traitLogic.js'
import { secureRandom } from './crypto.js'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  clampMemberMood
} from './gameStateUtils.js'

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
    activeEffects: [], // Text descriptions for UI
    ...gigModifiers // Merge active PreGig toggles (soundcheck, energy, etc)
  }

  const members = Array.isArray(bandState.members) ? bandState.members : []

  // 1. Harmony Logic
  if (bandState.harmony > 80) {
    modifiers.hitWindowBonus = 20 // ms
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.telepathy',
      fallback: 'TELEPATHY (Harmony > 80): Easier Hits'
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
  // Formula: Base 150ms + (Skill * 5ms)
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
    guitar: 150 + getMemberSkill(matze) * 5,
    drums: 150 + getMemberSkill(Marius) * 5,
    bass: 150 + getMemberSkill(Lars) * 5
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
 * @param {Function} [rng=Math.random] - Random number generator for determinism.
 * @returns {object} The updated parts of state (player, band, social).
 */
export const CONTROVERSY_ACCELERATED_DECAY_THRESHOLD = 60
export const CONTROVERSY_ACCELERATED_DECAY_AMOUNT = 2
export const CONTROVERSY_NORMAL_DECAY_AMOUNT = 1

export const calculateDailyUpdates = (currentState, rng = secureRandom) => {
  const nextPlayer = {
    ...currentState.player,
    day: currentState.player.day + 1
  }
  const nextBand = { ...currentState.band }
  const nextSocial = { ...currentState.social }

  // 1. Costs
  // Rent/Food scaled by band size
  const bandSize = Array.isArray(nextBand.members) ? nextBand.members.length : 3
  let dailyCost = EXPENSE_CONSTANTS.DAILY.BASE_COST + bandSize * 8

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

  // Van condition decay (wear from daily travel)
  if (nextPlayer.van) {
    nextPlayer.van = { ...nextPlayer.van }
    nextPlayer.van.condition = Math.max(
      0,
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
    if ((nextSocial.controversyLevel || 0) >= 80) conditionMultiplier += 0.5
    else if ((nextSocial.controversyLevel || 0) >= 50)
      conditionMultiplier += 0.2

    const adjustedBreakdownChance = baseBreakdownChance * conditionMultiplier
    // Clamp to a reasonable range so chance stays between 0% and 50%
    nextPlayer.van.breakdownChance = Math.max(
      0,
      Math.min(0.5, Math.round(adjustedBreakdownChance * 100) / 100)
    )
  }

  // 2. Mood & Stamina Drift
  // Drift towards 50
  nextBand.members = nextBand.members.map(m => {
    let mood = m.mood
    if (mood > 50) mood -= 2
    else if (mood < 50) mood += 2
    mood = clampMemberMood(mood)

    // Stamina Decay (Life on the road is tiring)
    let stamina = typeof m.stamina === 'number' ? m.stamina : 100
    stamina = Math.max(0, stamina - 5)

    // Partial stamina recovery when band harmony is high
    if (nextBand.harmony > 60) {
      stamina += 3
    }

    // Instagram Gear Endorsement Perk (Free stamina recovery)
    if ((nextSocial.instagram || 0) >= 10000) stamina += 2

    // Cyber Lungs Trait: Bonus stamina regen from clinic graft
    if (hasTrait(m, 'cyber_lungs')) stamina += 3

    return { ...m, mood, stamina: clampMemberStamina(stamina, m.staminaMax) }
  })

  // Harmony Decay (Drifts towards 50 like mood)
  if (nextBand.harmony > 50) {
    const nextHarmonyDecay = clampBandHarmony(nextBand.harmony - 2)
    nextBand.harmony = nextHarmonyDecay
  } else if (nextBand.harmony < 50) {
    const nextHarmonyRegen = clampBandHarmony(nextBand.harmony + 2)
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

  // High Controversy passive effects — snapshot before decay so same-day checks
  // (sponsorship drop at line ~327) use the start-of-day value, not the decayed one.
  const controversy = nextSocial.controversyLevel || 0
  if (controversy >= 50) {
    // Harmony drain is worse under stress
    const nextHarmonyControversy = clampBandHarmony(nextBand.harmony - 1)
    nextBand.harmony = nextHarmonyControversy
    nextBand.members = nextBand.members.map(m => ({
      ...m,
      mood: clampMemberMood(m.mood - 1)
    }))
  }

  // Clamp harmony to valid range after all modifications
  const nextHarmonySafeguard = clampBandHarmony(nextBand.harmony)
  nextBand.harmony = nextHarmonySafeguard

  // 3. Social Decay
  nextSocial.viral = nextSocial.viral || 0
  // Viral decay
  if (nextSocial.viral > 0) nextSocial.viral -= 1

  // Controversy/Shadowban Decay
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

  // Sponsor Trigger Metric
  if (
    !nextSocial.sponsorActive &&
    (nextSocial.instagram || 0) > 5000 &&
    rng() < 0.1
  ) {
    nextSocial.sponsorActive = true
  } else if (nextSocial.sponsorActive) {
    // If organic followers drop below milestone, they drop the sponsorship
    if ((nextSocial.instagram || 0) < 5000) {
      nextSocial.sponsorActive = false
    }
    // Sponsorship Drops due to high controversy
    else if (controversy >= 80 && rng() < 0.2) {
      nextSocial.sponsorActive = false
    }
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

  // Coffee & Beer Fridge: Mood recovery
  const hasCoffee = hqUpgrades.includes('hq_room_coffee')
  const hasBeerFridge = hqUpgrades.includes('hq_room_cheap_beer_fridge')
  // Sofa & Old Couch: Stamina recovery
  const hasSofa = hqUpgrades.includes('hq_room_sofa')
  const hasOldCouch = hqUpgrades.includes('hq_room_old_couch')

  if (hasCoffee || hasBeerFridge || hasSofa || hasOldCouch) {
    nextBand.members = nextBand.members.map(m => {
      let mood = m.mood
      let stamina = typeof m.stamina === 'number' ? m.stamina : 100

      if (hasCoffee) mood += 2
      if (hasBeerFridge) {
        mood += 1
        // Party Animal Trait (Marius): Extra mood, but risk of stamina loss
        if (m.name === CHARACTERS.MARIUS.name && hasTrait(m, 'party_animal')) {
          mood += 2
          if (rng() < 0.3) {
            stamina -= 5
          }
        }
      }
      if (hasSofa) stamina += 3
      if (hasOldCouch) stamina += 1

      return {
        ...m,
        mood: clampMemberMood(mood),
        stamina: clampMemberStamina(stamina, m.staminaMax)
      }
    })
  }

  // Soundproofing: Harmony boost
  if (hqUpgrades.includes('hq_room_diy_soundproofing')) {
    const nextHarmonySoundproofing = clampBandHarmony(nextBand.harmony + 1)
    nextBand.harmony = nextHarmonySoundproofing
  }

  if (nextBand.harmonyRegenTravel) {
    const nextHarmonyTravel = clampBandHarmony(nextBand.harmony + 2) // Reduced from 5
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
