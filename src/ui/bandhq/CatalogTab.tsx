import { useTranslation } from 'react-i18next'
import type { CatalogTabProps } from '../../types/components'
import { ShopItem } from './ShopItem'

const BALANCE_DISPLAY_META = {
  fame: { className: 'text-warning-yellow', suffix: '★' },
  funds: { className: 'text-toxic-green', suffix: '€' },
  money: { className: 'text-toxic-green', suffix: '€' },
  credits: { className: 'text-toxic-green', suffix: '€' },
  bonus: { className: 'text-star-white', suffix: '' }
} as const

const hasBalanceMetaKey = (
  key: string
): key is keyof typeof BALANCE_DISPLAY_META =>
  Object.hasOwn(BALANCE_DISPLAY_META, key)

export const CatalogTab = ({
  items,
  balances,
  handleBuyCallback,
  isItemOwnedCallback,
  isItemDisabledCallback,
  getAdjustedCostCallback,
  processingItemId
}: CatalogTabProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className='mb-4 flex justify-end gap-4 font-mono text-star-white'>
        {Object.entries(balances).map(([key, value]) => {
          const meta = hasBalanceMetaKey(key)
            ? BALANCE_DISPLAY_META[key]
            : {
                className: 'text-star-white',
                suffix: ''
              }
          return (
            <span key={key}>
              {t(`ui:bandhq.${key}`)}:{' '}
              <span className={meta.className}>
                {value}
                {meta.suffix}
              </span>
            </span>
          )
        })}
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

