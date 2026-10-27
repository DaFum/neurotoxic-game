/**
 * Scene-level host for the Expedition's run-ending decisions.
 */

import { memo, useEffect } from 'react'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { ExtractionDialog } from './ExtractionDialog'
import { FailureCrisisDialog } from './FailureCrisisDialog'

/**
 * Open state of the extraction confirmation, owned by the mounting scene.
 */
interface ExpeditionDecisionHostProps {
  isExtractionOpen: boolean
  onOpenExtraction: () => void
  onCloseExtraction: () => void
}

/**
 * Hosts the failure crisis, the extraction confirmation and the move to the
 * run summary once the run is finalized.
 *
 * @param props - Extraction confirmation state owned by the mounting scene.
 *
 * @remarks
 * Every scene that can raise a crisis must mount this: a crisis the player
 * cannot answer on the current screen is a softlock (PreGig can raise one when
 * a due defect zeroes a Condition group). Terminal navigation lives here rather
 * than in the reducer: the reducer settles the run, and this host persists that
 * committed state and then moves to the run summary — which is also where the
 * settlement is read before `PREPARE_NEXT_EXPEDITION` clears the ledger it
 * describes. It stays mounted after the status leaves `active`, because that
 * is exactly when the continuation has to run.
 */
export const ExpeditionDecisionHost = memo(function ExpeditionDecisionHost({
  isExtractionOpen,
  onOpenExtraction,
  onCloseExtraction
}: ExpeditionDecisionHostProps) {
  const { changeScene, saveGameAfterStateCommit } = useGameActions()
  const status = useGameSelector(state => state.expedition?.status ?? 'idle')
  // A Career ending finalizes the run too, but its scene is GAMEOVER: the
  // hosting scene stays mounted through its exit animation and must not
  // redirect that ending to the run summary.
  const isCareerEnded = useGameSelector(
    state =>
      state.terminalOutcome !== null ||
      state.currentScene === GAME_PHASES.GAMEOVER
  )

  const isFinalized =
    status === 'extracted' || status === 'completed' || status === 'failed'

  useEffect(() => {
    if (!isFinalized || isCareerEnded) return
    saveGameAfterStateCommit()
    changeScene(GAME_PHASES.RUN_SUMMARY)
  }, [changeScene, isCareerEnded, isFinalized, saveGameAfterStateCommit])

  if (status !== 'active') return null

  return (
    <>
      {/* The crisis dialog lives here rather than in a scene so its extraction
          escape has an owner: it opens the same confirmation the extraction
          button does, instead of rendering a dead button. */}
      <FailureCrisisDialog onExtract={onOpenExtraction} />
      <ExtractionDialog isOpen={isExtractionOpen} onClose={onCloseExtraction} />
    </>
  )
})
