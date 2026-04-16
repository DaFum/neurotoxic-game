// @ts-nocheck
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ShopItem } from './ShopItem'

const BALANCE_DISPLAY_META = {
  fame: { className: 'text-warning-yellow', suffix: '★' },
  funds: { className: 'text-toxic-green', suffix: '€' },
  money: { className: 'text-toxic-green', suffix: '€' },
  credits: { className: 'text-toxic-green', suffix: '€' },
  bonus: { className: 'text-star-white', suffix: '' }
}

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
          const meta = BALANCE_DISPLAY_META[key] || {
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

const balancesShape = PropTypes.shape({
  funds: PropTypes.number,
  money: PropTypes.number,
  fame: PropTypes.number,
  credits: PropTypes.number,
  bonus: PropTypes.number
})

const balancesValidator = (props, propName, componentName) => {
  const value = props[propName]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Error(`${componentName}: balances must be an object`)
  }

  const keys = Object.keys(value)
  if (keys.length === 0) {
    return new Error(`${componentName}: balances must include at least one key`)
  }

  const hasInvalidNumber = keys.some(key => !Number.isFinite(value[key]))
  if (hasInvalidNumber) {
    return new Error(`${componentName}: balances values must be finite numbers`)
  }

  return null
}

CatalogTab.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      cost: PropTypes.number.isRequired,
      description: PropTypes.string,
      type: PropTypes.string,
      effect: PropTypes.object
    })
  ).isRequired,
  balances: (props, propName, componentName, ...rest) => {
    const shapeError = balancesShape(props, propName, componentName, ...rest)
    if (shapeError) {
      return shapeError
    }
    return balancesValidator(props, propName, componentName)
  },
  handleBuy: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  getAdjustedCost: PropTypes.func,
  processingItemId: PropTypes.string
}
