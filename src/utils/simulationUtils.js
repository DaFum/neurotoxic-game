// Utility functions for Simulation <-> Action connection
import { CHARACTERS } from '../data/characters.js'
import { EXPENSE_CONSTANTS } from './economyEngine.js'
import { applyReputationDecay } from './socialEngine.js'
import { calcBaseBreakdownChance } from './upgradeUtils.js'
import { hasTrait, bandHasTrait } from './traitLogic.js'

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
    modifiers.activeEffects.push('TELEPATHY (Harmony > 80): Easier Hits')
  } else if (bandState.harmony < 30) {
    modifiers.noteJitter = true
    modifiers.activeEffects.push('DISCONNECT (Harmony < 30): Notes Jitter')
  }

  // 2. Member Status
  // Matze (Guitar)
  const matze = members.find(m => m.name === CHARACTERS.MATZE.name)
  if (matze && matze.mood < 20) {
    modifiers.guitarScoreMult = 0.5
    modifiers.activeEffects.push(
      `GRUMPY ${CHARACTERS.MATZE.name.toUpperCase()}: Guitar Score -50%`
    )
  }

  // Lars (Drums)
  const lars = members.find(m => m.name === CHARACTERS.LARS.name)
  if (lars && lars.stamina < 20) {
    modifiers.drumSpeedMult = 1.2 // 20% faster
    modifiers.activeEffects.push(
      `TIRED ${CHARACTERS.LARS.name.toUpperCase()}: Rushing Tempo`
    )
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

  // 1. Hit Windows based on Skill
  // Formula: Base 150ms + (Skill * 5ms)
  const matze = members.find(m => m.name === CHARACTERS.MATZE.name)
  const lars = members.find(m => m.name === CHARACTERS.LARS.name)
  const marius = members.find(m => m.name === CHARACTERS.MARIUS.name)

  const getMemberSkill = member =>
    member?.baseStats?.skill ?? member?.skill ?? 0
  const hitWindows = {
    guitar: 150 + getMemberSkill(matze) * 5,
    drums: 150 + getMemberSkill(lars) * 5,
    bass: 150 + getMemberSkill(marius) * 5
  }

  // Virtuoso Trait (Matze): +10% Hit Window
  if (hasTrait(matze, 'virtuoso')) {
    hitWindows.guitar *= 1.10
  }

  // 2. Scroll Speed based on Global Stamina
  // Avg Stamina:
  // members array is already guarded above
  const totalStamina = members.reduce((sum, m) => sum + (m.stamina || 0), 0)
  const avgStamina = members.length ? totalStamina / members.length : 0

  // Normal Speed = 500 (pixels per second approx or whatever engine uses)
  // If Stamina < 30, slow down draggingly
  let speedModifier = 1.0
  if (avgStamina < 30) {
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

  // Lars: Blast Beat Machine
  if (lars && isFastSong && hasTrait(lars, 'blast_machine')) {
    multipliers.drums = 1.5
  }

  // Lars: Party Animal (Crowd loves the energy)
  if (lars && hasTrait(lars, 'party_animal')) {
    multipliers.drums *= 1.1
  }

  // Matze: Gear Nerd (Reliable tone)
  if (matze && hasTrait(matze, 'gear_nerd')) {
    multipliers.guitar *= 1.1
  }

  // Marius: Social Nerd / Manager (Crowd Engagement)
  if (marius && hasTrait(marius, 'social_manager')) {
    multipliers.bass *= 1.1
  }

  // Marius: Bandleader (Coordination)
  if (marius && hasTrait(marius, 'bandleader')) {
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
export const calculateDailyUpdates = (currentState, rng = Math.random) => {
  const nextPlayer = {
    ...currentState.player,
    day: currentState.player.day + 1
  }
  const nextBand = { ...currentState.band }
  const nextSocial = { ...currentState.social }

  // 1. Costs
  // Rent/Food scaled by band size
  const bandSize = Array.isArray(nextBand.members) ? nextBand.members.length : 3
  let dailyCost = EXPENSE_CONSTANTS.DAILY.BASE_COST + bandSize * 5

  // YouTube Passive Ad Revenue Perk (per 10k subscribers)
  if ((nextSocial.youtube || 0) >= 10000) {
    const adRevenue = Math.floor((nextSocial.youtube || 0) / 10000) * 10
    dailyCost -= adRevenue // Can result in net positive daily income if huge 
  }
  
  // Newsletter Merch Sales Perk (Note: Can result in net daily income/negative dailyCost)
  if ((nextSocial.newsletter || 0) >= 1000 && rng() < 0.3) {
    dailyCost -= Math.floor((nextSocial.newsletter || 0) / 100) * 5
  }

  nextPlayer.money = Math.max(0, nextPlayer.money - dailyCost)

  // Van condition decay (wear from daily travel)
  if (nextPlayer.van) {
    nextPlayer.van = { ...nextPlayer.van }
    nextPlayer.van.condition = Math.max(
      0,
      (nextPlayer.van.condition ?? 100) - 2
    )
    // Increased breakdown chance when condition is low
    // CRITICAL FIX: Reconstruct base breakdown chance from upgrades every day.
    // Do NOT read nextPlayer.van.breakdownChance as base, or it compounds condition multipliers infinitely.

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
    mood = Math.max(0, Math.min(100, mood))

    // Stamina Decay (Life on the road is tiring)
    let stamina = typeof m.stamina === 'number' ? m.stamina : 100
    stamina = Math.max(0, stamina - 5)

    // Partial stamina recovery when band harmony is high
    if (nextBand.harmony > 60) {
      stamina = Math.min(100, stamina + 3)
    }

    // Instagram Gear Endorsement Perk (Free stamina recovery)
    if ((nextSocial.instagram || 0) >= 10000) stamina += 2

    return { ...m, mood, stamina: Math.min(100, stamina) }
  })

  // Harmony Decay (Drifts towards 50 like mood)
  if (nextBand.harmony > 50) {
    nextBand.harmony -= 2
  } else if (nextBand.harmony < 50) {
    nextBand.harmony += 2
  }

  // Ego System Drain (Lead Singer Syndrome)
  if (nextSocial.egoFocus) {
    nextBand.harmony -= 2 // Passive drain for spotlighting a single member
    // Passive decay chance (20% per day to forget the drama)
    if (rng() < 0.2) {
      nextSocial.egoFocus = null
    }
  }

  // Clamp harmony to valid range after all modifications
  nextBand.harmony = Math.max(1, Math.min(100, nextBand.harmony))

  // 3. Social Decay
  nextSocial.viral = nextSocial.viral || 0
  // Viral decay
  if (nextSocial.viral > 0) nextSocial.viral -= 1
  
  // Controversy/Shadowban Decay
  if (nextSocial.controversyLevel > 0) {
    // Passive cooldown
    nextSocial.controversyLevel = Math.max(0, nextSocial.controversyLevel - 1)
  }

  // Sponsor Trigger Metric
  if (!nextSocial.sponsorActive && (nextSocial.instagram || 0) > 5000 && rng() < 0.1) {
    nextSocial.sponsorActive = true
  } else if (nextSocial.sponsorActive && (nextSocial.instagram || 0) < 5000) {
    // If organic followers drop below milestone, they drop the sponsorship
    nextSocial.sponsorActive = false
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
        // Party Animal Trait (Lars): Extra mood, but risk of stamina loss
        if (
          m.name === CHARACTERS.LARS.name &&
          hasTrait(m, 'party_animal')
        ) {
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
        mood: Math.min(100, mood),
        stamina: Math.max(0, Math.min(100, stamina))
      }
    })
  }

  // Soundproofing: Harmony boost
  if (hqUpgrades.includes('hq_room_diy_soundproofing')) {
    nextBand.harmony = Math.min(100, nextBand.harmony + 1)
  }

  if (nextBand.harmonyRegenTravel) {
    nextBand.harmony = Math.min(100, nextBand.harmony + 2) // Reduced from 5
  }
  if (nextPlayer.passiveFollowers) {
    // Passive followers currently funnel into Instagram only
    nextSocial.instagram =
      (nextSocial.instagram || 0) + nextPlayer.passiveFollowers
  }

  return { player: nextPlayer, band: nextBand, social: nextSocial }
}
