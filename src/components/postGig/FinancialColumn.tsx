import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FinancialList } from './FinancialList'
import { getFinancialColors } from '../../utils/financialColors'
import { formatSignedFinancialAmount } from '../../utils/numberUtils'
import type { FinancialItem } from '../../types/components'

type FinancialColumnProps = {
  titleKey: string
  type: 'income' | 'expense'
  items: FinancialItem[]
  total: number
  delay: number
  initialX: number
}

export const FinancialColumn = React.memo(
  ({ titleKey, type, items, total, delay, initialX }: FinancialColumnProps) => {
    const { t, i18n } = useTranslation(['economy', 'ui'])

    const {
      text: colorClass,
      border: borderClass,
      borderLight: borderLightClass
    } = getFinancialColors(type)

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
            {formatSignedFinancialAmount(total, type, t, i18n?.language)}
          </span>
        </div>
      </motion.div>
    )
  }
)

FinancialColumn.displayName = 'FinancialColumn'
