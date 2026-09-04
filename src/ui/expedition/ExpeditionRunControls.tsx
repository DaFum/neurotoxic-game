/**
 * Run-level Expedition controls mounted on the Overworld.
 */

import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { ActionButton } from '../shared/ActionButton'
import { NEUTRAL_EXPEDITION_ROUTE_PROFILE } from '../../domain/expedition/defaults'
import { buildExpeditionMap } from '../../domain/expedition/map'
import { ExtractionDialog } from './ExtractionDialog'

/**
 * Reports whether the run is standing on a legal extraction window.
 *
 * @remarks
 * Derived from the route rebuilt from the canonical run seed, exactly as the
 * reducer does, so the button can never offer an extraction the reducer would
 * refuse.
 */
const useIsAtExtractionWindow = (): boolean =>
  useGameSelector(state => {
    const loadout = state.expedition?.loadout
    if (state.expedition?.status !== 'active' || !loadout) return false
    const map = buildExpeditionMap(
      state.runSeed,
      loadout.tourTypeId,
      loadout.regionId,
      NEUTRAL_EXPEDITION_ROUTE_PROFILE
    )
    const nodeId =
      state.expedition.visitedNodeIds[
        state.expedition.visitedNodeIds.length - 1
      ]
    if (typeof nodeId !== 'string' || !Object.hasOwn(map.meta, nodeId)) {
      return false
    }
    return map.meta[nodeId]?.isExtractionWindow === true
  })

/**
 * Offers voluntary extraction and routes a finalized run to its summary.
 *
 * @remarks
 * Terminal navigation lives here rather than in the reducer: the reducer
 * settles the run, and this component persists that committed state and then
 * moves to the run summary — which is also where the settlement is read before
 * `PREPARE_NEXT_EXPEDITION` clears the ledger it describes.
 */
export const ExpeditionRunControls = memo(function ExpeditionRunControls() {
  const { t } = useTranslation('ui')
  const { changeScene, saveGameAfterStateCommit } = useGameActions()
  const status = useGameSelector(state => state.expedition?.status ?? 'idle')
  const isAtExtractionWindow = useIsAtExtractionWindow()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isFinalized =
    status === 'extracted' || status === 'completed' || status === 'failed'

  useEffect(() => {
    if (!isFinalized) return
    saveGameAfterStateCommit()
    changeScene(GAME_PHASES.RUN_SUMMARY)
  }, [changeScene, isFinalized, saveGameAfterStateCommit])

  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  if (status !== 'active') return null

  return (
    <div data-testid='expedition-run-controls'>
      {isAtExtractionWindow ? (
        <ActionButton
          onClick={openDialog}
          data-testid='expedition-extract-open'
          className='px-6 py-3'
        >
          {t('ui:expedition.extraction.open')}
        </ActionButton>
      ) : null}

      <ExtractionDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </div>
  )
})
