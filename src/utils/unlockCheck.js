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
  const getMember = name => members.find(m => m.name === name)
  const Matze = getMember(CHARACTERS.MATZE.name)
  const Marius = getMember(CHARACTERS.MARIUS.name)
  const Lars = getMember(CHARACTERS.LARS.name)

  // 1. Performance Unlocks (Post-Gig)
  if (context.type === 'GIG_COMPLETE' && context.gigStats) {
    const { accuracy, misses, song, maxCombo } = context.gigStats

    // Virtuoso (Matze): 100% Accuracy (0 Misses)
    if (Matze && !hasTrait(Matze, 'virtuoso') && misses === 0) {
      newUnlocks.push({ memberId: Matze.name, traitId: 'virtuoso' })
    }

    // Perfektionist (Matze): 100% Accuracy (match UI hint)
    if (Matze && !hasTrait(Matze, 'perfektionist') && accuracy === 100) {
      newUnlocks.push({ memberId: Matze.name, traitId: 'perfektionist' })
    }

    // Blast Machine (Marius): Fast song (>160 BPM) && Max Combo > 50
    if (Marius && !hasTrait(Marius, 'blast_machine')) {
      const isFast = typeof song?.bpm === 'number' && song.bpm > 160
      if (isFast && maxCombo > 50) {
        newUnlocks.push({ memberId: Marius.name, traitId: 'blast_machine' })
      }
    }

    // Melodic Genius (Lars): Slow Song (<120 BPM) && Max Combo > 30
    if (Lars && !hasTrait(Lars, 'melodic_genius')) {
      const isSlow = typeof song?.bpm === 'number' && song.bpm < 120
      if (isSlow && maxCombo > 30) {
        newUnlocks.push({ memberId: Lars.name, traitId: 'melodic_genius' })
      }
    }

    // Tech Wizard (Matze): Technical Song (Difficulty > 3) && 100% Accuracy
    if (Matze && !hasTrait(Matze, 'tech_wizard')) {
      const isTechnical = (song?.difficulty || 0) > 3
      if (isTechnical && accuracy === 100) {
        newUnlocks.push({ memberId: Matze.name, traitId: 'tech_wizard' })
      }
    }
  }

  // 2. Travel Unlocks
  if (context.type === 'TRAVEL_COMPLETE') {
    // Road Warrior (Lars): Travel 5000km total (match UI hint)
    if (Lars && !hasTrait(Lars, 'road_warrior')) {
      if ((player.stats?.totalDistance || 0) >= 5000) {
        newUnlocks.push({ memberId: Lars.name, traitId: 'road_warrior' })
      }
    }
  }

  // 3. Purchase Unlocks
  if (context.type === 'PURCHASE') {
    const { item } = context

    // Party Animal (Marius): Own a Beer Fridge
    if (Marius && !hasTrait(Marius, 'party_animal')) {
      if (
        item?.id === 'hq_room_cheap_beer_fridge' ||
        (player.hqUpgrades || []).includes('hq_room_cheap_beer_fridge')
      ) {
        newUnlocks.push({ memberId: Marius.name, traitId: 'party_animal' })
      }
    }

    // Gear Nerd (Matze): Own 5+ Gear/Instrument items
    if (Matze && !hasTrait(Matze, 'gear_nerd')) {
      /**
       * Gear Nerd Unlock Logic
       * The `context.gearCount` is pre-calculated by the caller (usePurchaseLogic)
       * which filters inventory against HQ_ITEMS to ensure only GEAR/INSTRUMENT categories count.
       * We rely on this count being >= 5.
       */
      if ((context.gearCount || 0) >= 5) {
        newUnlocks.push({ memberId: Matze.name, traitId: 'gear_nerd' })
      }
    }
  }

  // 4. Social Unlocks
  if (context.type === 'SOCIAL_UPDATE') {
    // Social Manager (Lars): 1000+ Followers on any channel
    if (Lars && !hasTrait(Lars, 'social_manager')) {
      const maxFollowers = Math.max(
        social.instagram || 0,
        social.tiktok || 0,
        social.youtube || 0
      )
      if (maxFollowers >= 1000) {
        newUnlocks.push({ memberId: Lars.name, traitId: 'social_manager' })
      }
    }
  }

  // 5. Event Unlocks
  if (context.type === 'EVENT_RESOLVED') {
    // Bandleader (Lars): Resolve 3 conflicts
    if (Lars && !hasTrait(Lars, 'bandleader')) {
      if ((player.stats?.conflictsResolved || 0) >= 3) {
        newUnlocks.push({ memberId: Lars.name, traitId: 'bandleader' })
      }
    }

    // Showman (Marius): Perform 3 Stage Dives
    if (Marius && !hasTrait(Marius, 'showman')) {
      if ((player.stats?.stageDives || 0) >= 3) {
        newUnlocks.push({ memberId: Marius.name, traitId: 'showman' })
      }
    }

    // Grudge Holder (Matze): Relationship < 30
    if (Matze && !hasTrait(Matze, 'grudge_holder')) {
      if (
        Matze.relationships &&
        Object.values(Matze.relationships).some(score => score < 30)
      ) {
        newUnlocks.push({ memberId: Matze.name, traitId: 'grudge_holder' })
      }
    }

    // Peacemaker (Lars): High Band Harmony (e.g. > 90)
    if (Lars && !hasTrait(Lars, 'peacemaker')) {
      if ((band.harmony || 0) >= 90) {
        newUnlocks.push({ memberId: Lars.name, traitId: 'peacemaker' })
      }
    }
  }

  return newUnlocks
}
