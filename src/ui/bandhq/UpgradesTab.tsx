import { CatalogTab } from './CatalogTab'
import type { CatalogConsumerProps, CatalogItem } from '../../types/components'
import type { PlayerState } from '../../types'

type UpgradesTabProps = Omit<CatalogConsumerProps, 'items'> & {
  player: Pick<PlayerState, 'money' | 'fame'>
  upgrades: CatalogItem[]
}

/**
 * Displays upgrade catalog items available in Band HQ.
 * @param props - Player state, upgrade catalog, purchase handler, ownership/disabled checks, adjusted-cost resolver, and processing lock id.
 */
export const UpgradesTab = ({
  player,
  upgrades,
  handleBuy,
  isItemDisabled,
  getPurchaseDecision,
  processingItemId
}: UpgradesTabProps) => {
  return (
    <CatalogTab
      items={upgrades}
      balances={{ fame: player.fame, money: player.money }}
      handleBuyCallback={handleBuy}
      isItemDisabledCallback={isItemDisabled}
      getPurchaseDecisionCallback={getPurchaseDecision}
      processingItemId={processingItemId}
    />
  )
}
