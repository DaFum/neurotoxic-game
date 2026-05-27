import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_MERCH_PRICES } from '../../utils/economyEngine'
import { formatCurrency } from '../../utils/numberUtils'
import { HQ_ITEMS_BY_MERCH_KEY } from '../../data/hqItems'

interface MerchStrategyBlockProps {
  bandInventory: Record<string, unknown>
  customPrices: Record<string, number>
  onUpdatePrice: (merchKey: string, newPrice: number) => void
  onRestock: (merchKey: string) => void
  restockCostMultiplier?: number
}

interface MerchItem {
  key: string
  name: string
  stock: number
  currentPrice: number
  defaultPrice: number
  restockCost: number
}

interface MerchItemRowProps {
  item: MerchItem
  language: string
  onUpdatePrice: (merchKey: string, newPrice: number) => void
  onRestock: (merchKey: string) => void
  t: ReturnType<typeof useTranslation>['t']
}

const MerchItemRow: React.FC<MerchItemRowProps> = ({
  item,
  language,
  onUpdatePrice,
  onRestock,
  t
}) => (
  <div className='flex justify-between items-center bg-(--color-charcoal-gray) p-3 border border-(--color-concrete-gray)'>
    <div className='flex flex-col'>
      <span className='text-(--color-toxic-green) font-mono uppercase'>
        {item.name}
      </span>
      <span className='text-(--color-ash-gray) font-mono text-sm'>
        {t('ui:pregig.merchStrategy.stock', { count: item.stock })}
      </span>
    </div>

    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          aria-label={t('ui:pregig.merchStrategy.decreasePrice', {
            item: item.name
          })}
          onClick={() =>
            onUpdatePrice(item.key, Math.max(1, item.currentPrice - 1))
          }
          className='bg-(--color-concrete-gray) hover:bg-(--color-steel-gray) p-1 text-(--color-toxic-green)'
        >
          -
        </button>
        <span className='text-(--color-toxic-green) font-mono w-8 text-center'>
          {formatCurrency(item.currentPrice, language)}
        </span>
        <button
          type='button'
          aria-label={t('ui:pregig.merchStrategy.increasePrice', {
            item: item.name
          })}
          onClick={() => onUpdatePrice(item.key, item.currentPrice + 1)}
          className='bg-(--color-concrete-gray) hover:bg-(--color-steel-gray) p-1 text-(--color-toxic-green)'
        >
          +
        </button>
      </div>

      <button
        type='button'
        onClick={() => onRestock(item.key)}
        className='bg-(--color-toxic-green) text-(--color-void-black) font-mono px-3 py-1 uppercase text-sm hover:opacity-80 transition-colors'
        title={t('ui:pregig.merchStrategy.restockCost', {
          cost: item.restockCost
        })}
      >
        {t('ui:pregig.merchStrategy.restock')}
      </button>
    </div>
  </div>
)

export const MerchStrategyBlock: React.FC<MerchStrategyBlockProps> = ({
  bandInventory,
  customPrices,
  onUpdatePrice,
  onRestock,
  restockCostMultiplier = 1
}) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const merchItems = useMemo(() => {
    const items: MerchItem[] = []
    for (const key in DEFAULT_MERCH_PRICES) {
      if (Object.hasOwn(DEFAULT_MERCH_PRICES, key)) {
        const defaultPrice = DEFAULT_MERCH_PRICES[key] ?? 10
        const currentPrice = customPrices[key] ?? defaultPrice
        const stock =
          typeof bandInventory[key] === 'number'
            ? (bandInventory[key] as number)
            : 0

        const restockCost = Math.ceil(
          (HQ_ITEMS_BY_MERCH_KEY.get(key)?.cost ?? 50) * restockCostMultiplier
        )

        items.push({
          key,
          name: t(`economy:gigIncome.merchSales.${key}.label`, {
            defaultValue: key
          }),
          stock,
          currentPrice,
          defaultPrice,
          restockCost
        })
      }
    }
    return items
  }, [bandInventory, customPrices, restockCostMultiplier, t])

  return (
    <div className='bg-(--color-void-black) border-2 border-(--color-toxic-green) p-4 flex flex-col gap-4'>
      <h3 className='text-(--color-toxic-green) font-mono text-xl uppercase tracking-widest border-b border-(--color-toxic-green) pb-2'>
        {t('ui:pregig.merchStrategy.title', { defaultValue: 'Merch Strategy' })}
      </h3>

      <div className='flex flex-col gap-3'>
        {merchItems.map(item => (
          <MerchItemRow
            key={item.key}
            item={item}
            language={i18n?.language ?? 'en'}
            onUpdatePrice={onUpdatePrice}
            onRestock={onRestock}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}
