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
 * Calculates fame gain with exponential diminishing returns.
 * Ensures the logic is synced across the app and simulation.
 * @param {number} rawGain - The uncapped fame gain calculated from performance.
 * @param {number} currentFame - The player's current fame.
 * @param {number} [maxGain=500] - Hard cap on raw gain.
 * @returns {number} The final damped fame gain.
 */
export const calculateFameGain = (rawGain, currentFame, maxGain = 500) => {
  let fameGain = Math.min(maxGain, rawGain)
  const prevFame = currentFame ?? 0

  if (fameGain > 0 && prevFame > 50) {
    const diminishingMultiplier = Math.exp(-(prevFame - 50) * 0.01)
    fameGain = Math.max(1, Math.round(fameGain * diminishingMultiplier))
  }

  return fameGain
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

// Shared Balance Constants
export const BALANCE_CONSTANTS = {
  FAME_LOSS_BAD_GIG: 4,
  MAX_FAME_GAIN: 500,
  LOW_HARMONY_THRESHOLD: 15,
  LOW_HARMONY_CANCELLATION_CHANCE: 0.25
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
  const keys = Object.keys(source)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (!isForbiddenKey(key)) {
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
      const currentMoney = Math.max(0, state.player?.money || 0)
      const nextMoney = clampPlayerMoney(currentMoney + delta.player.money)
      applied.player.money = nextMoney - currentMoney
    }
    if (typeof delta.player.time === 'number') {
      applied.player.time = delta.player.time // time is unbounded
    }
    if (typeof delta.player.fame === 'number') {
      const currentFame = Math.max(0, state.player?.fame || 0)
      const nextFame = clampPlayerFame(currentFame + delta.player.fame)
      applied.player.fame = nextFame - currentFame
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
      const currentHarmony = clampBandHarmony(state.band?.harmony ?? 1)
      const nextHarmony = clampBandHarmony(currentHarmony + delta.band.harmony)
      applied.band.harmony = nextHarmony - currentHarmony
    }

    // Inventory
    if (delta.band.inventory) {
      applied.band.inventory = {}
      // Optimization: using Object.keys avoids prototype chain traversal and Object.hasOwn checks
      const inventoryKeys = Object.keys(delta.band.inventory)
      for (let i = 0; i < inventoryKeys.length; i++) {
        const itemId = inventoryKeys[i]
        if (isForbiddenKey(itemId)) continue

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
      const statKeys = Object.keys(delta.player.stats)
      for (let i = 0; i < statKeys.length; i++) {
        const key = statKeys[i]
        if (isForbiddenKey(key)) continue

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

    const membersDelta = delta.band.membersDelta ?? delta.band.members
    const relationshipChange = delta.band.relationshipChange
    const skillDelta = delta.band.skill

    if (membersDelta || relationshipChange || typeof skillDelta === 'number') {
      const isArrayDelta = Array.isArray(membersDelta)
      const memberCount = nextBand.members.length
      let updatedMembers = null
      let bandChanged = false

      for (let i = 0; i < memberCount; i++) {
        const member = nextBand.members[i]
        let nextMember = member
        let memberHasChanges = false

        // 1. Mood & Stamina
        if (membersDelta) {
          const mDelta = isArrayDelta ? membersDelta[i] || {} : membersDelta
          const moodChange =
            typeof mDelta.moodChange === 'number' ? mDelta.moodChange : 0
          const staminaChange =
            typeof mDelta.staminaChange === 'number' ? mDelta.staminaChange : 0

          if (moodChange !== 0 || staminaChange !== 0) {
            const newMood = clampMemberMood(member.mood + moodChange)
            const newStamina = clampMemberStamina(
              member.stamina + staminaChange,
              member.staminaMax
            )

            if (newMood !== member.mood || newStamina !== member.stamina) {
              nextMember = { ...nextMember, mood: newMood, stamina: newStamina }
              memberHasChanges = true
            }
          }
        }

        // 2. Relationships
        if (relationshipChange) {
          let newRelationships = null
          const hasGrudgeHolder = hasTrait(member, 'grudge_holder')
          const hasPeacemaker = hasTrait(member, 'peacemaker')

          for (let j = 0; j < relationshipChange.length; j++) {
            const change = relationshipChange[j]
            const isM1 = change.member1 === member.name
            const isM2 = change.member2 === member.name

            if (isM1 || isM2) {
              const other = isM1 ? change.member2 : change.member1
              if (isForbiddenKey(other)) continue

              let amount = change.change
              // Apply traits
              if (amount < 0 && hasGrudgeHolder) amount *= 1.5
              if (amount > 0 && hasPeacemaker) amount *= 1.5
              if (amount < 0 && hasPeacemaker) amount *= 0.5

              const relSource =
                newRelationships || nextMember.relationships || {}
              const oldExists = Object.hasOwn(relSource, other)
              const currentScore = relSource[other] ?? 50
              const newScore = Math.max(
                0,
                Math.min(100, Math.round(currentScore + amount))
              )

              if (oldExists || newScore !== 50) {
                if (!newRelationships) {
                  newRelationships = { ...(nextMember.relationships || {}) }
                }
                newRelationships[other] = newScore
              }
            }
          }

          if (newRelationships) {
            let relationshipsActuallyChanged = false
            const newRelKeys = Object.keys(newRelationships)
            for (let k = 0; k < newRelKeys.length; k++) {
              const key = newRelKeys[k]
              if (newRelationships[key] !== member.relationships?.[key]) {
                relationshipsActuallyChanged = true
                break
              }
            }

            if (relationshipsActuallyChanged) {
              if (nextMember === member) nextMember = { ...member }
              nextMember.relationships = newRelationships
              memberHasChanges = true
            }
          }
        }

        // 3. Skill
        if (typeof skillDelta === 'number' && skillDelta !== 0) {
          const currentSkill =
            member.baseStats && typeof member.baseStats.skill === 'number'
              ? member.baseStats.skill
              : 5
          const newSkill = Math.max(1, Math.min(10, currentSkill + skillDelta))

          if (newSkill !== currentSkill) {
            if (nextMember === member) nextMember = { ...member }
            nextMember.baseStats = {
              ...nextMember.baseStats,
              skill: newSkill
            }
            memberHasChanges = true
          }
        }

        if (memberHasChanges) {
          if (!bandChanged) {
            bandChanged = true
            updatedMembers = new Array(memberCount)
            for (let k = 0; k < i; k++) {
              updatedMembers[k] = nextBand.members[k]
            }
          }
          updatedMembers[i] = nextMember
        } else if (bandChanged) {
          updatedMembers[i] = member
        }
      }

      if (bandChanged) {
        nextBand.members = updatedMembers
      }
    }

    if (delta.band.inventory) {
      nextBand.inventory = { ...nextBand.inventory }
      const bandInventoryKeys = Object.keys(delta.band.inventory)
      for (let i = 0; i < bandInventoryKeys.length; i++) {
        const item = bandInventoryKeys[i]
        if (isForbiddenKey(item)) continue
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
    nextState.band = nextBand
  }

  if (delta.social) {
    const nextSocial = { ...nextState.social }
    const socialKeys = Object.keys(delta.social)
    for (let i = 0; i < socialKeys.length; i++) {
      const key = socialKeys[i]
      if (isForbiddenKey(key)) continue
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

/**
 * Checks if a collection (Set or Array) contains an item.
 * Used primarily for optimizedState which passes Sets instead of Arrays for performance.
 *
 * @param {Set|Array} collection - The collection to check.
 * @param {any} item - The item to look for.
 * @returns {boolean} True if the collection contains the item.
 */
export const hasStateItem = (collection, item) => {
  return collection instanceof Set
    ? collection.has(item)
    : (collection || []).includes(item)
}
