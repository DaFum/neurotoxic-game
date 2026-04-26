import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import type { CatalogItem, CatalogTabProps } from '../../types/components'
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

const balancesShape = PropTypes.shape({
  funds: PropTypes.number,
  money: PropTypes.number,
  fame: PropTypes.number,
  credits: PropTypes.number,
  bonus: PropTypes.number
})

const balancesValidator = (
  props: Record<string, unknown>,
  propName: string,
  componentName: string
) => {
  const value = props[propName]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Error(`${componentName}: balances must be an object`)
  }

  const record = value as Record<string, unknown>
  let hasKeys = false
  for (const key in record) {
    if (Object.hasOwn(record, key)) {
      hasKeys = true
      if (!Number.isFinite(record[key])) {
        return new Error(
          `${componentName}: balances values must be finite numbers`
        )
      }
    }
  }

  if (!hasKeys) {
    return new Error(`${componentName}: balances must include at least one key`)
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
  balances: (
    props: Record<string, unknown>,
    propName: string,
    componentName: string,
    ...rest: unknown[]
  ) => {
    const shapeError = balancesShape(
      props,
      propName,
      componentName,
      ...rest
    )
    if (shapeError) {
      return shapeError
    }
    return balancesValidator(
      props as Record<string, unknown>,
      propName,
      componentName
    )
  },
  handleBuyCallback: PropTypes.func.isRequired,
  isItemOwnedCallback: PropTypes.func.isRequired,
  isItemDisabledCallback: PropTypes.func.isRequired,
  getAdjustedCostCallback: PropTypes.func,
  processingItemId: PropTypes.string
}
