import PropTypes from 'prop-types'
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

export const ShopTab = ({
  player,
  handleBuy,
  isItemOwned,
  isItemDisabled,
  getAdjustedCost,
  processingItemId
}: ShopTabProps) => {
  const rawItems: PurchaseItem[] = [
    ...((HQ_ITEMS.gear as unknown as PurchaseItem[]) || []),
    ...((HQ_ITEMS.instruments as unknown as PurchaseItem[]) || [])
  ]

  const items: CatalogItem[] = rawItems
    .filter(
      (
        item
      ): item is PurchaseItem & {
        id: string | number
        cost: number
        effect?: Effect
      } => {
        if (item.id == null) return false
        if (typeof item.cost !== 'number' || !Number.isFinite(item.cost))
          return false
        if (item.effect != null && !isEffect(item.effect)) {
          throw new Error(
            `Invalid effect shape in ShopTab for item "${String(item.id)}"`
          )
        }
        return true
      }
    )
    .map(item => ({
      ...item,
      id: String(item.id),
      cost: item.cost,
      effect: item.effect
    }))

  return (
    <CatalogTab
      items={items}
      balances={{ funds: player.money }}
      handleBuyCallback={handleBuy}
      isItemOwnedCallback={isItemOwned}
      isItemDisabledCallback={isItemDisabled}
      getAdjustedCostCallback={getAdjustedCost}
      processingItemId={processingItemId}
    />
  )
}

ShopTab.propTypes = {
  player: PropTypes.shape({
    money: PropTypes.number
  }).isRequired,
  handleBuy: PropTypes.func.isRequired,
  isItemOwned: PropTypes.func.isRequired,
  isItemDisabled: PropTypes.func.isRequired,
  getAdjustedCost: PropTypes.func,
  processingItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}
