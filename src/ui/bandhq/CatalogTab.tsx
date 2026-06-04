import { useTranslation } from 'react-i18next'
import type { CatalogTabProps } from '../../types/components'
import { logger } from '../../utils/logger'
import { ShopItem } from './ShopItem'
import { formatCurrency } from '../../utils/numberUtils'

const BALANCE_DISPLAY_META = {
  fame: { className: 'text-warning-yellow', suffix: '★', isCurrency: false },
  funds: { className: 'text-toxic-green', suffix: '', isCurrency: true },
  money: { className: 'text-toxic-green', suffix: '', isCurrency: true },
  credits: { className: 'text-toxic-green', suffix: '', isCurrency: true },
  bonus: { className: 'text-star-white', suffix: '', isCurrency: false }
} as const

const hasBalanceMetaKey = (
  key: string
): key is keyof typeof BALANCE_DISPLAY_META =>
  Object.hasOwn(BALANCE_DISPLAY_META, key)

/**
 * Displays purchasable catalog items using pre-bound purchase callbacks.
 * @param props - Catalog items, player balances, purchase callbacks, ownership checks, disabled checks, adjusted-cost resolver, and processing lock id.
 */
export const CatalogTab = ({
  items,
  balances,
  handleBuyCallback,
  isItemOwnedCallback,
  isItemDisabledCallback,
  getAdjustedCostCallback,
  processingItemId
}: CatalogTabProps) => {
  const { t, i18n } = useTranslation()

  if (import.meta.env.DEV) {
    const keys = Object.keys(balances)
    if (keys.length === 0) {
      logger.warn('UI', 'CatalogTab: balances must include at least one key')
    }
    for (const key of keys) {
      if (!Number.isFinite(balances[key])) {
        logger.warn(
          'UI',
          `CatalogTab: balances.${key} must be a finite number, got ${balances[key]}`
        )
      }
    }
  }

  const balanceElements = []
  const keys = Object.keys(balances)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as string
    const value = balances[key]
    if (value === undefined) continue

    const meta = hasBalanceMetaKey(key)
      ? BALANCE_DISPLAY_META[key]
      : {
          className: 'text-star-white',
          suffix: '',
          isCurrency: false
        }
    const display = meta.isCurrency
      ? formatCurrency(value, i18n.language)
      : `${value}${meta.suffix}`
    balanceElements.push(
      <span key={key}>
        {t(`ui:bandhq.${key}`)}:{' '}
        <span className={meta.className}>{display}</span>
      </span>
    )
  }

  return (
    <div>
      <div className='mb-4 flex justify-end gap-4 font-mono text-star-white'>
        {balanceElements}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4'>
        {items.map(item => (
          <ShopItem
            key={item.id}
            item={item}
            isOwned={isItemOwnedCallback(item)}
            isDisabled={isItemDisabledCallback(item)}
            adjustedCost={
              getAdjustedCostCallback
                ? getAdjustedCostCallback(item)
                : undefined
            }
            onBuy={handleBuyCallback}
            processingItemId={processingItemId}
          />
        ))}
      </div>
    </div>
  )
}
