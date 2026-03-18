// TODO: Review this file
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
 * Clamps a band member's stamina to be between 0 and their staminaMax (default 100).
 *
 * @param {number} stamina - Candidate stamina value.
 * @param {number} [staminaMax=100] - The member's maximum stamina.
 * @returns {number} Clamped stamina value.
 */
export const clampMemberStamina = (stamina, staminaMax = 100) => {
  if (!Number.isFinite(stamina)) return 0
  const resolvedStaminaMax = Number.isFinite(staminaMax) ? staminaMax : 100
  return Math.max(0, Math.min(resolvedStaminaMax, Math.floor(stamina)))
}

/**
 * Clamps a band member's mood to be between 0 and 100.
 *
 * @param {number} mood - Candidate mood value.
 * @returns {number} Clamped mood value.
 */
export const clampMemberMood = mood => {
  if (!Number.isFinite(mood)) return 0
  return Math.max(0, Math.min(100, Math.floor(mood)))
}

/**
 * Clamps player fame to be at least 0.
 *
 * @param {number} fame - Candidate fame value.
 * @returns {number} Clamped non-negative fame value.
 */
export const clampPlayerFame = fame => {
  if (!Number.isFinite(fame)) return 0
  return Math.max(0, Math.floor(fame))
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

const calculateClampedStatDelta = (currentValue, deltaValue) => {
  const nextValue = Math.max(0, (currentValue || 0) + deltaValue)
  return nextValue - (currentValue || 0)
}

/**
 * Copies enumerable own properties from source to a new object, filtering out forbidden keys.
 * @param {object} source - Source object to copy from.
 * @returns {object} New object with filtered properties.
 */
const copyFilteredProperties = source => {
  if (!source) return {}
  const destination = {}
  for (const key in source) {
    if (Object.hasOwn(source, key) && !isForbiddenKey(key)) {
      destination[key] = source[key]
    }
  }
  return destination
}

export const calculateAppliedDelta = (state, delta) => {
  const applied = { player: {}, band: {}, social: {} }

  if (delta.flags) {
    applied.flags = copyFilteredProperties(delta.flags)
  } else {
    applied.flags = {}
  }

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
      const nextFame = clampPlayerFame(
        (state.player?.fame || 0) + delta.player.fame
      )
      applied.player.fame = nextFame - (state.player?.fame || 0)
    }
    const scoreDelta =
      typeof delta.player?.score === 'number'
        ? delta.player.score
        : typeof delta.score === 'number'
          ? delta.score
          : 0
    if (scoreDelta !== 0) {
      const nextScore = Math.max(0, (state.player?.score || 0) + scoreDelta)
      applied.score = nextScore - (state.player?.score || 0)
    }
    if (delta.player.van) {
      applied.player.van = {}
      if (typeof delta.player.van.fuel === 'number') {
        const nextFuel = clampVanFuel(
          (state.player?.van?.fuel || 0) + delta.player.van.fuel
        )
        applied.player.van.fuel = nextFuel - (state.player?.van?.fuel || 0)
      }
      if (typeof delta.player.van.condition === 'number') {
        const nextCondition = Math.max(
          0,
          Math.min(
            100,
            (state.player?.van?.condition || 0) + delta.player.van.condition
          )
        )
        applied.player.van.condition =
          nextCondition - (state.player?.van?.condition || 0)
      }
    }
    if (typeof delta.player.day === 'number') {
      applied.player.day = delta.player.day
    }
    if (delta.player.stats) {
      applied.player.stats = copyFilteredProperties(delta.player.stats)
    }
  }

  if (delta.social) {
    if (typeof delta.social.controversyLevel === 'number') {
      applied.social.controversyLevel = calculateClampedStatDelta(
        state.social?.controversyLevel,
        delta.social.controversyLevel
      )
    }
    if (typeof delta.social.viral === 'number') {
      applied.social.viral = calculateClampedStatDelta(
        state.social?.viral,
        delta.social.viral
      )
    }
    if (typeof delta.social.loyalty === 'number') {
      applied.social.loyalty = calculateClampedStatDelta(
        state.social?.loyalty,
        delta.social.loyalty
      )
    }
  }

  if (delta.band) {
    if (typeof delta.band.harmony === 'number') {
      const nextHarmony = clampBandHarmony(
        (state.band?.harmony ?? 1) + delta.band.harmony
      )
      applied.band.harmony = nextHarmony - (state.band?.harmony ?? 1)
    }

    // Inventory
    if (delta.band.inventory) {
      applied.band.inventory = {}
      for (const itemId in delta.band.inventory) {
        if (
          !Object.hasOwn(delta.band.inventory, itemId) ||
          isForbiddenKey(itemId)
        )
          continue

        const qty = delta.band.inventory[itemId]
        if (typeof qty === 'number') {
          if (qty !== 0) {
            applied.band.inventory[itemId] = qty
          }
        } else if (qty === true) {
          applied.band.inventory[itemId] = true
        } else if (qty === false) {
          const current =
            typeof state.band?.inventory?.[itemId] === 'number'
              ? state.band.inventory[itemId]
              : 0
          if (current > 0) {
            applied.band.inventory[itemId] = -1
          } else {
            applied.band.inventory[itemId] = false
          }
        }
      }
    }

    const membersDelta =
      delta.band.membersDelta !== undefined
        ? delta.band.membersDelta
        : delta.band.members

    if (membersDelta && !Array.isArray(membersDelta)) {
      applied.band.membersDelta = copyFilteredProperties(membersDelta)
    } else if (membersDelta && Array.isArray(membersDelta)) {
      applied.band.membersDelta = membersDelta
    }

    if (typeof delta.band.luck === 'number') {
      const nextLuck = Math.max(0, (state.band?.luck || 0) + delta.band.luck)
      applied.band.luck = nextLuck - (state.band?.luck || 0)
    }

    if (typeof delta.band.skill === 'number') {
      const members = Array.isArray(state.band?.members)
        ? state.band.members
        : []
      let totalSkillDelta = 0
      applied.band.members = []
      for (let i = 0; i < members.length; i++) {
        const currentSkill =
          members[i].baseStats && typeof members[i].baseStats.skill === 'number'
            ? members[i].baseStats.skill
            : 5
        const nextSkill = Math.max(
          1,
          Math.min(10, currentSkill + delta.band.skill)
        )
        const memberDelta = nextSkill - currentSkill
        applied.band.members.push({ skill: memberDelta })
        totalSkillDelta += memberDelta
      }
      if (members.length > 0) {
        applied.band.skill = Math.round(totalSkillDelta / members.length)
      }
    }

    if (delta.band.relationshipChange) {
      if (Array.isArray(delta.band.relationshipChange)) {
        applied.band.relationshipChange = [...delta.band.relationshipChange]
      } else {
        applied.band.relationshipChange = copyFilteredProperties(
          delta.band.relationshipChange
        )
      }
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
      nextPlayer.fame = clampPlayerFame(nextPlayer.fame + delta.player.fame)
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
            mood: clampMemberMood(member.mood + moodChange),
            stamina: clampMemberStamina(
              member.stamina + staminaChange,
              member.staminaMax
            )
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
            mood: clampMemberMood(newMood),
            stamina: clampMemberStamina(newStamina, member.staminaMax)
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
          const safeInfluencersUpdate = copyFilteredProperties(value)
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
