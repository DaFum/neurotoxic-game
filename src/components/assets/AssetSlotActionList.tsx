import { useTranslation } from 'react-i18next'
import type { LongTermAsset } from '../../types/assets'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'

interface AssetSlotActionListProps {
  asset: LongTermAsset
  onSlotClick: (slotId: string) => void
}

const getConditionState = (
  condition: number
): 'good' | 'warning' | 'broken' => {
  if (condition < 20) return 'broken'
  if (condition < 50) return 'warning'
  return 'good'
}

/**
 * Displays install, remove, and slot-management actions for selected asset slots.
 * @param props - Asset state and slot-click handler for the slot action list.
 */
export const AssetSlotActionList = ({
  asset,
  onSlotClick
}: AssetSlotActionListProps) => {
  const { t } = useTranslation(['assets'])
  const conditionState = getConditionState(asset.condition)
  const isDamaged = conditionState !== 'good'

  return (
    <div className='assets-hub-reveal flex flex-col gap-2'>
      {asset.slots.map(slot => {
        const installed = slot.installedModuleId
        const module = installed ? MODULE_REGISTRY[installed] : undefined
        const slotName = t(`assets:slot.${slot.slotType}`)
        const moduleName =
          installed !== null
            ? t(`assets:module.${installed}.name`, {
                defaultValue: installed
              })
            : null
        const stateLabel =
          moduleName !== null
            ? `${t('assets:hub.slotState.installed')}: ${moduleName}`
            : t('assets:hub.slotState.empty')
        const buttonLabel = t('assets:hub.accessibility.slotAction', {
          slot: slotName,
          state: stateLabel
        })

        return (
          <div
            key={slot.id}
            className='assets-hub-panel assets-slot-row grid grid-cols-[1fr_auto] gap-2 px-2 py-2'
          >
            <div className='min-w-0'>
              <div className='flex min-w-0 items-center gap-2'>
                <strong
                  className='assets-hub-control truncate text-xs uppercase'
                  style={{ color: 'var(--section-accent)' }}
                >
                  {slotName}
                </strong>
                <span className='shrink-0 border px-1 text-xxs uppercase opacity-70'>
                  {stateLabel}
                </span>
              </div>
              {moduleName !== null && (
                <p className='mt-1 truncate text-sm text-star-white'>
                  {moduleName}
                </p>
              )}
              {module && (
                <p className='mt-0.5 line-clamp-2 text-xs opacity-70'>
                  {t(`assets:module.${module.id}.description`, {
                    defaultValue: ''
                  })}
                </p>
              )}
              {isDamaged && (
                <p className='mt-1 text-xs uppercase text-warning-yellow'>
                  {t('assets:hub.slotState.damaged')}:{' '}
                  {t(`assets:condition.${conditionState}`)}
                </p>
              )}
            </div>
            <button
              type='button'
              aria-label={buttonLabel}
              onClick={() => onSlotClick(slot.id)}
              className={`assets-hub-control ${
                moduleName === null
                  ? 'assets-hub-primary-button'
                  : 'assets-hub-secondary-button'
              } min-h-11 self-center border-2 px-3 py-2 text-xs uppercase`}
              style={{
                borderColor: 'var(--section-accent)',
                background:
                  moduleName === null ? 'var(--section-accent)' : 'transparent',
                color:
                  moduleName === null ? 'var(--color-void-black)' : 'inherit'
              }}
            >
              {moduleName === null
                ? t('assets:actions.install')
                : t('assets:hub.actions.manageSlot')}
            </button>
          </div>
        )
      })}
    </div>
  )
}
