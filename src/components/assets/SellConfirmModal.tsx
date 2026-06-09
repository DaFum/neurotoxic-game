import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { Tooltip } from '../../ui/shared/Tooltip'
import { ActionButton } from '../../ui/shared/ActionButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getChassisImagePrompt } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import { useGameActions, useGameSelector } from '../../context/GameState'
import { calculateChassisGrossSaleValue } from '../../utils/assetSelectors'
import { finiteNumberOr } from '../../utils/gameState'
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
  const liabilityDebt = useGameSelector(s => {
    let sum = 0
    const liabilities = s.liabilities ?? {}
    for (const id in liabilities) {
      if (Object.hasOwn(liabilities, id)) {
        const liability = liabilities[id]
        if (liability && liability.assetId === asset.id) {
          sum += Math.max(0, finiteNumberOr(liability.principalRemaining, 0))
        }
      }
    }
    return sum
  })

  const grossSale = calculateChassisGrossSaleValue(asset, day) ?? 0
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
