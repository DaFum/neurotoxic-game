/**
 * The run's reachable equipment-recovery surface.
 *
 * @remarks
 * Technical Condition blocks a mandatory gig once a group hits zero, so every
 * recovery and termination control the run offers has to be reachable from the
 * screens the player is actually on — otherwise a zero-Condition group is a
 * softlock rather than a decision. Legality is never decided here: each button
 * asks the same resolver the reducer uses, and the reducer re-validates the
 * dispatch regardless.
 */

import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { formatCurrency } from '../../utils/numberUtils'
import { ActionButton } from '../shared/ActionButton'
import {
  EXPEDITION_CONDITION_GROUPS,
  getExpeditionTechnicalCondition
} from '../../domain/expedition/condition'
import { getVisibleExpeditionDefects } from '../../domain/expedition/defects'
import { resolveExpeditionRepair } from '../../domain/expedition/repairs'
import { resolveExpeditionInspection } from '../../domain/expedition/inspections'
import { canClaimExpeditionInsurance } from '../../domain/expedition/insurance'
import type { GameState } from '../../types'
import type {
  ConditionGroup,
  ExpeditionInspectionMode,
  ExpeditionRepairMode
} from '../../types/expedition'

const REPAIR_MODES: readonly ExpeditionRepairMode[] = [
  'field',
  'professional',
  'improvise',
  'cannibalize'
]

const INSPECTION_MODES: readonly ExpeditionInspectionMode[] = [
  'quick_check',
  'crew_inspection',
  'module_inspection',
  'full_service'
]

/**
 * A repair option with the cost and legality the resolver reports.
 */
interface RepairOption {
  mode: ExpeditionRepairMode
  targetGroup: ConditionGroup
  sourceGroup?: ConditionGroup
  legal: boolean
  moneyCost: number
}

/**
 * Everything the panel renders, derived in one selector pass.
 */
interface ServiceView {
  isActive: boolean
  routeStep: number
  condition: { pa: number; instruments: number; stageGear: number }
  disabledGroups: ConditionGroup[]
  visibleDefects: ReturnType<typeof getVisibleExpeditionDefects>
  repairOptions: RepairOption[]
  inspectionOptions: Array<{
    mode: ExpeditionInspectionMode
    legal: boolean
    diagnosticFee: number
  }>
  canClaimTechnicalInsurance: boolean
}

/**
 * Asks the canonical resolvers what the run currently permits.
 *
 * @param state - Current game state.
 * @returns The panel's view model.
 */
const selectServiceView = (state: GameState): ServiceView => {
  const isActive = state.expedition?.status === 'active'
  const routeStep = state.expedition?.routeStep ?? 0
  const condition = getExpeditionTechnicalCondition(state)
  const disabledGroups = EXPEDITION_CONDITION_GROUPS.filter(
    group => condition[group] === 0
  )

  const repairOptions: RepairOption[] = []
  if (isActive) {
    for (const targetGroup of EXPEDITION_CONDITION_GROUPS) {
      // A healthy group needs no repair offer; the panel exists for the ones
      // that are worn or dead.
      if (condition[targetGroup] >= 100) continue
      for (const mode of REPAIR_MODES) {
        // Cannibalize takes from another group, so it needs a donor named up
        // front — the resolver rejects it otherwise.
        const donors: Array<ConditionGroup | undefined> =
          mode === 'cannibalize'
            ? EXPEDITION_CONDITION_GROUPS.filter(g => g !== targetGroup)
            : [undefined]
        for (const sourceGroup of donors) {
          const resolution = resolveExpeditionRepair(state, {
            mode,
            targetGroup,
            ...(sourceGroup ? { sourceGroup } : {}),
            expectedRouteStep: routeStep
          })
          repairOptions.push({
            mode,
            targetGroup,
            ...(sourceGroup ? { sourceGroup } : {}),
            legal: resolution.ok,
            moneyCost: resolution.ok ? resolution.result.moneyCost : 0
          })
        }
      }
    }
  }

  const inspectionOptions = isActive
    ? INSPECTION_MODES.map(mode => {
        const resolution = resolveExpeditionInspection(state, {
          mode,
          expectedRouteStep: routeStep
        })
        return {
          mode,
          legal: resolution.ok,
          diagnosticFee: resolution.ok ? resolution.result.diagnosticFee : 0
        }
      })
    : []

  return {
    isActive,
    routeStep,
    condition,
    disabledGroups,
    visibleDefects: getVisibleExpeditionDefects(state),
    repairOptions,
    inspectionOptions,
    canClaimTechnicalInsurance:
      isActive && canClaimExpeditionInsurance(state, 'technical')
  }
}

/**
 * Renders the run's condition readout and every legal recovery control.
 */
export const ExpeditionServicePanel = memo(function ExpeditionServicePanel() {
  const { t, i18n } = useTranslation('ui')
  const view = useGameSelector(selectServiceView)
  const {
    executeExpeditionRepair,
    executeExpeditionInspection,
    claimExpeditionInsurance,
    acceptExpeditionTechnicalFailure
  } = useGameActions()

  const claimTechnical = useCallback(() => {
    claimExpeditionInsurance({ claimType: 'technical' })
  }, [claimExpeditionInsurance])

  if (!view.isActive) return null
  const hasSomethingToDo =
    view.repairOptions.length > 0 || view.visibleDefects.length > 0
  if (!hasSomethingToDo) return null

  const legalRepairs = view.repairOptions.filter(option => option.legal)

  return (
    <section
      className='w-full border border-steel-gray bg-charcoal-gray p-3 flex flex-col gap-3'
      data-testid='expedition-service-panel'
      aria-label={t('ui:expedition.service.title')}
    >
      <h3 className='text-xs uppercase tracking-widest text-toxic-green font-mono'>
        {t('ui:expedition.service.title')}
      </h3>

      <ul className='flex flex-wrap gap-2 text-xs font-mono'>
        {EXPEDITION_CONDITION_GROUPS.map(group => (
          <li
            key={group}
            className='border border-steel-gray px-2 py-1 text-star-white'
            data-testid={`expedition-service-condition-${group}`}
          >
            <span className='text-ash-gray uppercase'>
              {t(`ui:expedition.condition.group.${group}`)}
            </span>{' '}
            {view.condition[group]}
            {view.condition[group] === 0 ? (
              <span className='text-blood-red'>
                {' '}
                {t('ui:expedition.service.disabled')}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {view.visibleDefects.length > 0 ? (
        <ul
          className='flex flex-col gap-1 text-xs font-mono text-warning-yellow'
          data-testid='expedition-service-defects'
        >
          {view.visibleDefects.map(defect => (
            <li key={defect.id}>
              {t('ui:expedition.service.defect', {
                group: t(`ui:expedition.condition.group.${defect.group}`),
                severity: defect.severity
              })}
            </li>
          ))}
        </ul>
      ) : null}

      {legalRepairs.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {legalRepairs.map(option => (
            <ActionButton
              key={`${option.mode}:${option.targetGroup}:${option.sourceGroup ?? ''}`}
              variant='secondary'
              className='px-3 py-2 text-xs'
              data-testid={`expedition-repair-${option.mode}-${option.targetGroup}${
                option.sourceGroup ? `-from-${option.sourceGroup}` : ''
              }`}
              onClick={() =>
                executeExpeditionRepair({
                  mode: option.mode,
                  targetGroup: option.targetGroup,
                  ...(option.sourceGroup
                    ? { sourceGroup: option.sourceGroup }
                    : {}),
                  expectedRouteStep: view.routeStep
                })
              }
            >
              {t(`ui:expedition.repair.mode.${option.mode}`)}{' '}
              {t(`ui:expedition.condition.group.${option.targetGroup}`)}{' '}
              {option.moneyCost > 0
                ? formatCurrency(option.moneyCost, i18n.language)
                : null}
            </ActionButton>
          ))}
        </div>
      ) : (
        <p
          className='text-xs font-mono text-ash-gray'
          data-testid='expedition-service-no-repair'
        >
          {t('ui:expedition.service.noRepair')}
        </p>
      )}

      <div className='flex flex-wrap gap-2'>
        {view.inspectionOptions
          .filter(option => option.legal)
          .map(option => (
            <ActionButton
              key={option.mode}
              variant='secondary'
              className='px-3 py-2 text-xs'
              data-testid={`expedition-inspection-${option.mode}`}
              onClick={() =>
                executeExpeditionInspection({
                  mode: option.mode,
                  expectedRouteStep: view.routeStep
                })
              }
            >
              {t(`ui:expedition.inspection.mode.${option.mode}`)}{' '}
              {option.diagnosticFee > 0
                ? formatCurrency(option.diagnosticFee, i18n.language)
                : null}
            </ActionButton>
          ))}

        {view.canClaimTechnicalInsurance ? (
          <ActionButton
            variant='secondary'
            className='px-3 py-2 text-xs'
            data-testid='expedition-service-insurance-claim'
            onClick={claimTechnical}
          >
            {t('ui:expedition.crisis.choice.insurance_claim')}
          </ActionButton>
        ) : null}
      </div>

      {view.disabledGroups.length > 0 ? (
        <ActionButton
          variant='danger'
          className='px-3 py-2 text-xs'
          data-testid='expedition-service-accept-technical-failure'
          onClick={acceptExpeditionTechnicalFailure}
        >
          {t('ui:expedition.service.acceptTechnicalFailure')}
        </ActionButton>
      ) : null}
    </section>
  )
})
