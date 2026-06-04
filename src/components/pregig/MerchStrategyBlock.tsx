import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_MERCH_PRICES } from '../../utils/economyEngine'
import { formatCurrency } from '../../utils/numberUtils'
import {
  getMerchCapacity,
  resolveMerchRestockCost,
  getMerchBundleAmount,
  getTotalMerchStock
} from '../../utils/merchUtils'
import { HQ_ITEMS_BY_MERCH_KEY } from '../../data/hqItems'

interface MerchStrategyBlockProps {
  bandInventory: Record<string, unknown>
  customPrices: Record<string, number>
  onUpdatePrice: (merchKey: string, newPrice: number) => void
  onRestock: (merchKey: string) => void
  restockCostMultiplier?: number
  merchCapacityBonus?: number
}

interface MerchItem {
  key: string
  name: string
  stock: number
  currentPrice: number
  defaultPrice: number
  restockCost: number
  restockAmount: number
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
}) => {
  const restockDisabled = item.restockAmount <= 0

  return (
    <div className='flex justify-between items-center bg-charcoal-gray p-3 border border-concrete-gray'>
      <div className='flex flex-col'>
        <span className='text-toxic-green font-mono uppercase'>
          {item.name}
        </span>
        <span className='text-ash-gray font-mono text-sm'>
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
            className='bg-concrete-gray hover:bg-steel-gray p-1 text-toxic-green'
          >
            -
          </button>
          <span className='text-toxic-green font-mono w-8 text-center'>
            {formatCurrency(item.currentPrice, language)}
          </span>
          <button
            type='button'
            aria-label={t('ui:pregig.merchStrategy.increasePrice', {
              item: item.name
            })}
            onClick={() => onUpdatePrice(item.key, item.currentPrice + 1)}
            className='bg-concrete-gray hover:bg-steel-gray p-1 text-toxic-green'
          >
            +
          </button>
        </div>

        <button
          type='button'
          onClick={() => {
            if (restockDisabled) return
            onRestock(item.key)
          }}
          disabled={restockDisabled}
          aria-disabled={restockDisabled}
          className='bg-toxic-green text-void-black font-mono px-3 py-1 uppercase text-sm hover:opacity-80 transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40'
          title={t('ui:pregig.merchStrategy.restockCost', {
            amount: item.restockAmount,
            cost: formatCurrency(item.restockCost, language)
          })}
        >
          {t('ui:pregig.merchStrategy.restock')}
        </button>
      </div>
    </div>
  )
}

/**
 * Renders the Merch Strategy Block.
 * @param props - Merch inventory, custom prices, price/restock handlers, restock cost multiplier, and capacity bonus.
 */
export const MerchStrategyBlock: React.FC<MerchStrategyBlockProps> = ({
  bandInventory,
  customPrices,
  onUpdatePrice,
  onRestock,
  restockCostMultiplier = 1,
  merchCapacityBonus = 0
}) => {
  const { t, i18n } = useTranslation(['economy', 'ui'])

  const merchItems = useMemo(() => {
    const items: MerchItem[] = []
    const merchCapacity = getMerchCapacity(merchCapacityBonus)
    const remainingCapacity = Math.max(
      0,
      merchCapacity - getTotalMerchStock(bandInventory)
    )
    for (const key in DEFAULT_MERCH_PRICES) {
      if (Object.hasOwn(DEFAULT_MERCH_PRICES, key)) {
        const defaultPrice = DEFAULT_MERCH_PRICES[key] ?? 10
        const currentPrice = customPrices[key] ?? defaultPrice
        const stock =
          typeof bandInventory[key] === 'number'
            ? (bandInventory[key] as number)
            : 0

        const itemDef = HQ_ITEMS_BY_MERCH_KEY.get(key)
        const bundleAmount = itemDef ? getMerchBundleAmount(itemDef) : 10
        const restockAmount = Math.max(
          0,
          Math.min(bundleAmount, remainingCapacity)
        )
        const restockCost = resolveMerchRestockCost({
          itemCost: itemDef?.cost ?? 50,
          merchCostMultiplier: restockCostMultiplier,
          restockAmount,
          bundleAmount
        })

        items.push({
          key,
          name: t(`economy:gigIncome.merchSales.${key}.label`, {
            defaultValue: key
          }),
          stock,
          currentPrice,
          defaultPrice,
          restockCost,
          restockAmount
        })
      }
    }
    return items
  }, [
    bandInventory,
    customPrices,
    merchCapacityBonus,
    restockCostMultiplier,
    t
  ])

  return (
    <div className='bg-void-black border-2 border-toxic-green p-4 flex flex-col gap-4'>
      <h3 className='text-toxic-green font-mono text-xl uppercase tracking-widest border-b border-toxic-green pb-2'>
        {t('ui:pregig.merchStrategy.title', { defaultValue: 'Merch Strategy' })}
      </h3>

      <div className='flex flex-col gap-3'>
        {merchItems.map(item => (
          <MerchItemRow
            key={item.key}
            item={item}
            language={i18n.language}
            onUpdatePrice={onUpdatePrice}
            onRestock={onRestock}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}
