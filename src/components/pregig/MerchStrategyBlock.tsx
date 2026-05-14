import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_MERCH_PRICES } from '../../utils/economyEngine'
import { HQ_ITEMS } from '../../data/hqItems'

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
      const defaultPrice = DEFAULT_MERCH_PRICES[key] || 10
      const currentPrice = customPrices[key] || defaultPrice
      const stock =
        typeof bandInventory[key] === 'number'
          ? (bandInventory[key] as number)
          : 0

      const hqItemDef = HQ_ITEMS.find(item => item.effect.key === key)
      const restockCost = hqItemDef ? hqItemDef.cost : 50 // fallback

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
            className='flex justify-between items-center bg-zinc-900/50 p-3 border border-zinc-800'
          >
            <div className='flex flex-col'>
              <span className='text-white font-mono uppercase'>
                {item.name}
              </span>
              <span className='text-zinc-400 font-mono text-sm'>
                Stock: {item.stock}
              </span>
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() =>
                    onUpdatePrice(item.key, Math.max(1, item.currentPrice - 1))
                  }
                  className='bg-zinc-800 hover:bg-zinc-700 p-1 text-white'
                >
                  -
                </button>
                <span className='text-(--color-toxic-green) font-mono w-8 text-center'>
                  {'$'}
                  {item.currentPrice}
                </span>
                <button
                  onClick={() => onUpdatePrice(item.key, item.currentPrice + 1)}
                  className='bg-zinc-800 hover:bg-zinc-700 p-1 text-white'
                >
                  +
                </button>
              </div>

              <button
                onClick={() => onRestock(item.key)}
                className='bg-(--color-toxic-green) text-black font-mono px-3 py-1 uppercase text-sm hover:bg-green-400 transition-colors'
                title={`Cost: ${item.restockCost}`}
              >
                {t('ui:pregig.merchStrategy.restock', {
                  defaultValue: 'Restock'
                })}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
