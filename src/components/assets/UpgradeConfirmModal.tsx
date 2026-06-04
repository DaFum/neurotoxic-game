import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { ActionButton } from '../../ui/shared/ActionButton'
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

/**
 * Renders the Upgrade Confirm Modal component from asset, isOpen, and onClose.
 * @param props - Asset, modal state, and close handler for chassis upgrade confirmation.
 * @returns The rendered Upgrade Confirm Modal UI.
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
          <ActionButton
            onClick={onClose}
            variant='custom'
            className='bg-void-black text-ash-gray border-2 border-ash-gray px-3 py-2 text-sm hover:bg-ash-gray hover:text-void-black'
          >
            {t('ui:action_cancel')}
          </ActionButton>
          <Tooltip
            content={
              insufficient
                ? t('assets:purchaseFailed.insufficient_funds')
                : undefined
            }
          >
            <ActionButton
              onClick={() => {
                if (nextTier === null) return
                upgradeChassisTier(asset.id, nextTier)
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
              {t('assets:actions.upgrade')}
            </ActionButton>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
