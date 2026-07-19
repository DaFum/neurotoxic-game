import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'
import { FinancialColumn } from './FinancialColumn'
import { NetResult } from './NetResult'
import type { ReportPhaseProps } from '../../types/components'

/**
 * Shows the post-gig financial report and advances once the player has reviewed it.
 * @param props - Post-gig financial report and callback that advances to the next phase.
 */
export const ReportPhase = ({ financials, onNext }: ReportPhaseProps) => {
  const { t } = useTranslation('economy')

  if (!financials) {
    return (
      <div
        className='text-center font-mono animate-pulse'
        role='status'
        aria-live='polite'
        aria-busy='true'
      >
        {t('economy:postGig.loading')}
      </div>
    )
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div
        data-testid='post-gig-financial-grid'
        className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'
      >
        {/* Income Column */}
        <FinancialColumn
          titleKey='economy:postGig.income'
          type='income'
          items={financials.income.breakdown}
          total={financials.income.total}
          delay={0.2}
          initialX={-20}
        />

        {/* Expenses Column */}
        <FinancialColumn
          titleKey='economy:postGig.expenses'
          type='expense'
          items={financials.expenses.breakdown}
          total={financials.expenses.total}
          delay={0.2}
          initialX={20}
        />
      </div>

      {/* Net Result */}
      <NetResult net={financials.net} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className='text-center'
      >
        <ActionButton
          onClick={onNext}
          variant='primary'
          className='w-full sm:w-auto min-h-11 px-6 sm:px-8 py-3 text-void-black'
        >
          {t('economy:postGig.continueToSocials')}
        </ActionButton>
      </motion.div>
    </div>
  )
}
