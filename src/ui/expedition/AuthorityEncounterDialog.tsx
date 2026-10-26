/**
 * The Authority encounter decision surface.
 */

import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { CrisisModal } from '../shared/BrutalistUI'
import {
  EXPEDITION_AUTHORITY_DETOUR_FUEL,
  EXPEDITION_AUTHORITY_EXIT_HEAT_RELIEF,
  EXPEDITION_AUTHORITY_EXIT_IDS,
  EXPEDITION_AUTHORITY_PAY_COST,
  getAuthorityEncounter,
  resolveAuthoritySafeExit
} from '../../domain/expedition/authority'
import type { ExpeditionAuthorityExitId } from '../../types/expedition'

/**
 * The run and route step of the last decline. Module scope so it survives the
 * scene round-trip through Investments, which unmounts the dialog without
 * advancing the route; it is not persisted, so a reload asks again.
 */
let lastDeclinedKey: string | null = null

/**
 * Presents the live Authority encounter and its executable safe exits.
 *
 * @remarks
 * The exits are read from `getAuthorityEncounter`, the same derivation the
 * action creator and reducer resolve, so the dialog never offers an exit the
 * reducer would refuse. A live crisis owns the decision surface, so the
 * encounter stays hidden while one is pending. The selector returns a joined
 * string rather than the derived array to keep the snapshot stable.
 *
 * The player may decline ("Not now"): the encounter is derived from state, so
 * declining only hides it for the current route step, Heat stays where it is,
 * and it asks again at the next step. `suppressed` hides it while another
 * decision dialog (the extraction confirmation) is open, and an arrival event
 * modal (`activeEvent`) likewise owns the decision surface, so they never
 * stack.
 */
export const AuthorityEncounterDialog = memo(function AuthorityEncounterDialog({
  suppressed = false
}: {
  suppressed?: boolean
}) {
  const { t, i18n } = useTranslation('ui')
  const { resolveExpeditionAuthorityExit } = useGameActions()
  const [declinedKey, setDeclinedKey] = useState(lastDeclinedKey)
  const routeStep = useGameSelector(state => state.expedition?.routeStep ?? 0)
  const runId = useGameSelector(state => state.expedition?.runId ?? '')
  const stepKey = `${runId}:${routeStep}`
  const exitKey = useGameSelector(state => {
    if (state.expedition?.pendingFailure || state.activeEvent) return ''
    return getAuthorityEncounter(state)?.exits.join(',') ?? ''
  })
  const heat = useGameSelector(state => state.expedition?.pressure.heat ?? 0)
  // The Contract the obligation would add, named so the player sees what
  // they are signing before they sign it.
  const obligationTemplateId = useGameSelector(state => {
    if (!exitKey.split(',').includes('future_obligation')) return null
    const plan = resolveAuthoritySafeExit(state, 'future_obligation')
    return plan?.exitId === 'future_obligation'
      ? plan.commitment.templateId
      : null
  })

  if (!exitKey || suppressed || declinedKey === stepKey) return null
  const exits = EXPEDITION_AUTHORITY_EXIT_IDS.filter(id =>
    exitKey.split(',').includes(id)
  )

  const metaFor = (exitId: ExpeditionAuthorityExitId): string => {
    if (exitId === 'pay') {
      return formatCurrency(EXPEDITION_AUTHORITY_PAY_COST, i18n.language)
    }
    if (exitId === 'route_detour') {
      return t('ui:expedition.authority.meta.route_detour', {
        fuel: EXPEDITION_AUTHORITY_DETOUR_FUEL
      })
    }
    if (exitId === 'future_obligation') {
      return t('ui:expedition.authority.meta.future_obligation', {
        contract: obligationTemplateId
          ? t(`ui:expedition.contract.${obligationTemplateId}`, {
              defaultValue: t('ui:expedition.contract.unknown', {
                defaultValue: 'Unknown Contract'
              })
            })
          : t('ui:expedition.contract.unknown')
      })
    }
    return t(`ui:expedition.authority.meta.${exitId}`)
  }

  return (
    <div data-testid='expedition-authority-encounter'>
      <CrisisModal
        isOpen
        title={t('ui:expedition.authority.title')}
        description={t('ui:expedition.authority.description', {
          heat,
          relief: EXPEDITION_AUTHORITY_EXIT_HEAT_RELIEF
        })}
        actions={[
          ...exits.map(exitId => ({
            id: exitId,
            label: t(`ui:expedition.authority.exit.${exitId}`),
            meta: metaFor(exitId),
            variant: 'safe' as const,
            onClick: () => resolveExpeditionAuthorityExit(exitId)
          })),
          {
            id: 'decline',
            label: t('ui:expedition.authority.decline'),
            meta: t('ui:expedition.authority.meta.decline'),
            variant: 'risk' as const,
            onClick: () => {
              lastDeclinedKey = stepKey
              setDeclinedKey(stepKey)
            }
          }
        ]}
      />
    </div>
  )
})
