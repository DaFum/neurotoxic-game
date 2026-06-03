import { logger } from '../../utils/logger'
import { assertNever } from '../../utils/assertNever'
import {
  clamp0to100,
  clampBandHarmony,
  clampBandStress,
  clampMemberMood,
  clampMemberStamina,
  applyInventoryItemDelta,
  isForbiddenKey,
  hasForbiddenKeys,
  finiteNumberOr,
  isFiniteNumber
} from '../../utils/gameStateUtils'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { ActionTypes } from '../actionTypes'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import { QuestEvents } from '../../utils/questProgress'
import {
  createItemUsedQuestEvent,
  createItemCraftedQuestEvent
} from '../../quests/producers/itemQuestEvents'
import { getCraftingRecipe } from '../../data/craftingRecipes'
import type {
  BandMember,
  BandState,
  GameAction,
  GameState,
  UpdateBandPayload
} from '../../types'

const DEFAULT_MEMBER_MOOD = 50
const DEFAULT_MEMBER_STAMINA = 100
const DEFAULT_MEMBER_STAMINA_MAX = 100

/**
 * Handles band update actions
 * Clamps band.harmony to valid range 1-100
 * @param {Object} state - Current state
 * @param {Object} payload - Band updates
 * @returns {Object} Updated state
 */
export const handleUpdateBand = (
  state: GameState,
  payload: UpdateBandPayload
): GameState => {
  if (!payload) return state
  logger.debug('GameState', 'Update Band', payload)
  const updates = typeof payload === 'function' ? payload(state.band) : payload

  if (
    !updates ||
    typeof updates !== 'object' ||
    Array.isArray(updates) ||
    hasForbiddenKeys(updates as Record<string, unknown>)
  ) {
    return state
  }

  const safeUpdates: Record<string, unknown> = { ...updates }
  if (Object.hasOwn(safeUpdates, 'harmony')) {
    safeUpdates.harmony = clampBandHarmony(
      isFiniteNumber(safeUpdates.harmony)
        ? safeUpdates.harmony
        : state.band.harmony
    )
  }
  const sanitizeNumericKey = (
    key: 'stress' | 'luck' | 'tempo',
    clamp: (value: number) => number
  ) => {
    if (!Object.hasOwn(safeUpdates, key)) return
    const raw = safeUpdates[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      safeUpdates[key] = clamp(raw)
    } else {
      delete safeUpdates[key]
    }
  }
  sanitizeNumericKey('stress', clampBandStress)
  sanitizeNumericKey('luck', clamp0to100)
  sanitizeNumericKey('tempo', clamp0to100)

  if (Array.isArray(safeUpdates.members)) {
    // Members come in as partial patches; merge by id against the prior
    // band state so callers can safely send `{ id, stamina }` without
    // having to repeat every required field. Entries without an `id` (or
    // an unknown id) are dropped rather than spread into state with
    // missing identity fields.
    const existingById = new Map<string, BandMember>()
    for (const existing of state.band.members) {
      if (existing && typeof existing.id === 'string') {
        existingById.set(existing.id, existing)
      }
    }
    // Sanitized members keyed by id so patches replace, not duplicate. We
    // preserve original ordering for known members and append any new
    // members at the end.
    const sanitizedById = new Map<string, BandMember>()
    for (const raw of safeUpdates.members as unknown[]) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
      const patch = raw as Partial<BandMember>
      const id = typeof patch.id === 'string' ? patch.id : undefined
      const existing = id ? existingById.get(id) : undefined
      let next: BandMember | null = null
      if (existing) {
        next = { ...existing, ...patch, id: existing.id }
      } else if (id && typeof patch.name === 'string') {
        next = { ...(patch as BandMember), id }
      }
      if (!next) continue
      if (Object.hasOwn(patch, 'stamina') && !isFiniteNumber(next.stamina)) {
        next.stamina =
          existing && isFiniteNumber(existing.stamina)
            ? existing.stamina
            : DEFAULT_MEMBER_STAMINA
      }
      if (
        Object.hasOwn(patch, 'staminaMax') &&
        !isFiniteNumber(next.staminaMax)
      ) {
        next.staminaMax =
          existing && isFiniteNumber(existing.staminaMax)
            ? existing.staminaMax
            : DEFAULT_MEMBER_STAMINA_MAX
      }
      if (isFiniteNumber(next.stamina)) {
        const maxStamina = isFiniteNumber(next.staminaMax)
          ? next.staminaMax
          : undefined
        next.stamina = clampMemberStamina(next.stamina, maxStamina)
      }
      if (Object.hasOwn(patch, 'mood') && !isFiniteNumber(next.mood)) {
        next.mood =
          existing && isFiniteNumber(existing.mood)
            ? existing.mood
            : DEFAULT_MEMBER_MOOD
      }
      if (isFiniteNumber(next.mood)) {
        next.mood = clampMemberMood(next.mood)
      }
      if (typeof next.id === 'string') {
        sanitizedById.set(next.id, next)
      }
    }
    // Preserve untouched members in place; replace only those whose id was
    // patched; append truly new members at the end.
    const preservedMembers: BandMember[] = state.band.members.map(
      (member: BandMember) => {
        const id = typeof member?.id === 'string' ? member.id : undefined
        return (id && sanitizedById.get(id)) || member
      }
    )
    const appendedMembers: BandMember[] = []
    for (const [id, member] of sanitizedById) {
      if (!existingById.has(id)) appendedMembers.push(member)
    }
    safeUpdates.members = [...preservedMembers, ...appendedMembers]
  }

  const mergedBand = {
    ...state.band,
    ...safeUpdates
  }

  return { ...state, band: mergedBand }
}

/**
 * Handles explicit trait unlocking via action.
 * @param {Object} state - Current state
 * @param {Object} payload - { memberId, traitId }
 * @returns {Object} Updated state
 */
export const handleUnlockTrait = (
  state: GameState,
  payload: { memberId: string; traitId: string }
): GameState => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return state
  }

  const { memberId, traitId } = payload
  if (
    !memberId ||
    !traitId ||
    isForbiddenKey(memberId) ||
    isForbiddenKey(traitId)
  )
    return state

  const traitResult = applyTraitUnlocks(state, [{ memberId, traitId }])

  return {
    ...state,
    band: traitResult.band,
    toasts: traitResult.toasts
  }
}

/**
 * Handles item consumption
 * @param {Object} state - Current state
 * @param {string} payload - Item type to consume
 * @returns {Object} Updated state
 */
export const handleConsumeItem = (
  state: GameState,
  payload: string
): GameState => {
  const itemType = payload
  if (
    !itemType ||
    typeof itemType !== 'string' ||
    isForbiddenKey(itemType) ||
    itemType.length === 0
  ) {
    return state
  }

  const nextBand = { ...state.band }
  // Deep clone inventory
  nextBand.inventory = { ...state.band.inventory }

  if (nextBand.inventory[itemType] === true) {
    nextBand.inventory[itemType] = false
  } else if (typeof nextBand.inventory[itemType] === 'number') {
    nextBand.inventory[itemType] = applyInventoryItemDelta(
      nextBand.inventory[itemType] as number,
      -1
    )
  }

  return QuestEvents.emit(
    { ...state, band: nextBand },
    createItemUsedQuestEvent({ itemId: itemType })
  )
}

/**
 * Effect types that simply add `value` to a numeric band property
 * (defaulting to 0 when missing). Keys must match BandState fields.
 */
const ADDITIVE_BAND_EFFECT_FIELDS = {
  luck: 'luck',
  crit: 'crit',
  crowd_control: 'crowdControl',
  affinity: 'affinity',
  style: 'style',
  tour_success: 'tourSuccess',
  gig_modifier: 'gigModifier',
  tempo: 'tempo',
  practice_gain: 'practiceGain'
} as const

/**
 * Effect types historically supported by the equipment apply-on-add path.
 * The contraband path supports a superset; equipment must remain restricted
 * to this list to preserve prior behavior.
 */
const EQUIPMENT_APPLY_ON_ADD_EFFECTS: ReadonlySet<string> = new Set([
  'luck',
  'stamina_max',
  'guitar_difficulty',
  'crit',
  'crowd_control',
  'affinity',
  'style',
  'tour_success'
])

/**
 * Applies a single equipment/contraband numeric effect to the band, mutating
 * the supplied `newBand` reference. Returns true when a recognized effect was
 * applied; false otherwise (caller may then fall through to specialized paths).
 * When `allowedEffectTypes` is provided, unrecognized-by-set effect types are
 * skipped (used to preserve the equipment apply-on-add allowlist).
 */
const applySharedBandEffect = (
  newBand: BandState,
  effectType: unknown,
  value: number,
  allowedEffectTypes?: ReadonlySet<string>
): boolean => {
  if (typeof effectType !== 'string') return false
  if (allowedEffectTypes && !allowedEffectTypes.has(effectType)) return false
  if (Object.hasOwn(ADDITIVE_BAND_EFFECT_FIELDS, effectType)) {
    const field =
      ADDITIVE_BAND_EFFECT_FIELDS[
        effectType as keyof typeof ADDITIVE_BAND_EFFECT_FIELDS
      ]
    const band = newBand as unknown as Record<string, number | undefined>
    band[field] = (band[field] || 0) + value
    return true
  }
  if (effectType === 'stamina_max') {
    const updatedMembers = [...(newBand.members ?? [])]
    for (let i = 0; i < updatedMembers.length; i++) {
      const currentMember = updatedMembers[i]
      if (currentMember) {
        updatedMembers[i] = {
          ...currentMember,
          staminaMax:
            (typeof currentMember.staminaMax === 'number'
              ? currentMember.staminaMax
              : 100) + value
        } as BandMember
      }
    }
    newBand.members = updatedMembers
    return true
  }
  if (effectType === 'guitar_difficulty') {
    newBand.performance = {
      ...newBand.performance,
      guitarDifficulty: Math.max(
        0.1,
        (newBand.performance?.guitarDifficulty ?? 1) + value
      )
    }
    return true
  }
  return false
}

/**
 * Architecture (Redux Orchestration / State Transitions):
 * Pure helper function to handle adding contraband.
 * This is exposed as a direct state-update helper rather than an action
 * to allow other reducers (like minigameReducer and tradeReducer) to perform atomic
 * state updates across domain boundaries without requiring complex multi-action orchestration
 * in the hook layer, avoiding potential stale-state race conditions.
 */
export const addContrabandHelper = (
  state: GameState,
  payload: { contrabandId: string; instanceId?: string }
): GameState => {
  const { contrabandId, instanceId } = payload
  if (isForbiddenKey(contrabandId)) return state
  const item = CONTRABAND_BY_ID.get(contrabandId)
  if (!item) return state

  const newBand = { ...state.band }
  const currentStash = newBand.stash || {}

  // Handle stackable logic and uniqueness
  const existingItem = Object.hasOwn(currentStash, item.id)
    ? (currentStash[item.id] as Record<string, unknown>)
    : undefined
  if (existingItem) {
    if (!item.stackable) {
      return state // Don't add duplicate non-stackable items
    } else {
      const currentStacks = (existingItem.stacks as number | undefined) ?? 1
      const max = (item.maxStacks as number) || Infinity
      if (currentStacks < max) {
        newBand.stash = Object.assign(Object.create(null), currentStash, {
          [item.id]: {
            ...existingItem,
            stacks: currentStacks + 1
          }
        })
        return { ...state, band: newBand }
      } else {
        return state // Reached max stacks
      }
    }
  }

  const newInstance = {
    ...item,
    instanceId,
    remainingDuration: (item.duration as number | undefined) ?? null,
    applied: !!item.applyOnAdd,
    stacks: item.stackable ? 1 : null
  }

  newBand.stash = Object.assign(Object.create(null), currentStash, {
    [item.id]: newInstance
  })

  if (item.applyOnAdd && item.type === 'equipment') {
    applySharedBandEffect(
      newBand,
      item.effectType,
      item.value as number,
      EQUIPMENT_APPLY_ON_ADD_EFFECTS
    )
  }

  return {
    ...state,
    band: newBand
  }
}

/** Stack count of a stash entry (non-stackable owned items count as 1). */
const getStashCount = (
  stash: Record<string, unknown> | undefined,
  itemId: string
): number => {
  if (!stash || !Object.hasOwn(stash, itemId)) return 0
  const entry = stash[itemId] as Record<string, unknown> | undefined
  if (!entry) return 0
  const stacks = entry.stacks
  return typeof stacks === 'number' && Number.isFinite(stacks)
    ? Math.max(0, stacks)
    : 1
}

export const handleCraftItem = (
  state: GameState,
  { recipeId, toastId }: { recipeId: string; toastId: string }
): GameState => {
  const recipe = getCraftingRecipe(recipeId)
  if (!recipe) return state

  const stash = state.band.stash || {}

  // Verify every input is available in the required quantity.
  for (const [itemId, qty] of Object.entries(recipe.inputs)) {
    if (getStashCount(stash, itemId) < qty) {
      return {
        ...state,
        toasts: [
          ...(state.toasts || []),
          {
            id: toastId,
            messageKey: 'ui:toast.craftMissingInputs',
            options: { recipeLabel: recipe.labelKey },
            type: 'error'
          }
        ]
      }
    }
  }

  // Consume inputs.
  const newStash = Object.assign(Object.create(null), stash)
  for (const [itemId, qty] of Object.entries(recipe.inputs)) {
    const entry = newStash[itemId] as Record<string, unknown>
    const current = getStashCount(newStash, itemId)
    if (current - qty > 0 && typeof entry.stacks === 'number') {
      newStash[itemId] = { ...entry, stacks: current - qty }
    } else {
      delete newStash[itemId]
    }
  }

  const consumedState: GameState = {
    ...state,
    band: { ...state.band, stash: newStash }
  }

  // Add the output. Abort (without consuming) if it cannot be added, e.g. a
  // non-stackable artifact the band already owns.
  const craftedState = addContrabandHelper(consumedState, {
    contrabandId: recipe.output
  })
  if (craftedState === consumedState) {
    return {
      ...state,
      toasts: [
        ...(state.toasts || []),
        {
          id: toastId,
          messageKey: 'ui:toast.craftFailed',
          options: { recipeLabel: recipe.labelKey },
          type: 'error'
        }
      ]
    }
  }

  const withToast: GameState = {
    ...craftedState,
    toasts: [
      ...(craftedState.toasts || []),
      {
        id: toastId,
        messageKey: 'ui:toast.crafted',
        options: { itemLabel: `items:contraband.${recipe.output}.name` },
        type: 'success'
      }
    ]
  }

  return QuestEvents.emit(
    withToast,
    createItemCraftedQuestEvent({ itemId: recipe.output, recipeId: recipe.id })
  )
}

/**
 * Pure helper function to apply the effect of a contraband item.
 * @param {Object} band - Current band state
 * @param {Object} item - Contraband item to apply
 * @param {string} memberId - Target member ID for targeted effects
 * @returns {Object|null} Updated band object, or null if application fails (e.g. invalid target)
 */
const applyContrabandEffect = (
  band: BandState,
  item: Record<string, unknown>,
  memberId: string | undefined
): BandState | null => {
  const newBand = { ...band }

  if (item.effectType === 'stress') {
    newBand.stress = clampBandStress(
      Math.floor(
        ((newBand.stress as number | undefined) ?? 0) + (item.value as number)
      )
    )
  } else if (item.effectType === 'stamina' || item.effectType === 'mood') {
    if (!memberId) {
      return null
    }

    let targetIndex = -1
    const membersList = newBand.members ?? []
    for (let i = 0; i < membersList.length; i++) {
      const currentMember = membersList[i]
      if (currentMember && currentMember.id === memberId) {
        targetIndex = i
        break
      }
    }

    if (targetIndex === -1) {
      return null
    }

    const m = membersList[targetIndex]
    if (!m) return null

    const key = item.effectType as 'stamina' | 'mood'
    const updatedMembers = [...membersList]

    const itemValue = finiteNumberOr(item.value, 0)
    updatedMembers[targetIndex] = {
      ...m,
      [key]:
        key === 'stamina'
          ? clampMemberStamina(
              finiteNumberOr(m[key], 0) + itemValue,
              finiteNumberOr(m.staminaMax, 100)
            )
          : clampMemberMood(finiteNumberOr(m[key], 0) + itemValue)
    } as BandMember

    newBand.members = updatedMembers

    // removed return newBand so duration logic handles it at the end
  } else if (item.effectType === 'harmony') {
    newBand.harmony = clampBandHarmony(
      (newBand.harmony ?? 1) + (item.value as number)
    )
  } else {
    applySharedBandEffect(newBand, item.effectType, item.value as number)
  }

  if (item.duration != null) {
    const effectExists =
      item.instanceId != null &&
      (
        (newBand.activeContrabandEffects as Array<Record<string, unknown>>) ??
        []
      ).some(e => e.instanceId != null && e.instanceId === item.instanceId)
    if (!effectExists) {
      newBand.activeContrabandEffects = [
        ...(newBand.activeContrabandEffects ?? []),
        {
          instanceId: item.instanceId,
          effectType: item.effectType,
          value: item.value,
          remainingDuration: item.duration,
          ...(memberId ? { memberId } : {})
        }
      ]
    }
  }

  return newBand
}

/**
 * Handles using a contraband item.
 * @param {Object} state - Current state
 * @param {Object} payload - { instanceId, contrabandId, memberId }
 * @returns {Object} Updated state
 */
export const handleUseContraband = (
  state: GameState,
  payload: { instanceId: string; contrabandId: string; memberId?: string }
): GameState => {
  const { instanceId, contrabandId, memberId } = payload
  const stash = state.band.stash || {}

  if (typeof contrabandId !== 'string' || contrabandId.length === 0)
    return state

  if (!Object.hasOwn(stash, contrabandId) || isForbiddenKey(contrabandId)) {
    return state
  }

  const item = stash[contrabandId] as Record<string, unknown>
  if (!item) return state
  if (item.instanceId !== undefined && item.instanceId !== instanceId)
    return state

  if (item.applied === true) return state
  const itemKey = contrabandId

  const newBand = applyContrabandEffect(state.band, item, memberId)
  if (!newBand) return state

  const newStash = Object.assign(Object.create(null), stash)

  if (item.type === 'consumable') {
    if ((item.stacks as number) > 1) {
      newStash[itemKey] = { ...item, stacks: (item.stacks as number) - 1 }
    } else {
      delete newStash[itemKey]
    }
  } else {
    newStash[itemKey] = { ...newStash[itemKey], applied: true }
  }

  newBand.stash = newStash
  return { ...state, band: newBand }
}

/**
 * Reducer for band actions.
 * Extracts the subset of actions specific to the band context.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const handleToggleNeuroDecimator = (
  state: GameState,
  payload: { isActive: boolean }
): GameState => {
  if (!payload || typeof payload !== 'object') {
    return state
  }

  if (!state.band.inventory?.neuroDecimator) {
    return state
  }

  const isActive = Boolean(payload.isActive)
  if (isActive === state.band.neuroDecimatorActive) {
    return state
  }

  const currentHarmony = state.band.harmony ?? 1
  const nextHarmony = isActive
    ? clampBandHarmony(currentHarmony - 5)
    : currentHarmony

  return {
    ...state,
    band: {
      ...state.band,
      neuroDecimatorActive: isActive,
      harmony: nextHarmony
    }
  }
}

/**
 * Main band reducer
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const bandReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  switch (action.type) {
    case ActionTypes.TOGGLE_NEURO_DECIMATOR:
      return handleToggleNeuroDecimator(
        state,
        action.payload as { isActive: boolean }
      )
    case ActionTypes.UPDATE_BAND:
      return handleUpdateBand(state, action.payload as UpdateBandPayload)
    case ActionTypes.UNLOCK_TRAIT:
      return handleUnlockTrait(
        state,
        action.payload as { memberId: string; traitId: string }
      )
    case ActionTypes.CONSUME_ITEM:
      return handleConsumeItem(state, action.payload as string)
    case ActionTypes.USE_CONTRABAND:
      return handleUseContraband(
        state,
        action.payload as {
          instanceId: string
          contrabandId: string
          memberId?: string
        }
      )
    case ActionTypes.CRAFT_ITEM:
      return handleCraftItem(
        state,
        action.payload as { recipeId: string; toastId: string }
      )
    default:
      return assertNever(action as never)
  }
}
