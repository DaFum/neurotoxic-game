import type { ActiveQuestState, GameState, QuestState } from '../types'
import { getQuestDefinition } from '../data/questRegistry'
import { clamp0to100, finiteNumberOr } from '../utils/gameState'

/**
 * Checks whether an asset-targeting quest effect names something to act on.
 *
 * @param value - Raw effect record being validated.
 * @returns True when a non-empty `assetId` or `assetKind` is present.
 *
 * @remarks
 * `updateFirstMatchingAssetCondition` returns state unchanged when neither
 * target is supplied, so a targetless `asset.repair` / `asset.damage` effect
 * would let the quest resolve while its declared effect silently did nothing.
 * `assetId` takes precedence when both are given.
 */
export const hasAssetTarget = (value: Record<string, unknown>): boolean => {
  const { assetId, assetKind } = value
  return (
    (typeof assetId === 'string' && assetId.length > 0) ||
    (typeof assetKind === 'string' && assetKind.length > 0)
  )
}

/**
 * Merges a quest instance with its registry definition when available.
 */
export const getQuestWithDefinition = (
  quest: QuestState | ActiveQuestState
): QuestState => {
  const definition = getQuestDefinition(quest.id) as
    Partial<QuestState> | undefined
  return definition ? { ...definition, ...quest } : quest
}

/**
 * Builds the runtime-only active quest shape for registry-backed quests.
 */
export const createActiveQuestRuntime = (
  quest: QuestState,
  startedOnDay: number,
  isRegistryBacked: boolean
): ActiveQuestState => {
  if (!isRegistryBacked) return quest as ActiveQuestState
  return {
    id: quest.id,
    deadline: quest.deadline,
    progress: quest.progress,
    required: quest.required,
    scopeKey: quest.scopeKey,
    status: 'active',
    startedOnDay
  }
}

/**
 * Resolves the display name key or id used in quest toasts.
 */
export const getQuestToastName = (quest: QuestState): string =>
  quest.label ?? quest.id

/**
 * Adds valid story flags while preserving existing entries and order.
 */
export const addStoryFlags = (
  flags: GameState['activeStoryFlags'],
  additions: unknown[]
): GameState['activeStoryFlags'] => {
  const validAdditions = additions.filter(
    (flag): flag is string => typeof flag === 'string' && flag.length > 0
  )
  if (validAdditions.length === 0) return flags
  const nextFlags = [...(flags ?? [])]
  for (const flag of validAdditions) {
    if (!nextFlags.includes(flag)) nextFlags.push(flag)
  }
  return nextFlags
}

/**
 * Applies a signed condition delta to the first asset matching `assetId`, or —
 * when no id is given — the first asset of `assetKind`.
 *
 * @param state - Current game state.
 * @param match - Asset id (preferred) or asset kind to target.
 * @param delta - Signed condition change; the result is clamped to 0–100.
 * @returns A new state with the matched asset updated, or `state` when nothing matched.
 */
export const updateFirstMatchingAssetCondition = (
  state: GameState,
  match: { assetId?: string; assetKind?: string },
  delta: number
): GameState => {
  const assets = state.assets
  if (!assets?.length) return state

  const byId = typeof match.assetId === 'string'
  const byKind = match.assetId == null && typeof match.assetKind === 'string'
  if (!byId && !byKind) return state

  const index = assets.findIndex(asset =>
    byId ? asset?.id === match.assetId : asset?.kind === match.assetKind
  )
  const asset = index === -1 ? undefined : assets[index]
  if (!asset) return state

  const nextAssets = [...assets]
  nextAssets[index] = {
    ...asset,
    condition: clamp0to100(finiteNumberOr(asset.condition, 0) + delta)
  }
  return { ...state, assets: nextAssets }
}
