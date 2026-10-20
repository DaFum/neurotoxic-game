import { memo } from 'react'
import type { TFunction } from 'i18next'
import { DollarSign, Fuel, Wrench } from 'lucide-react'
import { LOW_MONEY_THRESHOLD } from '../hud/shared/SharedHUDComponents'
import { finiteNumberOr } from '../../utils/gameState'
import { formatCurrency, formatPercent } from '../../utils/numberUtils'

/** Same warning levels as the van mini bars in the full status card. */
const LOW_FUEL_THRESHOLD = 20
const LOW_CONDITION_THRESHOLD = 25

interface OverworldPhoneResourcesProps {
  money: number
  fuel?: number | null
  condition?: number | null
  /** Active i18n language for currency and percent formatting. */
  language: string
  t: TFunction
}

/**
 * One-line cash, fuel and van condition readout for phones. The full status
 * card sits below the map there, so this keeps the resources a trip depends on
 * on the first screen. Hidden from `sm` up, where the HUD shows the full card.
 * @param props - Cash, van readings, formatting language, and translator.
 */
export const OverworldPhoneResources = memo(
  ({ money, fuel, condition, language, t }: OverworldPhoneResourcesProps) => {
    const safeFuel = finiteNumberOr(fuel, 0)
    const safeCondition = finiteNumberOr(condition, 0)
    const fuelLabel = t('ui:hud.fuelLevel', { defaultValue: 'Fuel Level' })
    const conditionLabel = t('ui:hud.vanCondition', {
      defaultValue: 'Van Condition'
    })

    return (
      <div
        data-testid='overworld-phone-resources'
        className='sm:hidden max-sm:order-2 pointer-events-auto flex items-center justify-between gap-3 border border-toxic-green/40 bg-void-black/95 px-3 py-2 font-mono text-sm font-bold tabular-nums text-star-white'
      >
        <span
          className={`flex items-center gap-1 ${money < LOW_MONEY_THRESHOLD ? 'text-blood-red' : ''}`}
        >
          <DollarSign
            size={14}
            className={
              money < LOW_MONEY_THRESHOLD
                ? 'text-blood-red'
                : 'text-warning-yellow'
            }
            aria-hidden='true'
          />
          {formatCurrency(money, language)}
        </span>
        <span
          className={`flex items-center gap-1 ${safeFuel < LOW_FUEL_THRESHOLD ? 'text-blood-red' : ''}`}
          aria-label={`${fuelLabel}: ${formatPercent(safeFuel / 100, language)}`}
          role='img'
        >
          <Fuel size={14} className='text-fuel-yellow' aria-hidden='true' />
          {formatPercent(safeFuel / 100, language)}
        </span>
        <span
          className={`flex items-center gap-1 ${safeCondition < LOW_CONDITION_THRESHOLD ? 'text-blood-red' : ''}`}
          aria-label={`${conditionLabel}: ${formatPercent(safeCondition / 100, language)}`}
          role='img'
        >
          <Wrench
            size={14}
            className='text-condition-blue'
            aria-hidden='true'
          />
          {formatPercent(safeCondition / 100, language)}
        </span>
      </div>
    )
  }
)

OverworldPhoneResources.displayName = 'OverworldPhoneResources'
