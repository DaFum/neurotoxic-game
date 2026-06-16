import type { BasicTProps } from '../types'
import { DetailRow } from './DetailRow'
import type { BandData } from '../types'
import { Panel } from '../../../shared'
import { isUnlocked } from '../helpers'
import { USABLE_BOOLEAN_INVENTORY_ITEMS } from '../helpers'

export const InventoryEquipmentSection = ({
  band,
  onConsumeItem,
  t
}: {
  band: BandData
  onConsumeItem?: (itemId: string) => void
} & BasicTProps) => (
  <Panel
    title={t('ui:stats.inventory_equipment', {
      defaultValue: 'Inventory & Equipment'
    })}
  >
    <div className='grid grid-cols-2 gap-x-8 gap-y-1'>
      {Object.entries(band.inventory ?? {}).map(([key, val]) => {
        const isConsumable = USABLE_BOOLEAN_INVENTORY_ITEMS.has(key)
        const canConsume = val === true && isConsumable
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
        return (
          <DetailRow
            key={key}
            label={itemName}
            value={
              canConsume ? (
                <div className='flex items-center justify-end gap-2'>
                  <button
                    type='button'
                    disabled={!onConsumeItem}
                    onClick={() => onConsumeItem?.(key)}
                    aria-label={t('ui:detailedStats.useInventoryItemAria', {
                      item: itemName,
                      defaultValue: `Use ${itemName}`
                    })}
                    className='min-h-7 border px-2 text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed'
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
      })}
    </div>
  </Panel>
)
