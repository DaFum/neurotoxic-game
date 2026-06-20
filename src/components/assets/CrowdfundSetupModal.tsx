import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../ui/shared/Modal'
import { CancelButton } from './shared/CancelButton'
import { ConfirmButton } from './shared/ConfirmButton'
import { GeneratedImagePanel } from '../../ui/shared/GeneratedImagePanel'
import { getCrowdfundImagePrompt } from '../../utils/imageGen'
import { formatCurrency } from '../../utils/numberUtils'
import { resolveCrowdfundProbability } from '../../utils/assetTicks'
import { mulberry32 } from '../../utils/seededRng'
import { useGameActions, useGameSelector } from '../../context/GameState'
import type { AssetFlavor, AssetKind, ChassisTier } from '../../types/assets'

interface Props {
  kind: AssetKind
  flavor: AssetFlavor
  tier: ChassisTier
  targetAmount: number
  isOpen: boolean
  onClose: () => void
}

/**
 * Crowdfund campaign setup: player picks a fameStake, sees the live success
 * probability preview (computed via resolveCrowdfundProbability so the UI
 * stays aligned with the tick reducer), and confirms.
 *
 * The plannedSuccessRoll is drawn from a one-shot mulberry32 seeded with the
 * current state.rngSeed XOR'd with a constant — the goal is determinism
 * across re-renders within a single session, NOT cryptographic
 * unpredictability.
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
  const rngSeed = useGameSelector(s => s.rngSeed)

  const [fameStake, setFameStake] = useState<number>(Math.min(20, fame))
  const [days, setDays] = useState<number>(14)

  const probability = resolveCrowdfundProbability(
    fame,
    scenePresence,
    targetAmount
  )

  const onConfirm = () => {
    // mulberry32 seeded with rngSeed^fameStake gives a per-campaign deterministic
    // roll that survives re-renders inside this modal.
    const roll = mulberry32(rngSeed ^ fameStake ^ days)()
    startCrowdfund({
      kind,
      flavor,
      tier,
      targetAmount,
      fameStake,
      daysRemaining: days,
      plannedSuccessRoll: roll,
      plannedSuccessProbability: probability
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
        <label className='flex items-center justify-between'>
          {t('assets:crowdfund.fameStake', { amount: fameStake })}
          <input
            type='range'
            min={0}
            max={fame}
            value={fameStake}
            onChange={e => setFameStake(Number(e.target.value))}
          />
        </label>
        <label className='flex items-center justify-between'>
          {t('assets:crowdfund.days')}: {days}
          <input
            type='range'
            min={3}
            max={30}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
          />
        </label>
        <p>
          {t('assets:crowdfund.target')}:{' '}
          {formatCurrency(targetAmount, i18n.language)} ·{' '}
          {(probability * 100).toFixed(0)}
          {t('assets:crowdfund.chance')}
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
