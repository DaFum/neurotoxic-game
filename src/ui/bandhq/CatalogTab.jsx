import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ShopItem } from './ShopItem'

export const CatalogTab = ({
  items,
  balances,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className='mb-4 flex justify-end gap-4 font-mono text-star-white'>
        {Object.entries(balances).map(([key, value]) => {
          const isFame = key === 'fame'
          return (
            <span key={key}>
              {t(`ui:bandhq.${key}`, { defaultValue: key.toUpperCase() })}:{' '}
              <span
                className={isFame ? 'text-warning-yellow' : 'text-toxic-green'}
              >
                {value}
                {isFame ? '★' : '€'}
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
            isOwned={isItemOwned(item)}
            isDisabled={isItemDisabled(item)}
            adjustedCost={getAdjustedCost ? getAdjustedCost(item) : undefined}
            onBuy={handleBuy}
            processingItemId={processingItemId}
          />
        ))}
      </div>
    </div>
  )
}

CatalogTab.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  balances: PropTypes.object.isRequired,
  handleBuy: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  getAdjustedCost: PropTypes.func,
  processingItemId: PropTypes.string
}
