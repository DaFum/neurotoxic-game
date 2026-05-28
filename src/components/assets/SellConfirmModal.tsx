import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { ActionButton } from '../../ui/shared/ActionButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { LongTermAsset } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  isOpen: boolean
  onClose: () => void
}

/**
 * Sell confirmation. Mirrors the reducer's depreciation formula to give the
 * player a realistic preview of net proceeds. The reducer remains the
 * authoritative computation; this is preview only.
 */
export const SellConfirmModal = ({ asset, isOpen, onClose }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { sellChassis } = useGameActions()
  const day = useGameSelector(s => s.player.day)
  const liability = useGameSelector(s =>
    s.liabilities.find(l => l.assetId === asset.id)
  )

  const cfg =
    CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[asset.chassisTier]
  const conditionFactor = asset.condition / 100
  const daysOwned = Math.max(0, day - asset.acquiredOnDay)
  const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)
  const grossSale = (cfg?.price ?? 0) * conditionFactor * depreciation
  const liabilityDebt = liability?.principalRemaining ?? 0
  const net = grossSale - liabilityDebt
  const blocked = net < 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:actions.sell')}
      className='assets-modal-sheet max-w-lg'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getChassisImagePrompt(
            asset.kind,
            asset.chassisFlavor,
            asset.chassisTier
          )}
          alt={t(`assets:kind.${asset.kind}`)}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />
        <p>
          {t('assets:actions.sellConfirm', {
            amount: formatCurrency(Math.max(0, Math.floor(net)), i18n.language)
          })}
        </p>
        {blocked && (
          <p style={{ color: 'var(--color-blood-red)' }}>
            {t('assets:sellFailed.liability_exceeds_value')}
          </p>
        )}
        <div className='flex justify-end gap-2'>
          <ActionButton
            onClick={onClose}
            variant='custom'
            className='bg-void-black text-ash-gray border-2 border-ash-gray px-3 py-2 text-sm hover:bg-ash-gray hover:text-void-black'
          >
            {t('ui:action_cancel')}
          </ActionButton>
          <Tooltip
            content={
              blocked
                ? t('assets:sellFailed.liability_exceeds_value')
                : undefined
            }
          >
            <ActionButton
              onClick={() => {
                sellChassis(asset.id)
                onClose()
              }}
              disabled={blocked}
              variant='custom'
              className='px-3 py-2 text-sm disabled:opacity-40'
              style={{
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void-black)'
              }}
            >
              {t('assets:actions.sell')}
            </ActionButton>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
