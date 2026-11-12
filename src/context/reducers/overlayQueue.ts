import type { DeferredOverlayState, GameState } from '../../types'
import type { AssetKind } from '../../types/assets'

type OverlaySlots = Pick<GameState, 'pendingOverlay' | 'deferredOverlays'>

const mergeNotices = (a: AssetKind[], b: AssetKind[]): AssetKind[] =>
  Array.from(new Set([...a, ...b]))

/**
 * Raises a risk event or foreclosure overlay whose effects are already applied.
 *
 * @param state - State (or its overlay slots) to raise the overlay on.
 * @param overlay - Overlay to show.
 * @returns State with the overlay active when the slot was free, merged into
 * an active or queued foreclosure, or queued behind the active overlay.
 *
 * @remarks
 * Only one risk event is pending at a time: a new one is dropped while
 * another is active or queued, as before the overlay slot was consolidated.
 */
export const raiseDeferredOverlay = <T extends OverlaySlots>(
  state: T,
  overlay: DeferredOverlayState
): T => {
  const active = state.pendingOverlay ?? null
  if (!active) return { ...state, pendingOverlay: overlay }
  if (overlay.kind === 'foreclosure' && active.kind === 'foreclosure') {
    return {
      ...state,
      pendingOverlay: {
        kind: 'foreclosure',
        notices: mergeNotices(active.notices, overlay.notices)
      }
    }
  }
  const deferred = state.deferredOverlays ?? []
  if (!deferred.some(entry => entry.kind === overlay.kind)) {
    if (overlay.kind === 'risk_event' && active.kind === 'risk_event') {
      return state
    }
    if (overlay.kind === 'band_hq' && active.kind === 'band_hq') {
      return state
    }
    return { ...state, deferredOverlays: [...deferred, overlay] }
  }
  if (overlay.kind === 'risk_event' || overlay.kind === 'band_hq') return state
  return {
    ...state,
    deferredOverlays: deferred.map(entry =>
      entry.kind === 'foreclosure'
        ? {
            kind: 'foreclosure',
            notices: mergeNotices(entry.notices, overlay.notices)
          }
        : entry
    )
  }
}

/**
 * Moves the oldest deferred overlay into the free overlay slot.
 *
 * @param state - Game state after an action.
 * @returns The identical state when the slot is held or nothing is queued.
 */
export const promoteDeferredOverlay = (state: GameState): GameState => {
  if (state.pendingOverlay) return state
  const [next, ...rest] = state.deferredOverlays ?? []
  if (!next) return state
  return { ...state, pendingOverlay: next, deferredOverlays: rest }
}
