import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../utils/numberUtils'

export const FinancialList = ({ items, type }) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

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
                ? t('economy:report.amount_positive', {
                    amount: formatNumber(item.value, i18n?.language)
                  })
                : t('economy:report.amount_negative', {
                    amount: formatNumber(Math.abs(item.value), i18n?.language)
                  })}
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
      value: PropTypes.number.isRequired,
      detail: PropTypes.string,
      detailKey: PropTypes.string,
      detailParams: PropTypes.object
    })
  ).isRequired,
  type: PropTypes.oneOf(['income', 'expense']).isRequired
}
