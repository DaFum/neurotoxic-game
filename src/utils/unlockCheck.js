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

    // Perfektionist (Matze): > 95% Accuracy
    if (matze && !hasTrait(matze, 'perfektionist') && accuracy > 95) {
      newUnlocks.push({ memberId: matze.name, traitId: 'perfektionist' })
    }

    // Blast Machine (Lars): Fast song (>160 BPM) && Max Combo > 50
    if (lars && !hasTrait(lars, 'blast_machine')) {
      const isFast = (song?.bpm || 0) > 160
      if (isFast && maxCombo > 50) {
        newUnlocks.push({ memberId: lars.name, traitId: 'blast_machine' })
      }
    }
  }

  // 2. Travel Unlocks
  if (context.type === 'TRAVEL_COMPLETE') {
    // Road Warrior (Marius): Travel 3000km total
    if (marius && !hasTrait(marius, 'road_warrior')) {
      if ((player.stats?.totalDistance || 0) >= 3000) {
        newUnlocks.push({ memberId: marius.name, traitId: 'road_warrior' })
      }
    }
  }

  // 3. Purchase Unlocks
  if (context.type === 'PURCHASE') {
    const { item, inventory } = context

    // Party Animal (Lars): Own a Beer Fridge
    if (lars && !hasTrait(lars, 'party_animal')) {
      if (item?.id === 'hq_room_cheap_beer_fridge' || (player.hqUpgrades || []).includes('hq_room_cheap_beer_fridge')) {
        newUnlocks.push({ memberId: lars.name, traitId: 'party_animal' })
      }
    }

    // Gear Nerd (Matze): Own 5+ Gear/Instrument items
    if (matze && !hasTrait(matze, 'gear_nerd')) {
      // Count gear in inventory + instruments (which might be in inventory or implied?)
      // Current inventory structure: { strings: true, shirts: 50 ... }
      // We rely on context.inventory or state.band.inventory
      // BUT `inventory` in state is mixed. We need to know which keys are GEAR.
      // Since we don't have the item DB here easily, we might need to rely on the purchase event providing info
      // OR approximate.
      // Let's assume the caller passes the current count or we count known gear keys.
      // Better: Check context.gearCount if provided, or iterate keys.
      // For now, let's use a simple heuristic or expect caller to pass relevant data.
      // Actually, let's check `item.category` from context if available.

      // Alternative: Just count keys that are NOT 'shirts', 'hoodies', 'patches', 'cds', 'vinyl'.
      const nonMerchKeys = Object.keys(inventory || {}).filter(k =>
        !['shirts', 'hoodies', 'patches', 'cds', 'vinyl'].includes(k) && inventory[k]
      )
      // This is weak. Let's rely on the hook to verify this or pass a flag.
      // Or: Check if we just bought the 5th item.
      if (context.gearCount && context.gearCount >= 5) {
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
  }

  return newUnlocks
}
