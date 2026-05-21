import { hasTrait } from './traitUtils'
import { CHARACTERS } from '../data/characters'
import type { GameState } from '../types'

/**
 * Domain logic for trait unlock evaluation.
 * Inspects game state + a context envelope and returns the
 * list of { memberId, traitId } pairs that have been earned.
 *
 * Does NOT persist anything. For persistence, see ./unlockManager.ts.
 */

type UnlockCheckState = Pick<GameState, 'player' | 'band' | 'social'>

const hasRelationshipBelow = (
  relationships: unknown,
  threshold: number
): boolean => {
  if (!relationships || typeof relationships !== 'object') return false
  for (const key in relationships) {
    if (Object.hasOwn(relationships, key)) {
      const score = (relationships as Record<string, unknown>)[key]
      if (
        typeof score === 'number' &&
        Number.isFinite(score) &&
        score < threshold
      ) {
        return true
      }
    }
  }
  return false
}

/**
 * Checks for trait unlocks based on game state changes.
 * @param {object} state - The full game state (player, band, etc.).
 * @param {object} context - Contextual data (gigStats, purchaseItem, etc.).
 * @returns {Array} List of { memberId, traitId } to unlock.
 */
export const checkTraitUnlocks = (
  state: UnlockCheckState,
  context: unknown = {}
) => {
  const newUnlocks: { memberId: string; traitId: string }[] = []
  const unlockedTraits = new Set<string>()

  const addUnlock = (memberId: string, traitId: string) => {
    newUnlocks.push({ memberId, traitId })
    unlockedTraits.add(traitId)
  }
  const ctx = context as Record<string, unknown>
  const { band, player, social } = state
  const members = band?.members || []

  // Helpers to find members in a single pass (O(N) instead of O(3N))
  let Matze, Marius, Lars
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (!m) continue
    if (m.name === CHARACTERS.MATZE.name) Matze = m
    else if (m.name === CHARACTERS.MARIUS.name) Marius = m
    else if (m.name === CHARACTERS.LARS.name) Lars = m
  }

  // 1. Performance Unlocks (Post-Gig)
  if (
    ctx?.['type'] === 'GIG_COMPLETE' &&
    ctx.gigStats &&
    typeof ctx.gigStats === 'object'
  ) {
    const gigStats = ctx.gigStats as Record<string, unknown>
    const accuracy =
      typeof gigStats.accuracy === 'number' ? gigStats.accuracy : 0
    const misses = typeof gigStats.misses === 'number' ? gigStats.misses : 0
    const song =
      (gigStats.song as Record<string, unknown> | undefined) ?? undefined
    const maxCombo =
      typeof gigStats.maxCombo === 'number' ? gigStats.maxCombo : 0

    // Virtuoso (Matze): 100% Accuracy (0 Misses)
    if (Matze && !hasTrait(Matze, 'virtuoso') && misses === 0) {
      addUnlock(Matze.name, 'virtuoso')
    }

    // Perfektionist (Matze): 100% Accuracy (match UI hint)
    if (Matze && !hasTrait(Matze, 'perfektionist') && accuracy === 100) {
      addUnlock(Matze.name, 'perfektionist')
    }

    // Blast Machine (Marius): Fast song (>160 BPM) && Max Combo > 50
    if (Marius && !hasTrait(Marius, 'blast_machine')) {
      const isFast =
        typeof song?.bpm === 'number' && (song!.bpm as number) > 160
      if (isFast && maxCombo > 50) {
        addUnlock(Marius.name, 'blast_machine')
      }
    }

    // Melodic Genius (Lars): Slow Song (<120 BPM) && Max Combo > 30
    if (Lars && !hasTrait(Lars, 'melodic_genius')) {
      const isSlow = typeof song?.bpm === 'number' && song.bpm < 120
      if (isSlow && maxCombo > 30) {
        addUnlock(Lars.name, 'melodic_genius')
      }
    }

    // Tech Wizard (Matze): Technical Song (Difficulty > 3) && 100% Accuracy
    if (Matze && !hasTrait(Matze, 'tech_wizard')) {
      const isTechnical = (Number(song?.['difficulty']) || 0) > 3
      if (isTechnical && accuracy === 100) {
        addUnlock(Matze.name, 'tech_wizard')
      }
    }
  }

  // 2. Travel Unlocks
  if (ctx?.['type'] === 'TRAVEL_COMPLETE') {
    // Road Warrior (Lars): Travel 5000km total (match UI hint)
    if (Lars && !hasTrait(Lars, 'road_warrior')) {
      if ((player.stats?.totalDistance || 0) >= 5000) {
        addUnlock(Lars.name, 'road_warrior')
      }
    }
  }

  // 3. Purchase Unlocks
  if (ctx?.['type'] === 'PURCHASE') {
    const item = ctx.item as Record<string, unknown> | undefined

    // Party Animal (Marius): Own a Beer Fridge
    if (Marius && !hasTrait(Marius, 'party_animal')) {
      if (
        (typeof item?.id === 'string' &&
          item.id === 'hq_room_cheap_beer_fridge') ||
        (player.hqUpgrades || []).includes('hq_room_cheap_beer_fridge')
      ) {
        addUnlock(Marius.name, 'party_animal')
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
      const gearCount = typeof ctx.gearCount === 'number' ? ctx.gearCount : 0
      if ((gearCount || 0) >= 5) {
        addUnlock(Matze.name, 'gear_nerd')
      }
    }
  }

  // 4. Social Unlocks
  if (ctx?.['type'] === 'SOCIAL_UPDATE') {
    // Social Manager (Lars): 1000+ Followers on any channel
    if (Lars && !hasTrait(Lars, 'social_manager')) {
      const maxFollowers = Math.max(
        social.instagram || 0,
        social.tiktok || 0,
        social.youtube || 0
      )
      if (maxFollowers >= 1000) {
        addUnlock(Lars.name, 'social_manager')
      }
    }
  }

  // 5. Event Unlocks
  if (ctx?.['type'] === 'EVENT_RESOLVED') {
    // Bandleader (Lars): Resolve 3 conflicts
    if (Lars && !hasTrait(Lars, 'bandleader')) {
      if ((player.stats?.conflictsResolved || 0) >= 3) {
        addUnlock(Lars.name, 'bandleader')
      }
    }

    // Showman (Marius): Perform 3 Stage Dives
    if (Marius && !hasTrait(Marius, 'showman')) {
      if ((player.stats?.stageDives || 0) >= 3) {
        addUnlock(Marius.name, 'showman')
      }
    }

    // Grudge Holder (Matze): Relationship < 30
    if (Matze && !hasTrait(Matze, 'grudge_holder') && Matze.relationships) {
      if (
        hasRelationshipBelow(Matze.relationships, 30) &&
        !unlockedTraits.has('grudge_holder')
      ) {
        addUnlock(Matze.name, 'grudge_holder')
      }
    }

    // Peacemaker (Lars): High Band Harmony (e.g. > 90)
    if (Lars && !hasTrait(Lars, 'peacemaker')) {
      if ((band.harmony ?? 1) >= 90) {
        addUnlock(Lars.name, 'peacemaker')
      }
    }
  }

  return newUnlocks
}
