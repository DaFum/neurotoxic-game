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

const RAW_ITEMS: PurchaseItem[] = [
  ...((HQ_ITEMS.gear as unknown as PurchaseItem[]) || []),
  ...((HQ_ITEMS.instruments as unknown as PurchaseItem[]) || [])
]

// ⚡ Bolt Optimization:
// Lifted expensive array creation and filtering out of the render loop.
// Combined .filter() and .map() into a single O(n) for-loop, pre-computed once.
// This prevents unnecessary array allocations on every ShopTab re-render.
const ITEMS: CatalogItem[] = (() => {
  const processed: CatalogItem[] = []
  for (let i = 0; i < RAW_ITEMS.length; i++) {
    const item = RAW_ITEMS[i]
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
