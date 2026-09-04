/**
 * The failure-crisis decision surface.
 */

import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { CrisisModal } from '../shared/BrutalistUI'
import { EXPEDITION_TOW_COST } from '../../domain/expedition/failure'
import { calculateRefuelCost } from '../../utils/economy'
import type { ExpeditionFailureChoiceId } from '../../types/expedition'

/**
 * Scene-owned response for the extraction escape.
 *
 * @remarks
 * `refuel` and `tow` are pure state transitions and are dispatched here, so a
 * mounted crisis can never render a button that does nothing. Extraction needs
 * the confirmation dialog and the run-summary navigation the host scene owns,
 * so that one stays a callback.
 */
export interface FailureCrisisDialogProps {
  onExtract?: () => void
}

const CHOICE_VARIANTS: Record<
  ExpeditionFailureChoiceId,
  'safe' | 'risk' | 'danger'
> = {
  refuel: 'safe',
  tow: 'safe',
  extract: 'risk',
  accept_failure: 'danger'
}

/**
 * Presents the run's current crisis and its legal responses.
 *
 * @param props - Scene-owned handlers for the recovery responses.
 *
 * @remarks
 * The crisis is read from the reducer-derived `pendingFailure`, never assembled
 * here, so the dialog cannot offer a response the reducer would refuse. It
 * renders nothing when no crisis is live — which is also why a run can never be
 * ended from this surface without a visible, attributable cause.
 */
export const FailureCrisisDialog = memo(function FailureCrisisDialog({
  onExtract
}: FailureCrisisDialogProps) {
  const { t, i18n } = useTranslation('ui')
  const { acceptExpeditionFailure, resolveExpeditionCrisis } = useGameActions()
  const pendingFailure = useGameSelector(
    state => state.expedition.pendingFailure
  )
  const currentFuel = useGameSelector(state => state.player.van?.fuel ?? 0)

  const handleAccept = useCallback(() => {
    acceptExpeditionFailure()
  }, [acceptExpeditionFailure])

  const handleRefuel = useCallback(
    () => resolveExpeditionCrisis('refuel'),
    [resolveExpeditionCrisis]
  )
  const handleTow = useCallback(
    () => resolveExpeditionCrisis('tow'),
    [resolveExpeditionCrisis]
  )

  if (!pendingFailure) return null

  const handlerFor = (
    choice: ExpeditionFailureChoiceId
  ): (() => void) | undefined => {
    if (choice === 'accept_failure') return handleAccept
    if (choice === 'refuel') return handleRefuel
    if (choice === 'tow') return handleTow
    return onExtract
  }

  const metaFor = (choice: ExpeditionFailureChoiceId): string => {
    if (choice === 'refuel') {
      return formatCurrency(calculateRefuelCost(currentFuel), i18n.language)
    }
    if (choice === 'tow') {
      return formatCurrency(EXPEDITION_TOW_COST, i18n.language)
    }
    return t(`ui:expedition.crisis.meta.${choice}`)
  }

  return (
    <div data-testid='expedition-failure-crisis-dialog'>
      <CrisisModal
        isOpen
        title={t(`ui:expedition.crisis.title.${pendingFailure.reason}`)}
        description={t(`ui:expedition.crisis.cause.${pendingFailure.reason}`, {
          source: t(`ui:expedition.crisis.source.${pendingFailure.sourceId}`, {
            defaultValue: pendingFailure.sourceId
          })
        })}
        actions={pendingFailure.choices.map(choice => ({
          id: choice,
          label: t(`ui:expedition.crisis.choice.${choice}`),
          meta: metaFor(choice),
          variant: CHOICE_VARIANTS[choice],
          onClick: handlerFor(choice)
        }))}
      />
    </div>
  )
})
