import { useAnime } from '../../ui/shared/AnimatedTypography'
import { useTranslation } from 'react-i18next'
import { formatSignedFinancialAmount } from '../../utils/numberUtils'
import { getFinancialColors } from '../../utils/financialColors'
import type { FinancialListProps } from '../../types/components'
import type { ReactNode } from 'react'

const FinancialListItem = ({
  delay,
  initialX,
  children
}: {
  delay: number
  initialX: number
  children: ReactNode
}) => {
  const ref = useAnime<HTMLLIElement>({
    opacity: [0, 1],
    x: [initialX, 0],
    delay
  })

  return (
    <li ref={ref} className='flex items-start justify-between gap-3'>
      {children}
    </li>
  )
}

/**
 * Renders localized financial rows with signed values for an income or expense category.
 * @param props - Financial entries and income/expense type.
 */
export const FinancialList = ({ items, type }: FinancialListProps) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  return (
    <ul className='space-y-2.5 text-sm font-mono'>
      {items.map((item, i) => {
        return (
          <FinancialListItem
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={`${item.labelKey}-${i}`}
            delay={300 + i * 100}
            initialX={type === 'income' ? -10 : 10}
          >
            <span className='min-w-0 text-star-white/70 break-words'>
              {t(item.labelKey)}
            </span>
            <span
              className={`${getFinancialColors(type).text} shrink-0 text-right font-bold tabular-nums`}
            >
              {formatSignedFinancialAmount(item.value, type, i18n.language)}
            </span>
          </FinancialListItem>
        )
      })}
    </ul>
  )
}
