import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { CancelButton } from './shared/CancelButton'
import { ConfirmButton } from './shared/ConfirmButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getCrowdfundImagePrompt } from '../../utils/imageGen'
import { formatCurrency, formatPercent } from '../../utils/numberUtils'
import { resolveCrowdfundProbability } from '../../utils/assets/assetTicks'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { AssetFlavor, AssetKind, ChassisTier } from '../../types/assets'
import type { BaseModalProps } from '../../types/ui'

interface Props extends BaseModalProps {
  kind: AssetKind
  flavor: AssetFlavor
  tier: ChassisTier
  targetAmount: number
}

/**
 * Renders the modal interface for configuring and launching a new crowdfund campaign.
 *
 * @remarks
 * The player sees a live success probability preview computed via `resolveCrowdfundProbability`
 * (using the player's total fame, scene presence, and the target amount) to ensure the UI remains
 * perfectly aligned with the backend tick reducer logic. The player configures the campaign by
 * adjusting their fame stake and the campaign duration.
 *
 * Only the setup request is dispatched. `startCrowdfund` derives the odds (same
 * `resolveCrowdfundProbability` inputs as the preview) and the deterministic
 * `mulberry32` roll from state, and caps the stake at the player's fame, so the
 * dispatch cannot choose any of them.
 *
 * @param params - The destructure modal properties and asset campaign target parameters.
 * @returns A rendered modal sheet component containing the crowdfund configuration interface.
 */
export const CrowdfundSetupModal = ({
  kind,
  flavor,
  tier,
  targetAmount,
  isOpen,
  onClose
}: Props) => {
  const { t, i18n } = useTranslation(['assets'])
  const { startCrowdfund } = useGameActions()
  const fame = useGameSelector(s => s.player.fame)
  const scenePresence = useGameSelector(s => s.social?.scenePresence ?? 0)

  const [fameStake, setFameStake] = useState<number>(Math.min(20, fame))
  const [days, setDays] = useState<number>(14)

  const probability = resolveCrowdfundProbability(
    fame,
    scenePresence,
    targetAmount
  )

  const onConfirm = () => {
    // The action creator derives the odds and the roll from state.
    startCrowdfund({
      kind,
      flavor,
      tier,
      targetAmount,
      fameStake,
      daysRemaining: days
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assets:crowdfund.setup')}
      className='assets-modal-sheet max-w-lg'
    >
      <div className='flex flex-col gap-3 p-4 font-mono text-sm'>
        <GeneratedImagePanel
          prompt={getCrowdfundImagePrompt(kind, flavor)}
          alt={t(`assets:kind.${kind}`)}
          aspectRatio='16:9'
          sizeHint={{ width: 640, height: 360 }}
        />
        <label
          htmlFor='fameStake'
          className='flex items-center justify-between'
        >
          {t('assets:crowdfund.fameStake', { amount: fameStake })}
          <input
            id='fameStake'
            type='range'
            min={0}
            max={fame}
            value={fameStake}
            onChange={e => setFameStake(Number(e.target.value))}
            aria-valuetext={t('assets:crowdfund.fameStakeAria', {
              amount: fameStake,
              defaultValue: '{{amount}} Fame'
            })}
          />
        </label>
        <label
          htmlFor='crowdfundDays'
          className='flex items-center justify-between'
        >
          {t('assets:crowdfund.days')}: {days}
          <input
            id='crowdfundDays'
            type='range'
            min={3}
            max={30}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            aria-valuetext={t('assets:crowdfund.daysAria', {
              days: days,
              defaultValue: '{{days}} Days'
            })}
          />
        </label>
        <p>
          {t('assets:crowdfund.target')}:{' '}
          {formatCurrency(targetAmount, i18n.language)} ·{' '}
          {t('assets:crowdfund.chance', {
            percent: formatPercent(probability, i18n.language)
          })}
        </p>
        <div className='flex justify-end gap-2'>
          <CancelButton onClick={onClose} />
          <ConfirmButton onClick={onConfirm}>
            {t('assets:crowdfund.setup')}
          </ConfirmButton>
        </div>
      </div>
    </Modal>
  )
}
