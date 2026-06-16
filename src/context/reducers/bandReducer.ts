import { logger } from '../../utils/logger'
import { assertNever } from '../../utils/assertNever'
import {
  clamp0to100,
  clampBandHarmony,
  clampBandStress,
  clampMemberMood,
  clampMemberStamina,
  clampRelationship,
  applyInventoryItemDelta,
  isForbiddenKey,
  hasForbiddenKeys,
  finiteNumberOr,
  isFiniteNumber
} from '../../utils/gameState'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { ActionTypes } from '../actionTypes'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import {
  applySharedBandEffect,
  EQUIPMENT_APPLY_ON_ADD_EFFECTS
} from '../../utils/contrabandEffects'
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
 * Sanitizes a patched member relationships map: keeps only finite numeric
 * values (clamped to the relationship range) and drops forbidden keys plus
 * self-references by member id or name. Self-relationships corrupt trait and
 * infighting logic, so the reducer must strip them even when callers send
 * whole member objects through UPDATE_BAND.
 */
const sanitizeMemberRelationships = (
  raw: unknown,
  member: Pick<BandMember, 'id' | 'name'>
): Record<string, number> => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  // Lowercase-only set with lowercased lookups so mixed-case keys ("M1",
  // "MATZE") cannot bypass the self-reference filter.
  const selfKeys = new Set<string>()
  if (typeof member.id === 'string') {
    selfKeys.add(member.id.toLowerCase())
  }
  if (typeof member.name === 'string') {
    selfKeys.add(member.name.toLowerCase())
  }
  const result: Record<string, number> = {}
  const record = raw as Record<string, unknown>
  for (const key in record) {
    if (!Object.hasOwn(record, key)) continue
    if (isForbiddenKey(key) || selfKeys.has(key.toLowerCase())) continue
    const value = record[key]
    if (isFiniteNumber(value)) {
      result[key] = clampRelationship(value)
    }
  }
  return result
}

/**
 * Applies sanitized band updates while preserving reducer-side clamps.
 *
 * @param state - Game state before the band patch.
 * @param payload - Partial band patch or updater function. Forbidden keys and
 * invalid member payloads leave the state unchanged.
 * @returns State with valid band updates merged, including harmony clamped to
 * `1..100`.
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
    if (isFiniteNumber(raw)) {
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
      if (Object.hasOwn(patch, 'relationships')) {
        const rel = patch.relationships
        if (rel && typeof rel === 'object' && !Array.isArray(rel)) {
          next.relationships = sanitizeMemberRelationships(rel, next)
        } else {
          // Invalid payloads keep the prior map instead of erasing it —
          // the spread above already copied the garbage value into next.
          next.relationships = existing?.relationships ?? {}
        }
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
 *
 * @param state - Game state before applying the unlock.
 * @param payload - Member id and trait id to unlock. Invalid or forbidden ids
 * leave the state unchanged.
 * @returns State with trait unlock side effects and toasts applied.
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
 * Consumes one inventory item or toggles off a boolean inventory flag.
 *
 * @param state - Game state before inventory consumption.
 * @param payload - Inventory item key to consume. Missing, non-string, or
 * forbidden keys leave the state unchanged.
 * @returns State with the inventory count decremented or boolean item cleared.
 * Unowned or zero-count items return the original state unchanged — no
 * item-used quest event is emitted unless something was actually consumed.
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

  let consumed = false
  if (nextBand.inventory[itemType] === true) {
    nextBand.inventory[itemType] = false
    consumed = true
  } else if (
    typeof nextBand.inventory[itemType] === 'number' &&
    (nextBand.inventory[itemType] as number) > 0
  ) {
    nextBand.inventory[itemType] = applyInventoryItemDelta(
      nextBand.inventory[itemType] as number,
      -1
    )
    consumed = true
  }

  // Only advance item-used quest progress when something was actually
  // consumed; dispatching for an unowned item must leave state unchanged.
  if (!consumed) return state

  return QuestEvents.emit(
    { ...state, band: nextBand },
    createItemUsedQuestEvent({ itemId: itemType })
  )
}

/**
 * Adds contraband to the band stash while preserving stacking and uniqueness rules.
 *
 * @remarks
 * This direct state-update helper lets reducers perform atomic cross-domain
 * updates without dispatching multiple hook-layer actions.
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
        newBand.stash = {
          ...currentStash,
          [item.id]: {
            ...existingItem,
            stacks: currentStacks + 1
          }
        }
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

  newBand.stash = {
    ...currentStash,
    [item.id]: newInstance
  }

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
  return isFiniteNumber(stacks) ? Math.max(0, stacks) : 1
}

/**
 * Crafts a contraband recipe by consuming stash inputs and adding the recipe output.
 *
 * @param state - Current game state before crafting.
 * @param recipeId - Recipe id to craft.
 * @param instanceId - Instance id assigned to the crafted contraband output.
 * @param toastId - Toast id used for success or failure feedback.
 * @returns Updated state with consumed inputs, crafted output, quest progress, and feedback, or the original state when crafting cannot proceed.
 */
export const handleCraftItem = (
  state: GameState,
  {
    recipeId,
    instanceId,
    toastId
  }: { recipeId: string; instanceId: string; toastId: string }
): GameState => {
  const recipe = getCraftingRecipe(recipeId)
  if (!recipe) return state
  // Defense in depth: never write malformed ids into state.
  if (typeof toastId !== 'string' || toastId.length === 0) return state
  if (typeof instanceId !== 'string' || instanceId.length === 0) return state

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
  const newStash = { ...stash }
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
    contrabandId: recipe.output,
    instanceId
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
 * Applies a contraband effect and tracks active temporary modifiers.
 *
 * @param band - Current band state.
 * @param item - Contraband item definition to apply.
 * @param memberId - Target member id required by member-scoped effects.
 * @returns Updated band object, or null when the effect cannot target a member.
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
        finiteNumberOr(newBand.stress, 0) + finiteNumberOr(item.value, 0)
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
      finiteNumberOr(newBand.harmony, 1) + finiteNumberOr(item.value, 0)
    )
  } else {
    applySharedBandEffect(
      newBand,
      item.effectType,
      item.value as number,
      item.type === 'equipment' ? EQUIPMENT_APPLY_ON_ADD_EFFECTS : undefined
    )
  }

  if (item.duration != null) {
    // One tracked effect per use. The forward effect above is applied once
    // per call, so tracking must mirror it 1:1 — deduping by instanceId would
    // let a second use of a stacked consumable apply the buff again while only
    // registering a single revertible effect, leaking the bonus permanently.
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

  return newBand
}

/**
 * Handles using a contraband item.
 *
 * @param state - Game state before consuming the stash item.
 * @param payload - Contraband instance and item ids, plus an optional member id
 * for member-targeted effects.
 * @returns State with the matching stash item consumed and its effect applied,
 * or the original state when validation fails.
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

  const newStash = { ...stash }

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
 * Toggles the Neuro Decimator if the band owns it.
 *
 * @remarks
 * Enabling the item costs harmony once; disabling it does not refund harmony.
 *
 * @param state - Game state before the toggle request.
 * @param payload - Requested active state.
 * @returns State with the active flag changed, or the original state when the
 * item is missing or already in the requested state.
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
 * Routes band-owned actions to their reducer helpers.
 *
 * @param state - Game state before the band action.
 * @param action - Game action that may affect the band slice.
 * @returns State after the matching band reducer handles the action.
 *
 * @throws Throws an `Error` when an impossible action branch reaches the
 * default case through `assertNever`.
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
        action.payload as {
          recipeId: string
          instanceId: string
          toastId: string
        }
      )
    default:
      return assertNever(action as never)
  }
}
