import { hasTrait } from './traitLogic.js'
import { EXPENSE_CONSTANTS } from './economyEngine.js'

/**
 * Clamps a value to be at least 0.
 *
 * @param {number} value - Candidate value.
 * @returns {number} Clamped value ensuring non-negative.
 */
export const clampNonNegative = value => Math.max(0, value)

/**
 * Derives fame level from raw fame.
 * @param {number} fame - Raw fame amount.
 * @returns {number} Derived fame level.
 */
export const calculateFameLevel = fame => {
  return Math.floor(Math.max(0, fame || 0) / 1000)
}

/**
 * Clamps player money to a safe, non-negative integer.
 * Prevents negative balances and ensures integer boundaries.
 *
 * @param {number} money - Candidate money value.
 * @returns {number} Clamped money value ensuring non-negative integer.
 */
export const clampPlayerMoney = money => {
  if (!Number.isFinite(money)) return 0
  return Math.floor(Math.max(0, money))
}

/**
 * Clamps band harmony to the canonical gameplay range.
 *
 * @param {number} harmony - Candidate harmony value.
 * @returns {number} Clamped harmony value in range [1, 100].
 */
export const clampBandHarmony = harmony => {
  if (!Number.isFinite(harmony)) return 1
  const safeHarmony = Math.floor(harmony)
  return Math.max(1, Math.min(100, safeHarmony))
}

/**
 * Clamps van fuel to the allowed capacity.
 *
 * @param {number} fuel - Candidate fuel value.
 * @param {number} maxFuel - Maximum capacity.
 * @returns {number} Clamped fuel value.
 */
export const clampVanFuel = (
  fuel,
  maxFuel = EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
) => {
  if (!Number.isFinite(fuel)) return 0
  return Math.max(0, Math.min(maxFuel, fuel))
}

/**
 * Applies an inventory delta to a single inventory slot.
 * @param {boolean|number|undefined} currentValue - Existing inventory value.
 * @param {boolean|number} deltaValue - Delta to apply.
 * @returns {boolean|number|undefined} Updated inventory value.
 */
export const applyInventoryItemDelta = (currentValue, deltaValue) => {
  if (deltaValue === true || deltaValue === false) {
    return deltaValue
  }

  if (typeof deltaValue === 'number') {
    const currentCount = typeof currentValue === 'number' ? currentValue : 0
    return Math.max(0, currentCount + deltaValue)
  }

  return currentValue
}

/**
 * A hardened Set of prohibited object property keys used during state-merge operations.
 * Explicitly guards against prototype pollution vulnerabilities by blocking recursive assignment
 * into sensitive prototype traversal chains (e.g. `__proto__`, `constructor`, `prototype`).
 * Usage ensures event deltas cannot maliciously or accidentally mutate the global Object space.
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
export const isForbiddenKey = key => FORBIDDEN_KEYS.has(key)

/**
 * Applies event delta changes to the current game state.
 * Prevents prototype pollution and merges object properties.
 *
 * @param {object} state - Current game state.
 * @param {object} delta - Event delta payload.
 * @returns {object} Updated game state.
 */

export const calculateAppliedDelta = (state, delta) => {
  const applied = { player: {}, band: {}, social: {}, flags: {} }

  if (delta.player) {
    if (typeof delta.player.money === 'number') {
      const nextMoney = clampPlayerMoney(
        (state.player?.money || 0) + delta.player.money
      )
      applied.player.money = nextMoney - (state.player?.money || 0)
    }
    if (typeof delta.player.time === 'number') {
      applied.player.time = delta.player.time // time is unbounded
    }
    if (typeof delta.player.fame === 'number') {
      const nextFame = Math.max(
        0,
        (state.player?.fame || 0) + delta.player.fame
      )
      applied.player.fame = nextFame - (state.player?.fame || 0)
    }
  }

  if (delta.social) {
    if (typeof delta.social.controversyLevel === 'number') {
      const nextControversy = Math.max(
        0,
        Math.min(
          100,
          (state.social?.controversyLevel || 0) + delta.social.controversyLevel
        )
      )
      applied.social.controversyLevel =
        nextControversy - (state.social?.controversyLevel || 0)
    }
  }

  if (delta.band) {
    if (typeof delta.band.harmony === 'number') {
      const nextHarmony = clampBandHarmony(
        (state.band?.harmony || 0) + delta.band.harmony
      )
      applied.band.harmony = nextHarmony - (state.band?.harmony || 0)
    }

    // Inventory
    if (delta.band.inventory) {
      applied.band.inventory = { ...delta.band.inventory } // we don't clamp inventory right now
    }

    const membersDelta =
      delta.band.membersDelta !== undefined
        ? delta.band.membersDelta
        : delta.band.members

    if (membersDelta && !Array.isArray(membersDelta)) {
      applied.band.membersDelta = { ...membersDelta }
    } else if (membersDelta && Array.isArray(membersDelta)) {
      applied.band.membersDelta = membersDelta
    }
  }

  return applied
}

export const applyEventDelta = (state, delta) => {
  const nextState = { ...state }

  if (delta.player) {
    const nextPlayer = { ...nextState.player }
    if (typeof delta.player.money === 'number') {
      const nextMoney = clampPlayerMoney(nextPlayer.money + delta.player.money)
      nextPlayer.money = nextMoney
    }
    if (typeof delta.player.time === 'number') {
      nextPlayer.time = nextPlayer.time + delta.player.time
    }
    if (typeof delta.player.fame === 'number') {
      nextPlayer.fame = Math.max(0, nextPlayer.fame + delta.player.fame)
      nextPlayer.fameLevel = calculateFameLevel(nextPlayer.fame)
    }
    const scoreDelta =
      typeof delta.player.score === 'number'
        ? delta.player.score
        : typeof delta.score === 'number'
          ? delta.score
          : 0

    if (scoreDelta !== 0) {
      nextPlayer.score = Math.max(0, (nextPlayer.score || 0) + scoreDelta)
    }

    // Player Stats
    if (delta.player.stats) {
      nextPlayer.stats = { ...nextPlayer.stats }
      for (const key in delta.player.stats) {
        if (!Object.hasOwn(delta.player.stats, key) || isForbiddenKey(key))
          continue
        if (typeof delta.player.stats[key] === 'number') {
          nextPlayer.stats[key] = Math.max(
            0,
            (nextPlayer.stats[key] || 0) + delta.player.stats[key]
          )
        } else if (
          typeof delta.player.stats[key] === 'string' ||
          typeof delta.player.stats[key] === 'boolean'
        ) {
          nextPlayer.stats[key] = delta.player.stats[key]
        }
      }
    }

    if (delta.player.van) {
      const nextVan = { ...nextPlayer.van }
      if (typeof delta.player.van.fuel === 'number') {
        nextVan.fuel = clampVanFuel(nextVan.fuel + delta.player.van.fuel)
      }
      if (typeof delta.player.van.condition === 'number') {
        nextVan.condition = Math.max(
          0,
          Math.min(100, nextVan.condition + delta.player.van.condition)
        )
      }
      nextPlayer.van = nextVan
    }
    if (delta.player.location) nextPlayer.location = delta.player.location
    if (delta.player.currentNodeId)
      nextPlayer.currentNodeId = delta.player.currentNodeId
    if (typeof delta.player.day === 'number')
      nextPlayer.day = nextPlayer.day + delta.player.day

    nextState.player = nextPlayer
  }

  if (delta.band) {
    const nextBand = { ...nextState.band }
    if (typeof delta.band.harmony === 'number') {
      const nextHarmony = clampBandHarmony(
        nextBand.harmony + delta.band.harmony
      )
      nextBand.harmony = nextHarmony
    }

    const membersDelta =
      delta.band.membersDelta !== undefined
        ? delta.band.membersDelta
        : delta.band.members
    if (membersDelta) {
      if (Array.isArray(membersDelta)) {
        nextBand.members = nextBand.members.map((member, index) => {
          const memberDelta = membersDelta[index] || {}
          const moodChange =
            typeof memberDelta.moodChange === 'number'
              ? memberDelta.moodChange
              : 0
          const staminaChange =
            typeof memberDelta.staminaChange === 'number'
              ? memberDelta.staminaChange
              : 0
          return {
            ...member,
            mood: Math.max(0, Math.min(100, member.mood + moodChange)),
            stamina: Math.max(0, Math.min(100, member.stamina + staminaChange))
          }
        })
      } else {
        nextBand.members = nextBand.members.map(member => {
          let newMood = member.mood
          let newStamina = member.stamina
          if (typeof membersDelta.moodChange === 'number') {
            newMood += membersDelta.moodChange
          }
          if (typeof membersDelta.staminaChange === 'number') {
            newStamina += membersDelta.staminaChange
          }
          return {
            ...member,
            mood: Math.max(0, Math.min(100, newMood)),
            stamina: Math.max(0, Math.min(100, newStamina))
          }
        })
      }
    }

    if (delta.band.relationshipChange) {
      nextBand.members = nextBand.members.map(member => {
        let newRelationships = { ...member.relationships }
        let hasChanges = false

        const hasGrudgeHolder = hasTrait(member, 'grudge_holder')
        const hasPeacemaker = hasTrait(member, 'peacemaker')

        delta.band.relationshipChange.forEach(change => {
          const otherMember =
            change.member1 === member.name ? change.member2 : change.member1

          if (isForbiddenKey(otherMember)) return

          if (
            change.member1 === member.name ||
            change.member2 === member.name
          ) {
            let amount = change.change
            // Apply traits
            if (amount < 0 && hasGrudgeHolder) {
              amount *= 1.5 // Grudge Holder amplifies negative
            }
            if (amount > 0 && hasPeacemaker) {
              amount *= 1.5 // Peacemaker amplifies positive
            }
            if (amount < 0 && hasPeacemaker) {
              amount *= 0.5 // Peacemaker dampens negative
            }

            const currentScore = newRelationships[otherMember] ?? 50
            newRelationships[otherMember] = Math.max(
              0,
              Math.min(100, Math.round(currentScore + amount))
            )
            hasChanges = true
          }
        })

        if (hasChanges) {
          return { ...member, relationships: newRelationships }
        }
        return member
      })
    }

    if (delta.band.inventory) {
      nextBand.inventory = { ...nextBand.inventory }
      for (const item in delta.band.inventory) {
        if (!Object.hasOwn(delta.band.inventory, item) || isForbiddenKey(item))
          continue
        const val = delta.band.inventory[item]
        nextBand.inventory[item] = applyInventoryItemDelta(
          nextBand.inventory[item],
          val
        )
      }
    }
    if (typeof delta.band.luck === 'number') {
      nextBand.luck = Math.max(0, (nextBand.luck || 0) + delta.band.luck)
    }
    if (typeof delta.band.skill === 'number') {
      nextBand.members = nextBand.members.map(member => {
        const currentSkill =
          member.baseStats && typeof member.baseStats.skill === 'number'
            ? member.baseStats.skill
            : 5
        return {
          ...member,
          baseStats: {
            ...member.baseStats,
            skill: Math.max(1, Math.min(10, currentSkill + delta.band.skill))
          }
        }
      })
    }
    nextState.band = nextBand
  }

  if (delta.social) {
    const nextSocial = { ...nextState.social }
    for (const key in delta.social) {
      if (!Object.hasOwn(delta.social, key) || isForbiddenKey(key)) continue
      const value = delta.social[key]

      if (key === 'influencers') {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const safeInfluencersUpdate = {}
          for (const influencerId in value) {
            if (
              !Object.hasOwn(value, influencerId) ||
              isForbiddenKey(influencerId)
            )
              continue
            const influencerData = value[influencerId]
            safeInfluencersUpdate[influencerId] = influencerData
          }
          nextSocial[key] = {
            ...(nextSocial[key] || {}),
            ...safeInfluencersUpdate
          }
        }
      } else if (key === 'egoFocus') {
        if (value === null || typeof value === 'string') {
          nextSocial[key] = value
        }
      } else if (key === 'sponsorActive') {
        if (typeof value === 'boolean') {
          nextSocial[key] = value
        }
      } else if (key === 'trend') {
        if (typeof value === 'string') {
          nextSocial[key] = value
        }
      } else if (key === 'lastGigDay') {
        if (
          value === null ||
          (typeof value === 'number' && Number.isFinite(value))
        ) {
          nextSocial[key] = value
        }
      } else if (typeof value === 'number') {
        const currentValue =
          typeof nextSocial[key] === 'number' ? nextSocial[key] : 0
        nextSocial[key] = Math.max(0, currentValue + value)
      }
    }
    nextState.social = nextSocial
  }

  if (delta.flags) {
    if (delta.flags.addStoryFlag) {
      if (!nextState.activeStoryFlags.includes(delta.flags.addStoryFlag)) {
        nextState.activeStoryFlags = [
          ...nextState.activeStoryFlags,
          delta.flags.addStoryFlag
        ]
      }
    }
    if (delta.flags.queueEvent) {
      nextState.pendingEvents = [
        ...nextState.pendingEvents,
        delta.flags.queueEvent
      ]
    }
    if (delta.flags.addCooldown) {
      if (!nextState.eventCooldowns.includes(delta.flags.addCooldown)) {
        nextState.eventCooldowns = [
          ...nextState.eventCooldowns,
          delta.flags.addCooldown
        ]
      }
    }
  }

  return nextState
}
