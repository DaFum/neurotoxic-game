import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { CancelButton } from './shared/CancelButton'
import { ConfirmButton } from './shared/ConfirmButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import {
  calculateChassisUpgradeCost,
  CHASSIS_CONFIG,
  getNextChassisTier
} from '../../utils/assetConfig'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { AssetConfirmModalProps as Props } from '../../types/ui'

/**
 * Confirms chassis tier upgrade cost and action for one asset.
 * @param props - Asset, modal state, and close handler for chassis upgrade confirmation.
 */
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
          <p style={{ color: 'var(--color-blood-red)' }}>
            {t('assets:purchaseFailed.insufficient_funds')}
          </p>
        )}
        <div className='flex justify-end gap-2'>
          <CancelButton onClick={onClose} />
          <Tooltip
            content={
              insufficient
                ? t('assets:purchaseFailed.insufficient_funds')
                : undefined
            }
          >
            <ConfirmButton
              onClick={() => {
                if (nextTier === null) return
                upgradeChassisTier(asset.id, nextTier)
                onClose()
              }}
              disabled={blocked}
            >
              {t('assets:actions.upgrade')}
            </ConfirmButton>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
