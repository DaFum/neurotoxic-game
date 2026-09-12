/**
 * Pre-tour build summary and the commit action.
 */

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../shared/ActionButton'
import { formatCurrency } from '../../utils/numberUtils'
import type {
  ExpeditionBuildValidation,
  ExpeditionMap
} from '../../types/expedition'

/**
 * Summary rows and the commit control for the constrained Tour Prep build.
 */
export interface BuildCommitmentPanelProps {
  /** The route the build was assembled against, previewed from the run seed. */
  preparedMap: ExpeditionMap
  /** Verdict from the canonical build validator. */
  validation: ExpeditionBuildValidation
  /** Cost of the committed fuel top-up. */
  fuelCost: number
  /** Cost of the selected insurance policy premium (if any). */
  insurancePremium?: number
  /** Cash left after upfront costs, excluding the protected slice. */
  spendableAfterCommit: number
  /** Commits the build and starts the run. */
  onCommit: () => void
}

/**
 * Renders the committed build's consequences and the START control.
 *
 * @param props - Prepared route, validation verdict, costs, and commit handler.
 *
 * @remarks
 * The panel never decides legality itself: it renders the reducer-authoritative
 * validator's verdict. A rejected build disables the control and names the
 * exact reason, so the constraint is legible rather than a silent failure.
 */
export const BuildCommitmentPanel = memo(function BuildCommitmentPanel({
  preparedMap,
  validation,
  fuelCost,
  insurancePremium = 0,
  spendableAfterCommit,
  onCommit
}: BuildCommitmentPanelProps) {
  const { t, i18n } = useTranslation('ui')

  // ⚡ BOLT OPTIMIZATION: Consolidated map metadata iteration into a single procedural
  // pass over Object.values(preparedMap.meta) to calculate max route depth and collect unique
  // extraction window route steps without allocating intermediate filter/map arrays.
  let routeLength = 0
  const extractionSteps = new Set<number>()
  const metaEntries = Object.values(preparedMap.meta)
  for (let i = 0; i < metaEntries.length; i++) {
    const entry = metaEntries[i]
    if (entry.routeStep > routeLength) {
      routeLength = entry.routeStep
    }
    if (entry.isExtractionWindow) {
      extractionSteps.add(entry.routeStep)
    }
  }
  const extractionWindows = extractionSteps.size

  return (
    <section
      className='border-2 border-toxic-green bg-void-black p-4 flex flex-col gap-3'
      aria-label={t('ui:expedition.prep.commitLabel')}
      data-testid='expedition-build-commitment'
    >
      <h3 className='text-lg font-bold uppercase tracking-widest text-toxic-green'>
        {t('ui:expedition.prep.commitTitle')}
      </h3>

      <dl className='grid grid-cols-2 gap-2 text-xs font-mono'>
        <dt className='text-ash-gray uppercase'>
          {t('ui:expedition.prep.routeNodes')}
        </dt>
        <dd className='text-star-white' data-testid='expedition-prep-nodes'>
          {routeLength}
        </dd>
        <dt className='text-ash-gray uppercase'>
          {t('ui:expedition.prep.extractionWindows')}
        </dt>
        <dd className='text-star-white' data-testid='expedition-prep-windows'>
          {extractionWindows}
        </dd>
        <dt className='text-ash-gray uppercase'>
          {t('ui:expedition.prep.fuelCost')}
        </dt>
        <dd className='text-star-white' data-testid='expedition-prep-fuel-cost'>
          {formatCurrency(fuelCost, i18n.language)}
        </dd>
        {insurancePremium > 0 && (
          <>
            <dt className='text-ash-gray uppercase'>
              {t('ui:expedition.prep.insurancePremium')}
            </dt>
            <dd
              className='text-star-white'
              data-testid='expedition-prep-insurance-cost'
            >
              {formatCurrency(insurancePremium, i18n.language)}
            </dd>
            <dt className='text-ash-gray uppercase'>
              {t('ui:expedition.prep.totalUpfrontCost')}
            </dt>
            <dd
              className='text-star-white font-bold'
              data-testid='expedition-prep-upfront-cost'
            >
              {formatCurrency(fuelCost + insurancePremium, i18n.language)}
            </dd>
          </>
        )}
        <dt className='text-ash-gray uppercase'>
          {t('ui:expedition.prep.spendableAfter')}
        </dt>
        <dd className='text-star-white' data-testid='expedition-prep-spendable'>
          {formatCurrency(spendableAfterCommit, i18n.language)}
        </dd>
      </dl>

      {validation.valid ? (
        <p className='text-xs text-ash-gray'>
          {t('ui:expedition.prep.commitWarning')}
        </p>
      ) : (
        <p
          className='text-xs text-blood-red font-bold uppercase'
          role='alert'
          data-testid='expedition-prep-rejection'
        >
          {t(`ui:expedition.prep.reject.${validation.reason}`)}
        </p>
      )}

      <ActionButton
        onClick={onCommit}
        disabled={!validation.valid}
        data-testid='expedition-prep-commit'
      >
        {t('ui:expedition.prep.commit')}
      </ActionButton>
    </section>
  )
})
