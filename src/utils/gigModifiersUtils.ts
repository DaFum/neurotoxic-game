import { CHARACTERS } from '../data/characters'
import { hasTrait } from './traitUtils'
import { NEUROTOXIC_PEDAL_CROWD_DECAY_MODIFIER } from '../context/gameConstants'
import type { BandState, BandMember } from '../types'
import type { Song } from '../types/audio'
import type { ActiveEffect } from '../types/components'

const findMembersByName = <K extends string>(
  members: BandMember[],
  names: Readonly<Record<K, string>>
): Partial<Record<K, BandMember>> => {
  const result: Partial<Record<K, BandMember>> = {}
  const keys = Object.keys(names) as K[]
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (!m) continue
    for (const key of keys) {
      if (m.name === names[key]) {
        result[key] = m
        break
      }
    }
  }
  return result
}

const PRE_GIG_ACTIVE_EFFECTS = {
  soundcheck: {
    key: 'ui:pregig.effects.soundcheck',
    fallback: 'SOUNDCHECK: Easier Hits'
  },
  promo: {
    key: 'ui:pregig.effects.promo',
    fallback: 'PROMO: Bigger Crowd'
  },
  merch: {
    key: 'ui:pregig.effects.merch',
    fallback: 'MERCH STAND: Better Merch Sales'
  },
  catering: {
    key: 'ui:pregig.effects.catering',
    fallback: 'CATERING: Counters Tired Band Penalty'
  },
  guestlist: {
    key: 'ui:pregig.effects.guestlist',
    fallback: 'GUEST LIST: VIP Bar Revenue'
  }
} as const satisfies Record<string, ActiveEffect>

/**
 * Derives dynamic game modifiers for the Gig scene based on band state and active toggles.
 * @param bandState - The current band state (members, harmony, etc.).
 * @param gigModifiers - Active PreGig modifiers (e.g. catering, soundcheck) plus the
 * `damaged_gear` flag set by botched setup minigames. Defaults to `{}`.
 * @returns An object containing numeric modifiers and active effect descriptions.
 */
export const getGigModifiers = (
  bandState: BandState,
  gigModifiers: Record<string, unknown> = {}
) => {
  const modifiers: {
    hitWindowBonus: number
    noteJitter: boolean
    drumSpeedMult: number
    guitarScoreMult: number
    activeEffects: ActiveEffect[]
    [key: string]: unknown
  } = {
    hitWindowBonus: 0,
    noteJitter: false,
    drumSpeedMult: 1.0,
    guitarScoreMult: 1.0,
    ...gigModifiers, // Merge active PreGig toggles (soundcheck, energy, etc)
    activeEffects: [] as ActiveEffect[] // Text descriptions for UI
  }

  const members: BandMember[] = Array.isArray(bandState.members)
    ? (bandState.members as BandMember[])
    : []

  const preGigEffectKeys = Object.keys(PRE_GIG_ACTIVE_EFFECTS) as Array<
    keyof typeof PRE_GIG_ACTIVE_EFFECTS
  >
  for (const modifierKey of preGigEffectKeys) {
    if (gigModifiers[modifierKey] === true) {
      modifiers.activeEffects.push(PRE_GIG_ACTIVE_EFFECTS[modifierKey])
    }
  }

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
  const { matze, Marius } = findMembersByName(members, {
    matze: CHARACTERS.MATZE.name,
    Marius: CHARACTERS.MARIUS.name
  })

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

  // Damaged gear: set on a botched setup minigame (roadie/kabelsalat/amp).
  // Combo penalty stacks on top of harmony/member effects via compound ops.
  if (gigModifiers.damaged_gear === true) {
    modifiers.noteJitter = true
    modifiers.hitWindowBonus -= 10
    modifiers.guitarScoreMult *= 0.9
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.damagedGear',
      fallback: 'DAMAGED GEAR: Sloppy timing & weak tone'
    })
  }

  if (bandState.inventory?.neurotoxicPedal) {
    modifiers.crowdDecay = NEUROTOXIC_PEDAL_CROWD_DECAY_MODIFIER
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.neurotoxic',
      fallback: 'NEUROTOXIC: Crowd energy drains 50% slower'
    })
  }

  return modifiers
}

/**
 * Calculates derived physics variables for the Gig scene based on RPG stats.
 * @param bandState - Band whose members' RPG stats and stamina drive the multipliers and hit windows.
 * @param song - Song supplying bpm and difficulty, which set base speed and hit-window tightness.
 */
export const calculateGigPhysics = (bandState: BandState, song: Song) => {
  const members = Array.isArray(bandState.members) ? bandState.members : []

  // Pre-calculate song properties
  const isSlowSong = song.bpm < 120
  const isTechnicalSong = (song.difficulty || 2) > 3

  // 1. Hit Windows based on Skill
  // Formula: Base 120ms + (Skill * 4ms)
  // Tightened from 150+5×skill (190ms at skill 8) to 120+4×skill (~152ms at skill 8)
  // to raise the skill floor and make misses more impactful.
  const { matze, Marius, Lars } = findMembersByName(members, {
    matze: CHARACTERS.MATZE.name,
    Marius: CHARACTERS.MARIUS.name,
    Lars: CHARACTERS.LARS.name
  })

  const getMemberSkill = (member?: BandMember): number => {
    if (!member) return 0
    const baseStatsValue = member.baseStats
    if (typeof baseStatsValue === 'object' && baseStatsValue !== null) {
      const skillValue = (baseStatsValue as Record<string, unknown>).skill
      if (typeof skillValue === 'number') {
        return skillValue
      }
    }
    return typeof member.skill === 'number' ? member.skill : 0
  }
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
    const m = members[i]
    if (!m) continue
    totalStamina += m.stamina ?? 0
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
