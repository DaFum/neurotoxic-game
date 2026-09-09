/**
 * The permanent Expedition run HUD.
 */

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { getExpeditionRunResources } from '../../domain/expedition/runResources'

/**
 * One resource readout.
 */
const ResourceCell = memo(function ResourceCell({
  label,
  value,
  meta,
  testId
}: {
  label: string
  value: string
  meta?: string
  testId: string
}) {
  return (
    <div
      className='flex flex-col items-start border border-steel-gray bg-charcoal-gray px-3 py-2 min-w-0'
      data-testid={testId}
    >
      <span className='text-[0.625rem] uppercase tracking-widest text-ash-gray font-mono'>
        {label}
      </span>
      <span className='text-base font-bold font-mono text-star-white truncate w-full'>
        {value}
      </span>
      {meta ? (
        <span className='text-[0.625rem] uppercase text-toxic-green font-mono truncate w-full'>
          {meta}
        </span>
      ) : null}
    </div>
  )
})

/**
 * Renders exactly the six permanently visible run resources.
 *
 * @remarks
 * The design fixes this set at Cash, Fuel, Stamina, Harmony, Equipment
 * Condition and Heat. Contextual statuses (crew stress, injuries, obligations,
 * hidden defects) deliberately do **not** belong here — they surface only when
 * actionable, which is what keeps the run HUD readable.
 */
export const ExpeditionStatusStrip = memo(function ExpeditionStatusStrip() {
  const { t, i18n } = useTranslation('ui')
  const resources = useGameSelector(getExpeditionRunResources)
  const status = useGameSelector(state => state.expedition.status)
  const routeStep = useGameSelector(state => state.expedition.routeStep)

  if (status !== 'active') return null

  return (
    <section
      className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2'
      aria-label={t('ui:expedition.hud.label')}
      data-testid='expedition-status-strip'
    >
      <ResourceCell
        testId='expedition-hud-cash'
        label={t('ui:expedition.hud.cash')}
        value={formatCurrency(resources.cash, i18n.language)}
        meta={
          resources.protectedCash > 0
            ? t('ui:expedition.hud.protected', {
                amount: formatCurrency(resources.protectedCash, i18n.language)
              })
            : undefined
        }
      />
      <ResourceCell
        testId='expedition-hud-fuel'
        label={t('ui:expedition.hud.fuel')}
        value={`${resources.fuel}`}
      />
      <ResourceCell
        testId='expedition-hud-stamina'
        label={t('ui:expedition.hud.stamina')}
        value={`${resources.stamina}`}
      />
      <ResourceCell
        testId='expedition-hud-harmony'
        label={t('ui:expedition.hud.harmony')}
        value={`${resources.harmony}`}
      />
      <ResourceCell
        testId='expedition-hud-condition'
        label={t('ui:expedition.hud.condition')}
        value={`${resources.condition}`}
        meta={t(`ui:expedition.condition.${resources.conditionBand}`)}
      />
      <ResourceCell
        testId='expedition-hud-heat'
        label={t('ui:expedition.hud.heat')}
        value={`${resources.heat}`}
        meta={t('ui:expedition.hud.routeStep', { step: routeStep })}
      />
    </section>
  )
})
