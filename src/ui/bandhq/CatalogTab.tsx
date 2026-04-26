import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { ShopItem } from './ShopItem'

type CatalogItem = {
  id: string | number
  name?: string
  cost: number
  description?: string
  type?: string
  effect?: Record<string, unknown>
  currency?: string
  img?: string
}

type Balances = Record<string, number>

type CatalogTabProps = {
  items: CatalogItem[]
  balances: Balances
  handleBuy: (item: CatalogItem) => void
  isItemOwned: (item: CatalogItem) => boolean
  isItemDisabled: (item: CatalogItem) => boolean
  getAdjustedCost?: (item: CatalogItem) => number | undefined
  processingItemId?: string
}

const BALANCE_DISPLAY_META = {
  fame: { className: 'text-warning-yellow', suffix: '★' },
  funds: { className: 'text-toxic-green', suffix: '€' },
  money: { className: 'text-toxic-green', suffix: '€' },
  credits: { className: 'text-toxic-green', suffix: '€' },
  bonus: { className: 'text-star-white', suffix: '' }
} as const

export const CatalogTab = ({
  items,
  balances,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: CatalogTabProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className='mb-4 flex justify-end gap-4 font-mono text-star-white'>
        {Object.entries(balances).map(([key, value]) => {
          const meta = BALANCE_DISPLAY_META[
            key as keyof typeof BALANCE_DISPLAY_META
          ] || {
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
        {((items as any[]) || [])?.map((item: any) => (
          <ShopItem
            key={item.id}
            item={item}
            isOwned={(isItemOwned as any)(item)}
            isDisabled={(isItemDisabled as any)(item)}
            adjustedCost={
              getAdjustedCost ? (getAdjustedCost as any)(item) : undefined
            }
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
    props: unknown,
    propName: unknown,
    componentName: unknown,
    ...rest: any[]
  ) => {
    const shapeError = (balancesShape as any)(
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
  handleBuy: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  getAdjustedCost: PropTypes.func,
  processingItemId: PropTypes.string
}
