import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { CancelButton } from './shared/CancelButton'
import { ConfirmButton } from './shared/ConfirmButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { getAssetSaleQuote } from '../../utils/assetSelectors'
import type { AssetConfirmModalProps as Props } from '../../types/ui'

/**
 * Sell confirmation. Mirrors the reducer's depreciation formula to give the
 * player a realistic preview of net proceeds. The reducer remains the
 * authoritative computation; this is preview only.
 */
export const SellConfirmModal = ({ asset, isOpen, onClose }: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { sellChassis } = useGameActions()
  const { net, blocked } = useGameSelector(s =>
    getAssetSaleQuote(asset, s.liabilities, s.player.day)
  )

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
          <CancelButton onClick={onClose} />
          <Tooltip
            content={
              blocked
                ? t('assets:sellFailed.liability_exceeds_value')
                : undefined
            }
          >
            <ConfirmButton
              onClick={() => {
                sellChassis(asset.id)
                onClose()
              }}
              disabled={blocked}
            >
              {t('assets:actions.sell')}
            </ConfirmButton>
          </Tooltip>
        </div>
      </div>
    </Modal>
  )
}
