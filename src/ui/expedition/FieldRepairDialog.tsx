import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { useAmpLogic } from '../../hooks/minigames/useAmpLogic'
import { AmpCalibrationView } from '../../components/minigames/amp/AmpCalibrationView'
import { createAmpStageController } from '../../components/stage/AmpStageController'
import { resolveExpeditionRepair } from '../../domain/expedition/repairs'
import { getExpeditionTechnicalCondition } from '../../domain/expedition/condition'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { Modal } from '../shared/Modal'
import type { ConditionGroup } from '../../types/expedition'

interface FieldRepairDialogProps {
  targetGroup: ConditionGroup
  routeStep: number
  runId: string | null
  onClose: () => void
}

/** Reuses played amp calibration to determine one field repair's quality. */
export const FieldRepairDialog = ({
  targetGroup,
  routeStep,
  runId,
  onClose
}: FieldRepairDialogProps) => {
  const { t } = useTranslation('ui')
  const { executeExpeditionRepair } = useGameActions()
  const [quality, setQuality] = useState<number | null>(null)
  const qualityRef = useRef<number | null>(null)
  const appliedRef = useRef(false)
  const view = useGameSelector(state => {
    const isCurrent =
      state.expedition.status === 'active' &&
      state.expedition.runId === runId &&
      state.expedition.routeStep === routeStep
    const resolution = resolveExpeditionRepair(state, {
      mode: 'field',
      targetGroup,
      quality: quality ?? 0,
      expectedRouteStep: routeStep
    })
    const currentCondition = getExpeditionTechnicalCondition(state)[targetGroup]
    return {
      valid: isCurrent && resolution.ok,
      result: resolution.ok ? resolution.result : null,
      currentCondition
    }
  })
  const viewRef = useRef(view)
  useLayoutEffect(() => {
    viewRef.current = view
  }, [view])

  const onResult = useCallback((score: number) => {
    const boundedQuality = Math.max(
      0,
      Math.min(1, finiteNumberOr(score, 0) / 100)
    )
    qualityRef.current = boundedQuality
    setQuality(boundedQuality)
  }, [])

  const applyRepair = useCallback(() => {
    if (appliedRef.current || qualityRef.current === null) return
    appliedRef.current = true
    if (viewRef.current.valid) {
      executeExpeditionRepair({
        mode: 'field',
        targetGroup,
        quality: qualityRef.current,
        expectedRouteStep: routeStep
      })
    }
    onClose()
  }, [executeExpeditionRepair, targetGroup, routeStep, onClose])

  const { update, gameStateRef, finishMinigame, ...ampProps } = useAmpLogic({
    onResult,
    onContinue: applyRepair
  })
  const logic = useMemo(
    () => ({ update, gameStateRef, finishMinigame }),
    [update, gameStateRef, finishMinigame]
  )

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('ui:expedition.repair.title', {
        group: t(`ui:expedition.condition.group.${targetGroup}`)
      })}
      className='max-w-4xl'
    >
      <p className='text-sm text-ash-gray mb-3'>
        {t('ui:expedition.repair.instructions')}
      </p>
      <div className='relative w-full h-[min(60svh,36rem)] min-h-80 shrink-0'>
        <AmpCalibrationView
          {...ampProps}
          t={t}
          embedded
          controllerFactory={createAmpStageController}
          logic={logic}
          onComplete={applyRepair}
          completionTitle={t('ui:expedition.repair.complete')}
          completionButtonText={t('ui:expedition.repair.apply')}
          completionDetails={
            view.valid && view.result ? (
              <>
                <p>
                  {t('ui:expedition.repair.restore', {
                    amount: Math.min(
                      100 - view.currentCondition,
                      view.result.targetRestore
                    )
                  })}
                </p>
                <p>
                  {t(
                    view.result.createsHiddenDefect
                      ? 'ui:expedition.repair.defectRisk'
                      : 'ui:expedition.repair.noDefect'
                  )}
                </p>
              </>
            ) : (
              <p>{t('ui:expedition.repair.unavailable')}</p>
            )
          }
        />
      </div>
    </Modal>
  )
}
