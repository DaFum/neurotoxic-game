import type { BasicTProps } from '../types'
import { DetailRow } from './DetailRow'
import type { BandState } from '../../../../types'
import { Panel } from '../../../shared'
import { isUnlocked } from '../helpers'
import { USABLE_BOOLEAN_INVENTORY_ITEMS } from '../helpers'
import {
  INVENTORY_USE_EFFECTS,
  SPARE_GEAR_ITEM_IDS
} from '../../../../data/inventoryItems'
import { isFiniteNumber } from '../../../../utils/gameState'

/** Inventory keys whose locale entry carries an effect description. */
const DESCRIBED_ITEMS = new Set<string>([
  ...Object.keys(INVENTORY_USE_EFFECTS),
  ...SPARE_GEAR_ITEM_IDS,
  'sleeping_bags'
])

export const InventoryEquipmentSection = ({
  band,
  onConsumeItem,
  t
}: {
  band: BandState
  onConsumeItem?: (itemId: string) => void
} & BasicTProps) => (
  <Panel
    title={t('ui:stats.inventory_equipment', {
      defaultValue: 'Inventory & Equipment'
    })}
  >
    <div className='grid grid-cols-2 gap-x-8 gap-y-1'>
      {(() => {
        const result = []
        const inv = band.inventory ?? {}
        for (const key in inv) {
          if (!Object.hasOwn(inv, key)) continue
          const val = inv[key]
          const isUsable = Object.hasOwn(INVENTORY_USE_EFFECTS, key)
          const isConsumable =
            USABLE_BOOLEAN_INVENTORY_ITEMS.has(key) || isUsable
          const canConsume =
            isConsumable &&
            (val === true || (isUsable && isFiniteNumber(val) && val > 0))
          const itemName = t(`items:${key}.name`, {
            defaultValue: key.replace(/_/g, ' ').toUpperCase()
          })
          const status =
            val === true
              ? isConsumable
                ? String(val)
                : t('ui:ui.owned', { defaultValue: 'OWNED' })
              : val === false
                ? t('ui:ui.locked', { defaultValue: 'LOCKED' })
                : String(val)
          const subtext = DESCRIBED_ITEMS.has(key)
            ? t(`items:${key}.description`)
            : undefined
          const node = (
            <DetailRow
              key={key}
              label={itemName}
              subtext={subtext}
              value={
                canConsume ? (
                  <div className='flex items-center justify-end gap-2'>
                    {typeof val === 'number' && <span>{String(val)}</span>}
                    <button
                      type='button'
                      disabled={!onConsumeItem}
                      onClick={() => onConsumeItem?.(key)}
                      aria-label={t('ui:detailedStats.useInventoryItemAria', {
                        item: itemName,
                        defaultValue: 'Use {{item}}'
                      })}
                      className='min-h-7 border px-2 text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-abyss-black'
                      style={{
                        borderColor: 'var(--color-toxic-green)',
                        color: 'var(--color-toxic-green)'
                      }}
                    >
                      {t('ui:detailedStats.useInventoryItem', {
                        defaultValue: 'Use'
                      })}
                    </button>
                  </div>
                ) : (
                  status
                )
              }
              locked={!isUnlocked(val)}
            />
          )
          result.push(node)
        }
        return result
      })()}
    </div>
  </Panel>
)
