import React from 'react'
import { useAnime } from '../../ui/shared/AnimatedTypography'
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

/**
 * Displays one animated income or expense column with row details and a signed total.
 * @param props - Financial section title, entry list, total, animation offset, and income/expense type.
 */
export const FinancialColumn = React.memo(
  ({ titleKey, type, items, total, delay, initialX }: FinancialColumnProps) => {
    const { t, i18n } = useTranslation(['economy', 'ui'])

    const {
      text: colorClass,
      border: borderClass,
      borderLight: borderLightClass
    } = getFinancialColors(type)

    const ref = useAnime<HTMLDivElement>({
      opacity: [0, 1],
      x: [initialX, 0],
      delay: delay * 1000
    })

    return (
      <div ref={ref}>
        <h3
          className={`text-base sm:text-lg border-b-2 ${borderClass} mb-3 sm:mb-4 pb-2 tracking-widest font-mono break-words ${colorClass}`}
        >
          {t(titleKey)}
        </h3>
        <FinancialList items={items} type={type} />
        <div
          className={`mt-4 pt-2 border-t-2 ${borderLightClass} flex items-start justify-between gap-3 font-bold ${colorClass}`}
        >
          <span className='min-w-0 text-sm tracking-wider break-words'>
            {t('economy:postGig.total')}
          </span>
          <span className='shrink-0 text-right tabular-nums'>
            {formatSignedFinancialAmount(total, type, i18n.language)}
          </span>
        </div>
      </div>
    )
  }
)

FinancialColumn.displayName = 'FinancialColumn'
