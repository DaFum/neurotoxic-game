import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_MERCH_PRICES } from '../../utils/economyEngine'
import { HQ_ITEMS } from '../../data/hqItems'

const ALL_HQ_ITEMS = Object.values(HQ_ITEMS).flat()

interface MerchStrategyBlockProps {
  bandInventory: Record<string, unknown>
  customPrices: Record<string, number>
  onUpdatePrice: (merchKey: string, newPrice: number) => void
  onRestock: (merchKey: string) => void
}

export const MerchStrategyBlock: React.FC<MerchStrategyBlockProps> = ({
  bandInventory,
  customPrices,
  onUpdatePrice,
  onRestock
}) => {
  const { t } = useTranslation(['economy', 'ui'])

  const merchItems = useMemo(() => {
    return Object.keys(DEFAULT_MERCH_PRICES).map(key => {
      const defaultPrice = DEFAULT_MERCH_PRICES[key] ?? 10
      const currentPrice = customPrices[key] ?? defaultPrice
      const stock =
        typeof bandInventory[key] === 'number'
          ? (bandInventory[key] as number)
          : 0

      const hqItemDef = ALL_HQ_ITEMS.find(
        item =>
          typeof item.effect === 'object' &&
          item.effect !== null &&
          Object.hasOwn(item.effect, 'item') &&
          (item.effect as { item?: unknown }).item === key
      )
      const restockCost = hqItemDef?.cost ?? 50 // fallback

      return {
        key,
        name: t(`economy:gigIncome.merchSales.${key}.label`, {
          defaultValue: key
        }),
        stock,
        currentPrice,
        defaultPrice,
        restockCost
      }
    })
  }, [bandInventory, customPrices, t])

  return (
    <div className='bg-(--color-void-black) border-2 border-(--color-toxic-green) p-4 flex flex-col gap-4'>
      <h3 className='text-(--color-toxic-green) font-mono text-xl uppercase tracking-widest border-b border-(--color-toxic-green) pb-2'>
        {t('ui:pregig.merchStrategy.title', { defaultValue: 'Merch Strategy' })}
      </h3>

      <div className='flex flex-col gap-3'>
        {merchItems.map(item => (
          <div
            key={item.key}
            className='flex justify-between items-center bg-(--color-charcoal-gray) p-3 border border-(--color-concrete-gray)'
          >
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
                  {'€'}
                  {item.currentPrice}
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
        ))}
      </div>
    </div>
  )
}
