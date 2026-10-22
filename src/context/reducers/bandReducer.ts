import { sanitizeBandUpdates } from '../updateSanitizers'
import { logger } from '../../utils/logger'
import { hasForbiddenKeysDeep, isLooseRecord } from '../../utils/objectUtils'
import { assertNever } from '../../utils/assertNever'
import {
  clampLuck,
  clampBandHarmony,
  clampPlayerMoney,
  clampBandStress,
  clampMemberMood,
  clampMemberStamina,
  clampRelationship,
  clampVanCondition,
  applyInventoryItemDelta,
  isForbiddenKey,
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
import {
  addContrabandToBand,
  getStashCapacity,
  getStashStackCount,
  getStashUsedSlots,
  isStashFullFor
} from '../../utils/contrabandStashUtils'
import { QuestEvents } from '../../utils/questProgress'
import {
  createItemUsedQuestEvent,
  createItemCraftedQuestEvent
} from '../../quests/producers/itemQuestEvents'
import { getCraftingRecipe } from '../../data/craftingRecipes'
import {
  INVENTORY_USE_EFFECTS,
  type InventoryUseEffect
} from '../../data/inventoryItems'
import { isExpeditionLegacyHqEffectActive } from '../../domain/expedition/legacyHqPolicy'
import { getExpeditionSpendableCash } from '../../domain/expedition/spendableCash'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import { resolveMerchRestock } from '../../utils/merchUtils'
import {
  BAND_MEETING_HARMONY_GAIN,
  resolveBandMeetingCost
} from '../../hooks/preGig/preGigUtils'
import type {
  BandMember,
  BandState,
  GameAction,
  GameState,
  ToastPayload,
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

  if (!isLooseRecord(updates) || hasForbiddenKeysDeep(updates)) {
    return state
  }

  const safeUpdates: Record<string, unknown> = sanitizeBandUpdates(updates)

  if (isLooseRecord(safeUpdates.performance)) {
    safeUpdates.performance = {
      ...state.band.performance,
      ...safeUpdates.performance
    }
  }

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
        (!isFiniteNumber(next.staminaMax) || next.staminaMax <= 0)
      ) {
        next.staminaMax =
          existing &&
          isFiniteNumber(existing.staminaMax) &&
          existing.staminaMax > 0
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
      for (const key of ['traits', 'baseStats', 'equipment'] as const) {
        if (Object.hasOwn(patch, key) && !isLooseRecord(patch[key])) {
          if (existing && existing[key] !== undefined) {
            if (key === 'baseStats') next.baseStats = existing.baseStats
            else if (key === 'equipment') next.equipment = existing.equipment
            else next.traits = existing.traits
          } else if (key === 'traits') next.traits = {}
          else delete next[key]
        }
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
    // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
    // Why: Avoids closure allocation and intermediate arrays in hot paths.
    const preservedMembers: BandMember[] = new Array(state.band.members.length)
    for (let i = 0; i < state.band.members.length; i++) {
      const member = state.band.members[i] as BandMember
      const id = typeof member?.id === 'string' ? member.id : undefined
      preservedMembers[i] = (id && sanitizedById.get(id)) || member
    }
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
 * Applies the one-shot effect of a usable inventory item.
 *
 * @param state - State in which the item has already been consumed.
 * @param effect - Effect of one use, from `INVENTORY_USE_EFFECTS`.
 * @returns State with member, luck and van deltas applied and clamped.
 */
const applyInventoryUseEffect = (
  state: GameState,
  effect: InventoryUseEffect
): GameState => {
  let next = state
  const moodDelta = finiteNumberOr(effect.memberMood, 0)
  const staminaDelta = finiteNumberOr(effect.memberStamina, 0)
  if (moodDelta !== 0 || staminaDelta !== 0) {
    const members = Array.isArray(next.band.members) ? next.band.members : []
    const nextMembers: BandMember[] = []
    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      if (!member) continue
      nextMembers.push({
        ...member,
        mood:
          moodDelta !== 0
            ? clampMemberMood(
                finiteNumberOr(member.mood, DEFAULT_MEMBER_MOOD) + moodDelta
              )
            : member.mood,
        stamina:
          staminaDelta !== 0
            ? clampMemberStamina(
                finiteNumberOr(member.stamina, DEFAULT_MEMBER_STAMINA) +
                  staminaDelta,
                finiteNumberOr(member.staminaMax, DEFAULT_MEMBER_STAMINA_MAX)
              )
            : member.stamina
      })
    }
    next = { ...next, band: { ...next.band, members: nextMembers } }
  }
  const luckDelta = finiteNumberOr(effect.luck, 0)
  if (luckDelta !== 0) {
    next = {
      ...next,
      band: {
        ...next.band,
        luck: clampLuck(finiteNumberOr(next.band.luck, 0) + luckDelta)
      }
    }
  }
  const vanDelta = finiteNumberOr(effect.vanCondition, 0)
  if (vanDelta !== 0 && next.player.van) {
    next = {
      ...next,
      player: {
        ...next.player,
        van: {
          ...next.player.van,
          condition: clampVanCondition(
            finiteNumberOr(next.player.van.condition, 100) + vanDelta
          )
        }
      }
    }
  }
  return next
}

/**
 * Consumes one inventory item or toggles off a boolean inventory flag, then
 * applies the item's effect when it has one (`INVENTORY_USE_EFFECTS`).
 *
 * @param state - Game state before inventory consumption.
 * @param payload - Inventory item key to consume. Missing, non-string, or
 * forbidden keys leave the state unchanged.
 * @returns State with the inventory count decremented or boolean item cleared
 * and its use effect applied. Unowned or zero-count items, and items whose
 * Expedition policy forbids use during an active run, return the original
 * state unchanged — no item-used quest event is emitted unless something was
 * actually consumed.
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

  const useEffect = Object.hasOwn(INVENTORY_USE_EFFECTS, itemType)
    ? INVENTORY_USE_EFFECTS[itemType]
    : undefined
  if (
    useEffect?.expeditionPolicyItemId &&
    !isExpeditionLegacyHqEffectActive(
      state.expedition?.status === 'active',
      useEffect.expeditionPolicyItemId
    )
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

  const consumedState: GameState = { ...state, band: nextBand }
  return QuestEvents.emit(
    useEffect
      ? applyInventoryUseEffect(consumedState, useEffect)
      : consumedState,
    createItemUsedQuestEvent({ itemId: itemType })
  )
}

/**
 * Builds the error toast shown when a contraband item finds no free stash slot.
 *
 * @param band - Band whose stash is full.
 * @param contrabandId - Catalogue id that could not be added.
 * @param id - Toast id (deterministic or pre-generated).
 * @returns Toast naming the item and the used/total slot count, or `null`
 * when the stash still has room for that item.
 */
export const buildStashFullToast = (
  band: BandState,
  contrabandId: string,
  id: string
): ToastPayload | null =>
  isStashFullFor(band, contrabandId)
    ? {
        id,
        messageKey: 'ui:stash.full',
        options: {
          item: `items:contraband.${contrabandId}.name`,
          used: getStashUsedSlots(band),
          total: getStashCapacity(band)
        },
        type: 'error'
      }
    : null

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
  const nextBand = addContrabandToBand(state.band, payload)
  return nextBand === state.band ? state : { ...state, band: nextBand }
}

/**
 * Crafts a contraband recipe by consuming stash inputs and adding the recipe output.
 *
 * @param state - Current game state before crafting.
 * @param payload - Craft request. Non-record payloads leave state unchanged.
 * - `payload.recipeId` - Recipe id to craft.
 * - `payload.instanceId` - Instance id assigned to the crafted contraband output.
 * - `payload.toastId` - Toast id used for success or failure feedback.
 * @returns Updated state with consumed inputs, crafted output, quest progress, and feedback, or the original state when crafting cannot proceed.
 */
export const handleCraftItem = (
  state: GameState,
  payload: { recipeId: string; instanceId: string; toastId: string }
): GameState => {
  if (!isLooseRecord(payload)) return state
  const { recipeId, instanceId, toastId } = payload
  const recipe = getCraftingRecipe(recipeId)
  if (!recipe) return state
  // Defense in depth: never write malformed ids into state.
  if (typeof toastId !== 'string' || toastId.length === 0) return state
  if (typeof instanceId !== 'string' || instanceId.length === 0) return state

  const stash = state.band.stash || {}

  // Verify every input is available in the required quantity.
  for (const itemId in recipe.inputs) {
    if (!Object.hasOwn(recipe.inputs, itemId)) continue
    const qty = recipe.inputs[itemId] as number
    if (
      typeof qty !== 'number' ||
      Number.isNaN(qty) ||
      getStashStackCount(stash, itemId) < qty
    ) {
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
  const consumedBand = { ...state.band }

  for (const itemId in recipe.inputs) {
    if (!Object.hasOwn(recipe.inputs, itemId)) continue
    const qty = recipe.inputs[itemId] as number
    const entry = newStash[itemId] as Record<string, unknown>
    const current = getStashStackCount(newStash, itemId)

    // Revert apply-on-add equipment effects if the item is being fully deleted
    if (current - qty <= 0) {
      const itemDef = CONTRABAND_BY_ID.get(itemId)
      if (itemDef?.applyOnAdd && itemDef.type === 'equipment') {
        applySharedBandEffect(
          consumedBand,
          itemDef.effectType,
          -(itemDef.value as number),
          EQUIPMENT_APPLY_ON_ADD_EFFECTS
        )
      }
      delete newStash[itemId]
    } else {
      if (typeof entry.stacks === 'number') {
        newStash[itemId] = { ...entry, stacks: current - qty }
      }
    }
  }

  consumedBand.stash = newStash

  const consumedState: GameState = {
    ...state,
    band: consumedBand
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
        buildStashFullToast(consumedBand, recipe.output, toastId) ?? {
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
  if (!isLooseRecord(payload)) return state
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
const handleToggleNeuroDecimator = (
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

  const currentHarmony = finiteNumberOr(state.band.harmony, 1)
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
 * Pays for a band meeting and restores harmony in one step.
 *
 * @param state - Game state before the meeting.
 * @returns State with the meeting cost debited and harmony raised, or the
 * original state when harmony is already maxed or the spendable balance cannot
 * cover the cost.
 *
 * @remarks
 * The cost is derived from the active assets and affordability from the
 * spendable view, so an active run's protected Career Cash can never pay for
 * it. Debit and reward are one state update: either both apply or neither.
 */
const handleHoldBandMeeting = (state: GameState): GameState => {
  const prevHarmony = finiteNumberOr(state.band.harmony, 1)
  if (prevHarmony >= 100) return state
  const cost = resolveBandMeetingCost(
    getActiveAssetModifiers(state.assets ?? []).trainingCostMultiplier
  )
  if (getExpeditionSpendableCash(state) < cost) return state
  return {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(finiteNumberOr(state.player.money, 0) - cost)
    },
    band: {
      ...state.band,
      harmony: clampBandHarmony(prevHarmony + BAND_MEETING_HARMONY_GAIN)
    }
  }
}

/**
 * Pays for one merch restock and adds the stock in one step.
 *
 * @param state - Game state before the restock.
 * @param payload - Merch inventory key to restock.
 * @returns State with the restock cost debited and the stock added, or the
 * original state for an unknown or hostile key, full merch capacity, or a
 * spendable balance that cannot cover the cost.
 *
 * @remarks
 * Amount and cost are derived from the inventory and active assets, and
 * affordability from the spendable view, so an active run's protected Career
 * Cash can never pay for it. Debit and stock are one state update: either both
 * apply or neither.
 */
const handleRestockMerch = (
  state: GameState,
  payload: { merchKey: string }
): GameState => {
  const merchKey = payload?.merchKey
  // A run shows its own cargo, not the Career stock, so Career stock bought
  // there would be unreachable; the pre-gig handler blocks it too.
  if (state.expedition?.status === 'active') return state
  if (typeof merchKey !== 'string' || isForbiddenKey(merchKey)) return state
  const inventory = state.band.inventory ?? {}
  const restock = resolveMerchRestock(
    merchKey,
    inventory,
    getActiveAssetModifiers(state.assets ?? [])
  )
  if (!restock || restock.restockAmount <= 0) return state
  if (getExpeditionSpendableCash(state) < restock.cost) return state
  return {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) - restock.cost
      )
    },
    band: {
      ...state.band,
      inventory: {
        ...inventory,
        [merchKey]:
          finiteNumberOr(inventory[merchKey], 0) + restock.restockAmount
      }
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
    case ActionTypes.HOLD_BAND_MEETING:
      return handleHoldBandMeeting(state)
    case ActionTypes.RESTOCK_MERCH:
      return handleRestockMerch(state, action.payload as { merchKey: string })
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
