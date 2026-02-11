// Utility functions for Simulation <-> Action connection
import { EXPENSE_CONSTANTS } from './economyEngine.js'

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
  const matze = bandState.members.find(m => m.name === 'Matze')
  if (matze && matze.mood < 20) {
    modifiers.guitarScoreMult = 0.5
    modifiers.activeEffects.push('GRUMPY MATZE: Guitar Score -50%')
  }

  // Lars (Drums)
  const lars = bandState.members.find(m => m.name === 'Lars')
  if (lars && lars.stamina < 20) {
    modifiers.drumSpeedMult = 1.2 // 20% faster
    modifiers.activeEffects.push('TIRED LARS: Rushing Tempo')
  }

  return modifiers
}

/**
 * Calculates derived physics variables for the Gig scene based on RPG stats.
 * @param {object} bandState
 * @param {object} song
 */
export const calculateGigPhysics = (bandState, song) => {
  // 1. Hit Windows based on Skill
  // Formula: Base 150ms + (Skill * 5ms)
  const matze = bandState.members.find(m => m.name === 'Matze')
  const lars = bandState.members.find(m => m.name === 'Lars')
  const marius = bandState.members.find(m => m.name === 'Marius')

  const hitWindows = (() => {
    const getMemberSkill = (member) => member?.baseStats?.skill ?? member?.skill ?? 0;
    return {
      guitar: 150 + getMemberSkill(matze) * 5,
      drums: 150 + getMemberSkill(lars) * 5,
      bass: 150 + getMemberSkill(marius) * 5
    };
  })();

  // 2. Scroll Speed based on Global Stamina
  // Avg Stamina:
  const members = Array.isArray(bandState.members) ? bandState.members : []
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
  // Assuming we check 'traits' array on member objects
  // Since state structure might vary, let's check safely
  if (lars && lars.traits && isFastSong) {
    // Simple check if trait ID exists (assuming data structure from characters.js)
    const hasBlastTrait = lars.traits.some(t => t.id === 'blast_machine')
    if (hasBlastTrait) multipliers.drums = 1.5
  }

  return {
    hitWindows,
    speedModifier,
    multipliers,
    avgStamina
  }
}

/**
 * Calculates daily state updates including costs, mood drift, and decay.
 * @param {object} currentState - The full state before update.
 * @returns {object} The updated parts of state (player, band, social).
 */
export const calculateDailyUpdates = currentState => {
  const nextPlayer = {
    ...currentState.player,
    day: currentState.player.day + 1
  }
  const nextBand = { ...currentState.band }
  const nextSocial = { ...currentState.social }

  // 1. Costs
  // Rent/Food
  const dailyCost = EXPENSE_CONSTANTS.DAILY.BASE_COST
  nextPlayer.money -= dailyCost

  // 2. Mood Drift
  // Drift towards 50
  nextBand.members = nextBand.members.map(m => {
    let mood = m.mood
    if (mood > 50) mood -= 2
    else if (mood < 50) mood += 2
    return { ...m, mood }
  })

  // 3. Social Decay
  // Viral decay
  if (nextSocial.viral > 0) nextSocial.viral -= 1

  // 4. Passive Effects
  if (nextBand.harmonyRegenTravel) {
    nextBand.harmony = Math.min(100, nextBand.harmony + 5)
  }
  if (nextPlayer.passiveFollowers) {
    // Passive followers currently funnel into Instagram only
    nextSocial.instagram =
      (nextSocial.instagram || 0) + nextPlayer.passiveFollowers
  }

  return { player: nextPlayer, band: nextBand, social: nextSocial }
}
