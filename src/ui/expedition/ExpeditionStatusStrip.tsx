/**
 * The permanent Expedition run HUD.
 */

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { formatCurrency, formatNumber } from '../../utils/numberUtils'
import { getExpeditionRunResources } from '../../domain/expedition/runResources'
import { EXPEDITION_AUTHORITY_ENCOUNTER_HEAT } from '../../domain/expedition/authority'

type ResourceTone = 'ok' | 'warn' | 'risk'

/** Below this a drained resource is worth drawing the eye to. */
const LOW_RESOURCE_THRESHOLD = 25

const TONE_CLASSES: Record<ResourceTone, string> = {
  ok: 'border-steel-gray border-l-toxic-green/60',
  warn: 'border-warning-yellow/60 border-l-warning-yellow',
  risk: 'border-blood-red border-l-blood-red-bright'
}

const lowTone = (value: number): ResourceTone =>
  value <= LOW_RESOURCE_THRESHOLD ? 'warn' : 'ok'

/**
 * One resource readout.
 */
const ResourceCell = memo(function ResourceCell({
  label,
  value,
  meta,
  testId,
  tone = 'ok'
}: {
  label: string
  value: string
  meta?: string
  testId: string
  tone?: ResourceTone
}) {
  return (
    <div
      className={`flex flex-col items-start border border-l-4 ${TONE_CLASSES[tone]} bg-charcoal-gray px-2 sm:px-3 py-2 min-w-0`}
      data-testid={testId}
      data-tone={tone}
    >
      <span className='text-xs uppercase tracking-widest text-star-white/70 font-mono'>
        {label}
      </span>
      <span className='text-base font-bold font-mono tabular-nums text-star-white sm:truncate max-sm:break-all w-full'>
        {value}
      </span>
      {meta ? (
        <span className='text-xs uppercase text-toxic-green font-mono truncate w-full'>
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
      className='grid grid-cols-3 lg:grid-cols-6 gap-2'
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
        tone={lowTone(resources.fuel)}
        label={t('ui:expedition.hud.fuel')}
        value={formatNumber(resources.fuel, i18n.language)}
      />
      <ResourceCell
        testId='expedition-hud-stamina'
        tone={lowTone(resources.stamina)}
        label={t('ui:expedition.hud.stamina')}
        value={formatNumber(resources.stamina, i18n.language)}
      />
      <ResourceCell
        testId='expedition-hud-harmony'
        tone={lowTone(resources.harmony)}
        label={t('ui:expedition.hud.harmony')}
        value={formatNumber(resources.harmony, i18n.language)}
      />
      <ResourceCell
        testId='expedition-hud-condition'
        tone={lowTone(resources.condition)}
        label={t('ui:expedition.hud.condition')}
        value={formatNumber(resources.condition, i18n.language)}
        meta={t(`ui:expedition.condition.${resources.conditionBand}`)}
      />
      <ResourceCell
        testId='expedition-hud-heat'
        tone={
          resources.heat >= EXPEDITION_AUTHORITY_ENCOUNTER_HEAT ? 'risk' : 'ok'
        }
        label={t('ui:expedition.hud.heat')}
        value={formatNumber(resources.heat, i18n.language)}
        meta={t('ui:expedition.hud.routeStep', { step: routeStep })}
      />
    </section>
  )
})
