import React from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ActionButton } from '../../ui/shared'

const FinancialList = ({ items, type }) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const formatNumber = (value) => {
    return new Intl.NumberFormat(i18n?.language || 'en', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <ul className='space-y-2.5 text-sm font-mono'>
      {items.map((item, i) => {
        return (
          <motion.li
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={`${item.labelKey}-${i}`}
            initial={{ opacity: 0, x: type === 'income' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className='flex justify-between items-center'
          >
            <span className='text-star-white/70'>{t(item.labelKey)}</span>
            <span
              className={`${type === 'income' ? 'text-toxic-green' : 'text-blood-red'} font-bold tabular-nums`}
            >
              {type === 'income'
                ? t('report.amount_positive', { amount: formatNumber(item.value) })
                : t('report.amount_negative', { amount: formatNumber(item.value) })}
            </span>
          </motion.li>
        )
      })}
    </ul>
  )
}

FinancialList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      labelKey: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
      detail: PropTypes.string,
      detailKey: PropTypes.string,
      detailParams: PropTypes.object
    })
  ).isRequired,
  type: PropTypes.oneOf(['income', 'expense']).isRequired
}

const FinancialColumn = React.memo(({ titleKey, type, items, total, delay, initialX }) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const formatNumber = (value) => {
    return new Intl.NumberFormat(i18n?.language || 'en', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value)
  }
  const isIncome = type === 'income'
  const colorClass = isIncome ? 'text-toxic-green' : 'text-blood-red'
  const borderClass = isIncome ? 'border-toxic-green' : 'border-blood-red'
  const borderLightClass = isIncome
    ? 'border-toxic-green/40'
    : 'border-blood-red/40'

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <h3
        className={`text-lg border-b-2 ${borderClass} mb-4 pb-2 tracking-widest font-mono ${colorClass}`}
      >
        {t(titleKey)}
      </h3>
      <FinancialList items={items} type={type} />
      <div
        className={`mt-4 pt-2 border-t ${borderLightClass} flex justify-between font-bold ${colorClass}`}
      >
        <span className='text-sm tracking-wider'>
          {t('economy:postGig.total')}
        </span>
        <span className='tabular-nums'>
          {t('report.amount_with_currency', { amount: formatNumber(total) })}
        </span>
      </div>
    </motion.div>
  )
})

const NetResult = React.memo(({ net }) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const formatNumber = (value) => {
    return new Intl.NumberFormat(i18n?.language || 'en', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(Math.abs(value))
  }

  const getNetString = () => {
    if (net > 0) return t('report.amount_positive', { amount: formatNumber(net) })
    if (net < 0) return t('report.amount_negative', { amount: formatNumber(net) })
    return t('report.amount_with_currency', { amount: formatNumber(0) })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring' }}
      className='text-center py-6 border-y-2 border-ash-gray/30'
    >
      <div className='text-[10px] text-ash-gray tracking-widest mb-2'>
        {t('economy:postGig.netProfit')}
      </div>
      <div
        className={`text-5xl font-bold font-display tabular-nums ${
          net >= 0
            ? 'text-toxic-green drop-shadow-[0_0_20px_var(--color-toxic-green)]'
            : 'text-blood-red drop-shadow-[0_0_20px_var(--color-blood-red)]'
        }`}
      >
        {getNetString()}
      </div>
    </motion.div>
  )
})

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

FinancialColumn.propTypes = {
  titleKey: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['income', 'expense']).isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      labelKey: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      detail: PropTypes.string,
      detailKey: PropTypes.string,
      detailParams: PropTypes.object
    })
  ).isRequired,
  total: PropTypes.number.isRequired,
  delay: PropTypes.number.isRequired,
  initialX: PropTypes.number.isRequired
}

NetResult.propTypes = {
  net: PropTypes.number.isRequired
}

ReportPhase.propTypes = {
  financials: PropTypes.shape({
    income: FINANCIAL_CATEGORY_SHAPE.isRequired,
    expenses: FINANCIAL_CATEGORY_SHAPE.isRequired,
    net: PropTypes.number.isRequired
  }),
  onNext: PropTypes.func.isRequired
}
