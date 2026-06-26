import type {
  TravelRefsBundle,
  TravelStateBundle,
  TravelLogicParams
} from './types'
import { useSoftlockEffect } from './effects/useSoftlockEffect'
import { useTimerCleanupEffect } from './effects/useTimerCleanupEffect'

/**
 * Runs the travel hook's side effects: stranded-player detection and timer
 * cleanup.
 *
 * @remarks
 * While not traveling, watches for a softlock (no connected node is affordable
 * in fuel AND cash — including daily obligations — and no in-place escape such
 * as an unplayed gig, a blood-bank donation, or an affordable refuel exists).
 * On detection it shows a game-over toast and schedules a
 * 3s timeout that saves and switches to the game-over scene; the timeout is
 * cleared if the softlock resolves or travel begins. A second effect clears all
 * outstanding travel timers on unmount.
 *
 * The softlock effect depends on the individual state slices it reads (not the
 * whole `params` object) so it does not re-run — and reset the game-over
 * countdown — on every unrelated render.
 */
export const useTravelEffects = ({
  refs,
  state,
  params
}: {
  refs: TravelRefsBundle
  state: TravelStateBundle
  params: TravelLogicParams
}) => {
  useSoftlockEffect({ refs, state, params })
  useTimerCleanupEffect(refs)
}
