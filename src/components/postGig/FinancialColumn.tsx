import React from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FinancialList } from './FinancialList'
import { formatNumber } from '../../utils/numberUtils'

export const FinancialColumn = React.memo(
  ({ titleKey, type, items, total, delay, initialX }) => {
    const { t, i18n } = useTranslation(['economy', 'ui'])

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
            {type === 'income'
              ? t('economy:report.amount_positive', {
                  amount: formatNumber(total, i18n?.language)
                })
              : t('economy:report.amount_negative', {
                  amount: formatNumber(Math.abs(total), i18n?.language)
                })}
          </span>
        </div>
      </motion.div>
    )
  }
)

FinancialColumn.displayName = 'FinancialColumn'

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
