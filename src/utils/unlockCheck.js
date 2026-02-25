import { hasTrait } from './traitLogic.js'
import { CHARACTERS } from '../data/characters.js'

/**
 * Checks for trait unlocks based on game state changes.
 * @param {object} state - The full game state (player, band, etc.).
 * @param {object} context - Contextual data (gigStats, purchaseItem, etc.).
 * @returns {Array} List of { memberId, traitId } to unlock.
 */
export const checkTraitUnlocks = (state, context = {}) => {
  const newUnlocks = []
  const { band, player, social } = state
  const members = band?.members || []

  // Helpers to find members
  const getMember = (name) => members.find(m => m.name === name)
  const matze = getMember(CHARACTERS.MATZE.name)
  const lars = getMember(CHARACTERS.LARS.name)
  const marius = getMember(CHARACTERS.MARIUS.name)

  // 1. Performance Unlocks (Post-Gig)
  if (context.type === 'GIG_COMPLETE' && context.gigStats) {
    const { accuracy, misses, song, maxCombo } = context.gigStats

    // Virtuoso (Matze): 100% Accuracy (0 Misses)
    if (matze && !hasTrait(matze, 'virtuoso') && misses === 0) {
      newUnlocks.push({ memberId: matze.name, traitId: 'virtuoso' })
    }

    // Perfektionist (Matze): 100% Accuracy (match UI hint)
    if (matze && !hasTrait(matze, 'perfektionist') && accuracy === 100) {
      newUnlocks.push({ memberId: matze.name, traitId: 'perfektionist' })
    }

    // Blast Machine (Lars): Fast song (>160 BPM) && Max Combo > 50
    if (lars && !hasTrait(lars, 'blast_machine')) {
      const isFast = (song?.bpm || 0) > 160
      if (isFast && maxCombo > 50) {
        newUnlocks.push({ memberId: lars.name, traitId: 'blast_machine' })
      }
    }

    // Melodic Genius (Marius): Slow Song (<120 BPM) && Max Combo > 30
    if (marius && !hasTrait(marius, 'melodic_genius')) {
      const isSlow = (typeof song?.bpm === 'number') && song.bpm < 120
      if (isSlow && maxCombo > 30) {
        newUnlocks.push({ memberId: marius.name, traitId: 'melodic_genius' })
      }
    }

    // Tech Wizard (Matze): Technical Song (Difficulty > 3) && 100% Accuracy
    if (matze && !hasTrait(matze, 'tech_wizard')) {
      const isTechnical = (song?.difficulty || 0) > 3
      if (isTechnical && accuracy === 100) {
        newUnlocks.push({ memberId: matze.name, traitId: 'tech_wizard' })
      }
    }
  }

  // 2. Travel Unlocks
  if (context.type === 'TRAVEL_COMPLETE') {
    // Road Warrior (Marius): Travel 5000km total (match UI hint)
    if (marius && !hasTrait(marius, 'road_warrior')) {
      if ((player.stats?.totalDistance || 0) >= 5000) {
        newUnlocks.push({ memberId: marius.name, traitId: 'road_warrior' })
      }
    }
  }

  // 3. Purchase Unlocks
  if (context.type === 'PURCHASE') {
    const { item } = context

    // Party Animal (Lars): Own a Beer Fridge
    if (lars && !hasTrait(lars, 'party_animal')) {
      if (item?.id === 'hq_room_cheap_beer_fridge' || (player.hqUpgrades || []).includes('hq_room_cheap_beer_fridge')) {
        newUnlocks.push({ memberId: lars.name, traitId: 'party_animal' })
      }
    }

    // Gear Nerd (Matze): Own 5+ Gear/Instrument items
    if (matze && !hasTrait(matze, 'gear_nerd')) {
      /**
       * Gear Nerd Unlock Logic
       * The `context.gearCount` is pre-calculated by the caller (usePurchaseLogic)
       * which filters inventory against HQ_ITEMS to ensure only GEAR/INSTRUMENT categories count.
       * We rely on this count being >= 5.
       */
      if ((context.gearCount || 0) >= 5) {
        newUnlocks.push({ memberId: matze.name, traitId: 'gear_nerd' })
      }
    }
  }

  // 4. Social Unlocks
  if (context.type === 'SOCIAL_UPDATE') {
    // Social Manager (Marius): 1000+ Followers on any channel
    if (marius && !hasTrait(marius, 'social_manager')) {
      const maxFollowers = Math.max(
        social.instagram || 0,
        social.tiktok || 0,
        social.youtube || 0
      )
      if (maxFollowers >= 1000) {
        newUnlocks.push({ memberId: marius.name, traitId: 'social_manager' })
      }
    }
  }

  // 5. Event Unlocks
  if (context.type === 'EVENT_RESOLVED') {
    // Bandleader (Marius): Resolve 3 conflicts
    if (marius && !hasTrait(marius, 'bandleader')) {
      if ((player.stats?.conflictsResolved || 0) >= 3) {
        newUnlocks.push({ memberId: marius.name, traitId: 'bandleader' })
      }
    }

    // Showman (Lars): Perform 3 Stage Dives
    if (lars && !hasTrait(lars, 'showman')) {
      if ((player.stats?.stageDives || 0) >= 3) {
        newUnlocks.push({ memberId: lars.name, traitId: 'showman' })
      }
    }
  }

  return newUnlocks
}
