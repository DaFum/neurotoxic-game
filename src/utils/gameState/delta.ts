import { finiteNumberOr, isFiniteNumber } from '../finiteNumber'
import { logger } from '../logger'
import { hasTrait } from '../traitUtils'
import {
  RELATIONSHIP_GRUDGE_HOLDER_MULTIPLIER,
  RELATIONSHIP_PEACEMAKER_NEGATIVE_MULTIPLIER,
  RELATIONSHIP_PEACEMAKER_POSITIVE_MULTIPLIER,
  RELATIONSHIP_DEFAULT_SCORE
} from './constants'
import {
  clampPlayerMoney,
  clampPlayerFame,
  clampBandHarmony,
  clampMemberMood,
  clampMemberStamina,
  clampRelationship,
  clampNonNegative,
  clampControversyLevel,
  clampVanCondition,
  clampVanFuel
} from './clamps'
import { calculateFameLevel } from './calculations'



import { isForbiddenKey, isLooseRecord, safeJsonParse } from '../objectUtils'

import type {
  BandMember,
  GameState,
  RelationshipChange,
  StashEntry,
  EventDelta
} from '../../types'

/**
 * Applies an inventory delta to a single inventory slot. Used by the
 * `EVENT_DELTA` reducer path to merge boolean overwrites or numeric
 * additions into one inventory key. For the purchase/HQ pipeline that
 * consumes `Effect` shapes and builds full band patches, see
 * `applyInventoryAdd` in `purchaseLogicUtils.ts`.
 *
 * @param currentValue - Existing inventory value.
 * @param deltaValue - Delta to apply.
 * @returns Updated inventory value.
 */
export const applyInventoryItemDelta = (
  currentValue: boolean | number | undefined,
  deltaValue: boolean | number
): boolean | number | undefined => {
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
 * Applies event delta changes to the current game state.
 * Prevents prototype pollution and merges object properties.
 *
 * @param state - Current game state.
 * @param delta - Event delta payload.
 * @returns Updated game state.
 */

const calculateClampedStatDelta = (
  currentValue: number | null | undefined,
  deltaValue: number
): number => {
  const baseValue = finiteNumberOr(currentValue, 0)
  const nextValue = Math.max(0, baseValue + deltaValue)
  return nextValue - baseValue
}

const calculateClampedControversyDelta = (
  currentValue: number | null | undefined,
  deltaValue: number
): number => {
  const baseValue = finiteNumberOr(currentValue, 0)
  const nextValue = clampControversyLevel(baseValue + deltaValue)
  return nextValue - baseValue
}

/**
 * Copies enumerable own properties from source to a new object, filtering out forbidden keys.
 * @param source - Source object to copy from.
 * @returns New object with filtered properties.
 */
type FilteredRecord = Record<string, unknown>

type MemberDelta = FilteredRecord & {
  moodChange?: number
  staminaChange?: number
}

type MutableGameState = GameState & {
  player: GameState['player'] & {
    stats: Record<string, string | number | boolean | unknown>
  }
  band: GameState['band'] & {
    inventory: Record<string, boolean | number | unknown>
    stash: Record<string, unknown>
  }
  social: GameState['social'] & Record<string, unknown>
  activeStoryFlags: string[]
  pendingEvents: unknown[]
  eventCooldowns: string[]
}

type DeltaPreviewState = {
  player?: Record<string, unknown> & {
    money?: number
    time?: number
    fame?: number
    score?: number
    day?: number
    stats?: Record<string, string | number | boolean | unknown>
    van?: Record<string, unknown>
  }
  band?: Record<string, unknown> & {
    harmony?: number
    members?: Array<Partial<BandMember> | null | undefined>
    inventory?: Record<string, unknown>
    luck?: number
    skill?: number
  }
  social?: Record<string, unknown> & {
    controversyLevel?: number
    viral?: number
    loyalty?: number
  }
}

type AppliedDelta = {
  player: FilteredRecord & { van?: FilteredRecord; stats?: FilteredRecord }
  band: FilteredRecord & {
    inventory?: FilteredRecord
    members?: FilteredRecord[]
    membersDelta?: FilteredRecord[]
    relationshipChange?: RelationshipChange[] | FilteredRecord
  }
  social: FilteredRecord
  flags?: FilteredRecord
  score?: number
}

const copyFilteredProperties = (source: unknown): FilteredRecord => {
  if (typeof source !== 'object' || source === null) return Object.create(null)

  // Explicit check for prototype pollution before copying properties
  if (
    Object.hasOwn(source, '__proto__') ||
    Object.hasOwn(source, 'constructor') ||
    Object.hasOwn(source, 'prototype')
  ) {
    logger?.warn?.(
      'Security',
      'Blocked attempt to copy prototype properties in copyFilteredProperties'
    )
  }

  // Create an object with no prototype to safely copy properties into
  const destination: FilteredRecord = Object.create(null)
  const sourceRecord = source as Record<string, unknown>

  for (const key in sourceRecord) {
    if (!Object.hasOwn(sourceRecord, key)) continue
    if (!isForbiddenKey(key)) {
      destination[key] = sourceRecord[key]
    }
  }
  return destination
}

const asMemberDelta = (value: unknown): MemberDelta | null =>
  isLooseRecord(value) ? value : null

const isRelationshipChange = (value: unknown): value is RelationshipChange => {
  if (!isLooseRecord(value)) return false
  return (
    typeof value.member1 === 'string' &&
    typeof value.member2 === 'string' &&
    typeof value.change === 'number'
  )
}

/**
 * Previews the effective clamped state deltas from an event delta.
 *
 * @param state - Lightweight state preview used as the current clamp baseline.
 * @param delta - Event delta to preview without mutating state.
 * @returns Effective player, band, social, flag, and score changes after clamping and filtering.
 */
export const calculateAppliedDelta = (
  state: DeltaPreviewState,
  delta: EventDelta
): AppliedDelta => {
  const applied: AppliedDelta = { player: {}, band: {}, social: {} }

  if (delta.flags) {
    applied.flags = copyFilteredProperties(delta.flags)
  } else {
    applied.flags = {}
  }

  if (delta.player) {
    if (isFiniteNumber(delta.player.money)) {
      const currentMoney = Math.max(0, finiteNumberOr(state.player?.money, 0))
      const nextMoney = clampPlayerMoney(currentMoney + delta.player.money)
      applied.player.money = nextMoney - currentMoney
    }
    if (isFiniteNumber(delta.player.time)) {
      applied.player.time = delta.player.time // time is unbounded
    }
    if (isFiniteNumber(delta.player.fame)) {
      const currentFame = Math.max(0, finiteNumberOr(state.player?.fame, 0))
      const nextFame = clampPlayerFame(currentFame + delta.player.fame)
      applied.player.fame = nextFame - currentFame
    }
    const scoreDelta =
      isFiniteNumber(delta.player?.score)
        ? delta.player.score
        : isFiniteNumber(delta.score)
          ? delta.score
          : 0
    if (scoreDelta !== 0) {
      const currentScore = Math.max(0, finiteNumberOr(state.player?.score, 0))
      const nextScore = Math.max(0, currentScore + scoreDelta)
      applied.score = nextScore - currentScore
    }
    if (delta.player.van) {
      applied.player.van = {}
      if (isFiniteNumber(delta.player.van.fuel)) {
        const currentFuel = finiteNumberOr(state.player?.van?.fuel, 0)
        const nextFuel = clampVanFuel(currentFuel + delta.player.van.fuel)
        applied.player.van.fuel = nextFuel - currentFuel
      }
      if (isFiniteNumber(delta.player.van.condition)) {
        const currentCondition = finiteNumberOr(state.player?.van?.condition, 0)
        const nextCondition = clampVanCondition(
          currentCondition + delta.player.van.condition
        )
        applied.player.van.condition = nextCondition - currentCondition
      }
    }
    if (isFiniteNumber(delta.player.day)) {
      applied.player.day = delta.player.day
    }
    if (delta.player.stats) {
      applied.player.stats = copyFilteredProperties(delta.player.stats)
    }
  }

  if (delta.social) {
    if (isFiniteNumber(delta.social.controversyLevel)) {
      applied.social.controversyLevel = calculateClampedControversyDelta(
        state.social?.controversyLevel,
        delta.social.controversyLevel
      )
    }
    if (isFiniteNumber(delta.social.viral)) {
      applied.social.viral = calculateClampedStatDelta(
        state.social?.viral,
        delta.social.viral
      )
    }
    if (isFiniteNumber(delta.social.loyalty)) {
      applied.social.loyalty = calculateClampedStatDelta(
        state.social?.loyalty,
        delta.social.loyalty
      )
    }
  }

  if (delta.band) {
    if (isFiniteNumber(delta.band.harmony)) {
      const currentHarmony = clampBandHarmony(
        finiteNumberOr(state.band?.harmony, 1)
      )
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
        if (!itemId) continue
        if (isForbiddenKey(itemId)) continue

        const qty = delta.band.inventory[itemId]
        const currentCount =
          typeof state.band?.inventory?.[itemId] === 'number'
            ? state.band.inventory[itemId]
            : 0

        if (typeof qty === 'number') {
          if (qty !== 0) {
            const nextCount = Math.max(0, currentCount + qty)
            const actualChange = nextCount - currentCount
            if (actualChange !== 0) {
              applied.band.inventory[itemId] = actualChange
            }
          }
        } else if (qty === true) {
          applied.band.inventory[itemId] = true
        } else if (qty === false) {
          if (currentCount > 0) {
            applied.band.inventory[itemId] = -currentCount
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

    if (
      membersDelta &&
      (Array.isArray(membersDelta) || isLooseRecord(membersDelta))
    ) {
      const isArrayDelta = Array.isArray(membersDelta)
      const members = Array.isArray(state.band?.members)
        ? state.band.members
        : []

      const computedMembersDelta: FilteredRecord[] = []

      for (let i = 0; i < members.length; i++) {
        const member = members[i]
        if (!member) {
          computedMembersDelta.push(Object.create(null))
          continue
        }
        const rawMemberDelta = isArrayDelta ? membersDelta[i] : membersDelta
        const memberDelta = asMemberDelta(rawMemberDelta)
        const mDelta = memberDelta
          ? copyFilteredProperties(memberDelta)
          : Object.create(null)

        const moodChange = finiteNumberOr(mDelta.moodChange, 0)
        const staminaChange = finiteNumberOr(mDelta.staminaChange, 0)

        const currentMood = finiteNumberOr(member.mood, 0)
        const currentStamina = finiteNumberOr(member.stamina, 0)
        const staminaMax = finiteNumberOr(member.staminaMax, 100)

        const newMood = clampMemberMood(currentMood + moodChange)
        const newStamina = clampMemberStamina(
          currentStamina + staminaChange,
          staminaMax
        )

        const actualMoodChange = newMood - currentMood
        const actualStaminaChange = newStamina - currentStamina

        // Keep all other properties of the original delta, override only mood and stamina if they exist
        const newDelta = copyFilteredProperties(mDelta)
        if (typeof mDelta.moodChange === 'number')
          newDelta.moodChange = actualMoodChange
        if (typeof mDelta.staminaChange === 'number')
          newDelta.staminaChange = actualStaminaChange

        computedMembersDelta.push(newDelta)
      }

      // We always resolve to an array delta because global deltas apply differently to each member based on clamps
      applied.band.membersDelta = computedMembersDelta
    }

    if (typeof delta.band.luck === 'number') {
      const currentLuck = finiteNumberOr(state.band?.luck, 0)
      const nextLuck = Math.max(0, currentLuck + delta.band.luck)
      applied.band.luck = nextLuck - currentLuck
    }

    if (typeof delta.band.skill === 'number') {
      const members = Array.isArray(state.band?.members)
        ? state.band.members
        : []
      let totalSkillDelta = 0
      applied.band.members = []
      for (let i = 0; i < members.length; i++) {
        const member = members[i]
        if (!member) continue
        const currentSkill =
          member.baseStats && typeof member.baseStats.skill === 'number'
            ? member.baseStats.skill
            : 5
        const nextSkill = Math.max(
          1,
          Math.min(10, currentSkill + delta.band.skill)
        )
        const memberDelta = nextSkill - currentSkill
        applied.band.members.push({ skill: memberDelta })
        totalSkillDelta += memberDelta
      }
      const validCount = applied.band.members.length
      if (validCount > 0) {
        applied.band.skill = Math.round(totalSkillDelta / validCount)
      }
    }

    if (delta.band.relationshipChange) {
      const isNotSelfRelationship = (rc: RelationshipChange) =>
        rc.member1 !== rc.member2
      if (Array.isArray(delta.band.relationshipChange)) {
        applied.band.relationshipChange = delta.band.relationshipChange.filter(
          rc =>
            isRelationshipChange(rc) &&
            isNotSelfRelationship(rc as RelationshipChange)
        )
      } else {
        applied.band.relationshipChange =
          isRelationshipChange(delta.band.relationshipChange) &&
          isNotSelfRelationship(
            delta.band.relationshipChange as RelationshipChange
          )
            ? [delta.band.relationshipChange]
            : []
      }
    }
  }

  return applied
}

/**
 * Calculates the relationship change between members.
 *
 * @param change - The relationship change data.
 * @param memberName - The name of the member being evaluated.
 * @param hasGrudgeHolder - If the member has grudge_holder trait.
 * @param hasPeacemaker - If the member has peacemaker trait.
 * @param currentRelationships - The current relationships of the member.
 * @returns Relationship target and score when a modifier applies, otherwise
 * null.
 */
const calculateMemberRelationshipChange = (
  change: RelationshipChange,
  memberName: string,
  hasGrudgeHolder: boolean,
  hasPeacemaker: boolean,
  currentRelationships: Record<string, number>
): { other: string; newScore: number } | null => {
  const isM1 = change.member1 === memberName
  const isM2 = change.member2 === memberName

  if (!isM1 && !isM2) return null

  const other = isM1 ? change.member2 : change.member1
  if (isForbiddenKey(other)) return null

  let amount = change.change
  // Apply traits
  if (amount < 0) {
    if (hasGrudgeHolder && !hasPeacemaker) {
      // Grudge holder amplifies negative relationship changes
      amount *= RELATIONSHIP_GRUDGE_HOLDER_MULTIPLIER
    } else if (!hasGrudgeHolder && hasPeacemaker) {
      // Peacemaker dampens negative relationship changes
      amount *= RELATIONSHIP_PEACEMAKER_NEGATIVE_MULTIPLIER
    }
    // If both traits are present, they cancel each other out explicitly by applying no multipliers.
  } else if (amount > 0) {
    if (hasPeacemaker) {
      // Peacemaker amplifies positive relationship changes
      amount *= RELATIONSHIP_PEACEMAKER_POSITIVE_MULTIPLIER
    }
  }

  const currentScore = currentRelationships[other] ?? RELATIONSHIP_DEFAULT_SCORE
  const newScore = clampRelationship(currentScore + amount)

  return { other, newScore }
}

/**
 * Applies an event delta to mutable game state while enforcing clamps.
 *
 * @param state - Mutable-compatible game state receiving the delta.
 * @param delta - Event delta to apply.
 * @returns New mutable-compatible state with filtered and clamped delta effects applied.
 */
export const applyEventDelta = (
  state: MutableGameState,
  delta: EventDelta
): MutableGameState => {
  const nextState: MutableGameState = { ...state }

  if (delta.player) {
    const nextPlayer = { ...nextState.player }
    if (isFiniteNumber(delta.player.money)) {
      const nextMoney = clampPlayerMoney(
        finiteNumberOr(nextPlayer.money, 0) + delta.player.money
      )
      nextPlayer.money = nextMoney
    }
    if (isFiniteNumber(delta.player.time)) {
      nextPlayer.time = nextPlayer.time + delta.player.time
    }
    if (isFiniteNumber(delta.player.fame)) {
      nextPlayer.fame = clampPlayerFame(
        finiteNumberOr(nextPlayer.fame, 0) + delta.player.fame
      )
      nextPlayer.fameLevel = calculateFameLevel(nextPlayer.fame)
    }
    const scoreDelta =
      isFiniteNumber(delta.player.score)
        ? delta.player.score
        : isFiniteNumber(delta.score)
          ? delta.score
          : 0

    if (scoreDelta !== 0) {
      const boundedScore = clampNonNegative(nextPlayer.score)
      // Match calculateAppliedDelta: score is non-negative. A large negative
      // delta (e.g. -1000 from ego-breakup consequences) must not drive
      // player.score below 0.
      nextPlayer.score = Math.max(0, boundedScore + scoreDelta)
    }

    // Player Stats
    if (delta.player.stats) {
      nextPlayer.stats = { ...nextPlayer.stats }
      const statKeys = Object.keys(delta.player.stats)
      for (let i = 0; i < statKeys.length; i++) {
        const key = statKeys[i]
        if (!key) continue
        if (isForbiddenKey(key)) continue

        const statDelta = delta.player.stats[key]
        if (isFiniteNumber(statDelta)) {
          const currentStat =
            typeof nextPlayer.stats[key] === 'number'
              ? nextPlayer.stats[key]
              : 0
          const boundedStat = clampNonNegative(currentStat)
          nextPlayer.stats[key] = boundedStat + statDelta
        } else if (
          typeof statDelta === 'string' ||
          typeof statDelta === 'boolean'
        ) {
          nextPlayer.stats[key] = statDelta
        }
      }
    }

    if (delta.player.van) {
      const nextVan = { ...nextPlayer.van }
      if (isFiniteNumber(delta.player.van.fuel)) {
        nextVan.fuel = clampVanFuel(
          finiteNumberOr(nextVan.fuel, 0) + delta.player.van.fuel
        )
      }
      if (isFiniteNumber(delta.player.van.condition)) {
        const nextCondition = clampVanCondition(
          finiteNumberOr(nextVan.condition, 0) + delta.player.van.condition
        )
        nextVan.condition = nextCondition
      }
      nextPlayer.van = nextVan
    }
    if (delta.player.location) nextPlayer.location = delta.player.location
    if (delta.player.currentNodeId)
      nextPlayer.currentNodeId = delta.player.currentNodeId
    if (isFiniteNumber(delta.player.day))
      nextPlayer.day = nextPlayer.day + delta.player.day

    nextState.player = nextPlayer
  }

  if (delta.band) {
    const nextBand = { ...nextState.band }
    if (isFiniteNumber(delta.band.harmony)) {
      const nextHarmony = clampBandHarmony(
        finiteNumberOr(nextBand.harmony, 1) + delta.band.harmony
      )
      nextBand.harmony = nextHarmony
    }

    const membersDelta = delta.band.membersDelta ?? delta.band.members

    const isNotSelfRelationship = (rc: RelationshipChange) =>
      rc.member1 !== rc.member2

    const rawRC = delta.band.relationshipChange as unknown
    const relationshipChange: RelationshipChange[] = []

    if (Array.isArray(rawRC)) {
      let newBanterEvents: Array<{
        member1: string
        member2: string
        delta: number
        timestamp: number
      }> | null = null
      let now = 0
      for (let i = 0; i < rawRC.length; i++) {
        const rc = rawRC[i]
        if (isRelationshipChange(rc) && isNotSelfRelationship(rc)) {
          relationshipChange.push(rc)
          const rcr = rc
          if (rcr.source === 'banter') {
            if (newBanterEvents === null) newBanterEvents = []
            if (now === 0) now = Date.now()
            newBanterEvents.push({
              member1: rcr.member1,
              member2: rcr.member2,
              delta: rcr.change,
              timestamp: rcr.timestamp ?? now
            })
          }
        }
      }
      if (newBanterEvents !== null) {
        nextBand.banterEvents = [
          ...(nextBand.banterEvents || []),
          ...newBanterEvents
        ].slice(-50)
      }
    } else if (isRelationshipChange(rawRC) && isNotSelfRelationship(rawRC)) {
      relationshipChange.push(rawRC)
      const rcr = rawRC
      if (rcr.source === 'banter') {
        nextBand.banterEvents = [
          ...(nextBand.banterEvents || []),
          {
            member1: rcr.member1,
            member2: rcr.member2,
            delta: rcr.change,
            timestamp: rcr.timestamp ?? Date.now()
          }
        ].slice(-50)
      }
    }
    const skillDelta = delta.band.skill

    if (
      membersDelta ||
      relationshipChange.length > 0 ||
      typeof skillDelta === 'number'
    ) {
      const isArrayDelta = Array.isArray(membersDelta)
      const memberCount = nextBand.members.length
      let updatedMembers: BandMember[] | null = null
      let bandChanged = false

      for (let i = 0; i < memberCount; i++) {
        const member = nextBand.members[i]
        if (!member) continue
        let nextMember = member
        let memberHasChanges = false

        // 1. Mood & Stamina
        if (
          membersDelta &&
          (Array.isArray(membersDelta) || isLooseRecord(membersDelta))
        ) {
          const rawMemberDelta = isArrayDelta ? membersDelta[i] : membersDelta
          const mDelta = asMemberDelta(rawMemberDelta) ?? Object.create(null)
          const moodChange = finiteNumberOr(mDelta.moodChange, 0)
          const staminaChange = finiteNumberOr(mDelta.staminaChange, 0)

          if (moodChange !== 0 || staminaChange !== 0) {
            const newMood = clampMemberMood(
              finiteNumberOr(member.mood, 0) + moodChange
            )
            const newStamina = clampMemberStamina(
              finiteNumberOr(member.stamina, 0) + staminaChange,
              finiteNumberOr(member.staminaMax, 100)
            )

            if (newMood !== member.mood || newStamina !== member.stamina) {
              nextMember = { ...nextMember, mood: newMood, stamina: newStamina }
              memberHasChanges = true
            }
          }
        }

        // 2. Relationships
        if (relationshipChange.length > 0) {
          let newRelationships: Record<string, number> | null = null
          const hasGrudgeHolder = hasTrait(member, 'grudge_holder')
          const hasPeacemaker = hasTrait(member, 'peacemaker')
          const memberName =
            typeof member.name === 'string'
              ? member.name
              : typeof member.id === 'string'
                ? member.id
                : ''

          for (let j = 0; j < relationshipChange.length; j++) {
            const change = relationshipChange[j]
            if (!change || !memberName) continue
            const relSource: Record<string, number> =
              newRelationships || nextMember.relationships || {}

            const result = calculateMemberRelationshipChange(
              change,
              memberName,
              hasGrudgeHolder,
              hasPeacemaker,
              relSource
            )

            if (!result) continue
            const { other, newScore } = result

            if (
              newScore === RELATIONSHIP_DEFAULT_SCORE &&
              !Object.hasOwn(relSource, other)
            )
              continue

            if (!newRelationships) {
              newRelationships = { ...relSource }
            }
            ;(newRelationships as Record<string, number>)[other] = newScore
          }

          if (newRelationships) {
            let relationshipsActuallyChanged = false
            const newRelKeys = Object.keys(newRelationships)
            for (let k = 0; k < newRelKeys.length; k++) {
              const key = newRelKeys[k]
              if (!key) continue
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
              ...(nextMember.baseStats ?? {}),
              skill: newSkill
            }
            memberHasChanges = true
          }
        }

        if (memberHasChanges) {
          if (!bandChanged) {
            bandChanged = true
            updatedMembers = [...nextBand.members]
          }
          // updatedMembers is initialized above when bandChanged flips to true
          if (updatedMembers) {
            updatedMembers[i] = nextMember
          }
        } else if (bandChanged) {
          // If bandChanged already true, ensure updatedMembers exists then assign
          if (!updatedMembers) updatedMembers = [...nextBand.members]
          updatedMembers[i] = member
        }
      }

      if (bandChanged && updatedMembers) {
        nextBand.members = updatedMembers
      }
    }

    if (delta.band.inventory) {
      nextBand.inventory = { ...nextBand.inventory }
      const bandInventoryKeys = Object.keys(delta.band.inventory)
      for (let i = 0; i < bandInventoryKeys.length; i++) {
        const item = bandInventoryKeys[i]
        if (!item) continue
        if (isForbiddenKey(item)) continue
        const val = delta.band.inventory[item]
        if (typeof val !== 'number' && typeof val !== 'boolean') continue
        const currentInventoryValue = nextBand.inventory[item]
        const currentValue =
          typeof currentInventoryValue === 'number' ||
          typeof currentInventoryValue === 'boolean'
            ? currentInventoryValue
            : undefined
        nextBand.inventory[item] = applyInventoryItemDelta(currentValue, val)
      }
    }

    if (delta.band.stashRemove && Array.isArray(delta.band.stashRemove)) {
      nextBand.stash = Object.assign(Object.create(null), nextBand.stash || {})
      for (let i = 0; i < delta.band.stashRemove.length; i++) {
        const itemId = delta.band.stashRemove[i]
        if (!itemId) continue
        if (typeof itemId === 'string' && !isForbiddenKey(itemId)) {
          delete nextBand.stash[itemId]
        }
      }
    }

    if (typeof delta.band.luck === 'number') {
      const boundedLuck = Math.max(0, finiteNumberOr(nextBand.luck, 0))
      nextBand.luck = boundedLuck + delta.band.luck
    }
    nextState.band = nextBand
  }

  if (delta.social) {
    const nextSocial = { ...nextState.social }
    const socialKeys = Object.keys(delta.social)
    for (let i = 0; i < socialKeys.length; i++) {
      const key = socialKeys[i]
      if (!key) continue
      if (isForbiddenKey(key)) continue
      const value = delta.social[key]

      if (key === 'controversyLevel') {
        if (typeof value === 'number') {
          const newValue = clampControversyLevel(
            finiteNumberOr(nextSocial[key], 0) + value
          )
          nextSocial[key] = newValue
        }
      } else if (key === 'influencers') {
        if (isLooseRecord(value)) {
          const safeInfluencersUpdate: Record<
            string,
            Record<string, unknown>
          > = Object.create(null)
          for (const influencerId in value) {
            if (!Object.hasOwn(value, influencerId)) continue
            if (isForbiddenKey(influencerId)) continue
            const influencerValue = value[influencerId]
            if (isLooseRecord(influencerValue)) {
              safeInfluencersUpdate[influencerId] =
                copyFilteredProperties(influencerValue)
            }
          }
          nextSocial.influencers = {
            ...nextSocial.influencers,
            ...safeInfluencersUpdate
          }
        }
      } else if (key === 'egoFocus') {
        if (value === null || typeof value === 'string') {
          nextSocial[key] = value
        }
      } else if (key === 'trend') {
        if (typeof value === 'string') {
          nextSocial[key] = value
        }
      } else if (key === 'lastGigDay' || key === 'lastGigDifficulty') {
        if (
          value === null ||
          (typeof value === 'number' && Number.isFinite(value))
        ) {
          nextSocial[key] = value
        }
      } else if (typeof value === 'number') {
        const currentValue = finiteNumberOr(nextSocial[key], 0)
        nextSocial[key] = Math.max(0, currentValue + value)
      }
    }
    nextState.social = nextSocial
  }

  if (delta.flags) {
    if (typeof delta.flags.addStoryFlag === 'string') {
      if (!nextState.activeStoryFlags.includes(delta.flags.addStoryFlag)) {
        nextState.activeStoryFlags = [
          ...nextState.activeStoryFlags,
          delta.flags.addStoryFlag
        ]
      }
    }
    if (typeof delta.flags.queueEvent === 'string') {
      nextState.pendingEvents = [
        ...nextState.pendingEvents,
        delta.flags.queueEvent
      ]
    }
    if (typeof delta.flags.addCooldown === 'string') {
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
