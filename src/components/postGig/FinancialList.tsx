import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatSignedFinancialAmount } from '../../utils/numberUtils'
import { getFinancialColors } from '../../utils/financialColors'
import type { FinancialListProps } from '../../types/components'

/**
 * Renders the Financial List component from items and type.
 * @param props - Financial entries and income/expense type.
 * @returns The rendered Financial List UI.
 */
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
            className='flex items-start justify-between gap-3'
          >
            <span className='min-w-0 text-star-white/70 break-words'>
              {t(item.labelKey)}
            </span>
            <span
              className={`${getFinancialColors(type).text} shrink-0 text-right font-bold tabular-nums`}
            >
              {formatSignedFinancialAmount(item.value, type, i18n.language)}
            </span>
          </motion.li>
        )
      })}
    </ul>
  )
}
