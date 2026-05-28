import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import {
  calculateChassisUpgradeCost,
  CHASSIS_CONFIG,
  getNextChassisTier
} from '../../utils/assetConfig'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { LongTermAsset } from '../../types/assets'

interface Props {
  asset: LongTermAsset
  isOpen: boolean
  onClose: () => void
}

export const UpgradeConfirmModal = ({ asset, isOpen, onClose }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { upgradeChassisTier } = useGameActions()
  const money = useGameSelector(state => state.player.money)

  const nextTier = getNextChassisTier(asset.chassisTier)
  const currentConfig =
    CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[asset.chassisTier]
  const targetConfig =
    nextTier === null
      ? undefined
      : CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[nextTier]
  const cost =
    currentConfig && targetConfig
      ? calculateChassisUpgradeCost(currentConfig, targetConfig)
      : 0
  const insufficient = nextTier !== null && money < cost
  const blocked =
    nextTier === null || !currentConfig || !targetConfig || insufficient

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:actions.upgrade')}
      className='assets-modal-sheet max-w-lg'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getChassisImagePrompt(
            asset.kind,
            asset.chassisFlavor,
            nextTier ?? asset.chassisTier
          )}
          alt={t(`assets:kind.${asset.kind}`)}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />
        {nextTier !== null && (
          <p className='text-xs uppercase opacity-70'>
            {t(`assets:chassisTier.${asset.chassisTier}`)} -&gt;{' '}
            {t(`assets:chassisTier.${nextTier}`)}
          </p>
        )}
        <p>
          {t('assets:actions.upgradeConfirm', {
            amount: formatCurrency(cost, i18n.language)
          })}
        </p>
        {insufficient && (
          <p style={{ color: 'var(--color-blood)' }}>
            {t('assets:purchaseFailed.insufficient_funds')}
          </p>
        )}
        <div className='flex justify-end gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='min-h-11 border-2 px-3 py-2'
          >
            {t('ui:action_cancel', { defaultValue: 'Cancel' })}
          </button>
          <Tooltip
            content={
              insufficient
                ? t('assets:purchaseFailed.insufficient_funds')
                : undefined
            }
          >
            <button
              type='button'
              onClick={() => {
                if (nextTier === null) return
                upgradeChassisTier(asset.id, nextTier)
                onClose()
              }}
              disabled={blocked}
              className='min-h-11 border-2 px-3 py-2 disabled:opacity-40'
              style={{
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void)'
              }}
            >
              {t('assets:actions.upgrade')}
            </button>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
