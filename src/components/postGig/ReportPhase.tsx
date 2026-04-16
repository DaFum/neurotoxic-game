// @ts-nocheck
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'
import { FinancialColumn } from './FinancialColumn'
import { NetResult } from './NetResult'

export const ReportPhase = ({ financials, onNext }) => {
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
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-8'>
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
          className='px-8 py-3 text-void-black'
        >
          {t('economy:postGig.continueToSocials')}
        </ActionButton>
      </motion.div>
    </div>
  )
}

const FINANCIAL_CATEGORY_SHAPE = PropTypes.shape({
  total: PropTypes.number.isRequired,
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      labelKey: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      detail: PropTypes.string,
      detailKey: PropTypes.string,
      detailParams: PropTypes.object
    })
  ).isRequired
})

ReportPhase.propTypes = {
  financials: PropTypes.shape({
    income: FINANCIAL_CATEGORY_SHAPE.isRequired,
    expenses: FINANCIAL_CATEGORY_SHAPE.isRequired,
    net: PropTypes.number.isRequired
  }),
  onNext: PropTypes.func.isRequired
}
