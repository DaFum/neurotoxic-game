import { HQ_ITEMS } from '../../data/hqItems'
import { CatalogTab } from './CatalogTab'
import type {
  CatalogConsumerProps,
  CatalogItem,
  PurchaseItem,
  Effect
} from '../../types/components'
import type { PlayerState } from '../../types/game'

type ShopTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money'>
}

const isEffect = (obj: unknown): obj is Effect => {
  if (typeof obj !== 'object' || obj === null) return false
  const effect = obj as Record<string, unknown>
  if (typeof effect.type !== 'string') return false

  switch (effect.type) {
    case 'inventory_add':
      return typeof effect.item === 'string' && typeof effect.value === 'number'
    case 'inventory_set':
      return typeof effect.item === 'string'
    case 'stat_modifier':
      return (
        (effect.target === 'player' ||
          effect.target === 'band' ||
          effect.target === 'van' ||
          effect.target === 'performance') &&
        typeof effect.stat === 'string' &&
        typeof effect.value === 'number'
      )
    case 'unlock_upgrade':
    case 'unlock_hq':
      return typeof effect.id === 'string'
    case 'passive':
      return typeof effect.key === 'string'
    default:
      return false
  }
}

// ⚡ Bolt Optimization:
// Lifted expensive array creation and filtering out of the render loop.
// Iterating over the source arrays directly using a nested loop avoids
// intermediate array allocations and temporary variables in the module scope.
const ITEMS: CatalogItem[] = (() => {
  const processed: CatalogItem[] = []
  const sources = [
    (Array.isArray(HQ_ITEMS.gear) ? HQ_ITEMS.gear : []) as unknown as PurchaseItem[],
    (Array.isArray(HQ_ITEMS.instruments) ? HQ_ITEMS.instruments : []) as unknown as PurchaseItem[]
  ]

  for (let j = 0; j < sources.length; j++) {
    const source = sources[j]
    if (!source || !Array.isArray(source)) continue

    for (let i = 0; i < source.length; i++) {
      const item = source[i]
      if (item == null || item.id == null) continue
      if (typeof item.cost !== 'number' || !Number.isFinite(item.cost)) continue

      if (item.effect != null && !isEffect(item.effect)) {
        throw new Error(
          `Invalid effect shape in ShopTab for item "${String(item.id)}"`
        )
      }

      processed.push({
        ...item,
        id: String(item.id),
        cost: item.cost,
        effect: item.effect as Effect | undefined
      })
    }
  }
  return processed
})()

export const ShopTab = ({
  player,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: ShopTabProps) => {
  return (
    <CatalogTab
      items={ITEMS}
      balances={{ funds: player.money }}
      handleBuyCallback={handleBuy}
      isItemOwnedCallback={isItemOwned}
      isItemDisabledCallback={isItemDisabled}
      getAdjustedCostCallback={getAdjustedCost}
      processingItemId={processingItemId}
    />
  )
}
