import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatSignedFinancialAmount } from '../../utils/numberUtils'
import { getFinancialColors } from './financialColors'
import type { FinancialListProps } from '../../types/components'

export const FinancialList = ({ items, type }: FinancialListProps) => {
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
              className={`${getFinancialColors(type).text} font-bold tabular-nums`}
            >
              {formatSignedFinancialAmount(item.value, type, t, i18n?.language)}
            </span>
          </motion.li>
        )
      })}
    </ul>
  )
}
