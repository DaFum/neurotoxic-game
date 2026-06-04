import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { Tooltip } from '../../ui/shared'
import type { AssetKind, LongTermAsset } from '../../types/assets'
import { AssetSectionDeck } from './AssetSectionDeck'
import { ChassisAcquisitionModal } from './ChassisAcquisitionModal'
import { CrowdfundCampaignCard } from './CrowdfundCampaignCard'
import { LiabilitiesPanel } from './LiabilitiesPanel'
import { ModulePickerModal } from './ModulePickerModal'
import { RepairConfirmModal } from './RepairConfirmModal'
import { SellConfirmModal } from './SellConfirmModal'
import { UpgradeConfirmModal } from './UpgradeConfirmModal'

const SECTION_LABELS = {
  tourbus_chassis: 'tourbus',
  studio_chassis: 'studio',
  bandhaus_chassis: 'bandhaus',
  merch_workshop_chassis: 'workshop'
} as const satisfies Record<
  AssetKind,
  'tourbus' | 'studio' | 'bandhaus' | 'workshop'
>

interface AssetSectionPanelProps {
  kind: AssetKind
  renderHero: (
    asset: LongTermAsset,
    onSlotClick: (slotId: string) => void
  ) => ReactNode
}

/**
 * Renders the Asset Section Panel.
 * @param props - Asset kind and hero renderer for the shared asset-section shell.
 */
export const AssetSectionPanel = ({
  kind,
  renderHero
}: AssetSectionPanelProps) => {
  const { t } = useTranslation(['assets'])
  const assets = useGameSelector(state => state.assets)
  const campaigns = useGameSelector(state => state.crowdfundCampaigns)
  const sectionAssets = useMemo(
    () => assets.filter(asset => asset.kind === kind),
    [assets, kind]
  )
  const sectionCampaigns = useMemo(
    () => campaigns.filter(campaign => campaign.assetSpec.kind === kind),
    [campaigns, kind]
  )
  const [picker, setPicker] = useState<{
    asset: LongTermAsset
    slotId: string
  } | null>(null)
  const [repairAsset, setRepairAsset] = useState<LongTermAsset | null>(null)
  const [upgradeAsset, setUpgradeAsset] = useState<LongTermAsset | null>(null)
  const [sellAsset, setSellAsset] = useState<LongTermAsset | null>(null)
  const [acquireOpen, setAcquireOpen] = useState(false)
  const acquisitionBlocked =
    sectionAssets.length > 0 || sectionCampaigns.length > 0

  return (
    <div className='flex flex-col gap-4 pb-24 sm:pb-4'>
      {sectionAssets.length === 0 ? (
        <section className='assets-hub-panel assets-hub-reveal p-3'>
          <h2 className='assets-hub-title text-2xl uppercase'>
            {t(`assets:kind.${kind}`)}
          </h2>
          <p className='assets-hub-control mt-1 text-sm opacity-70'>
            {t(`assets:section.${SECTION_LABELS[kind]}.description`)}
          </p>
          {acquisitionBlocked ? (
            <Tooltip
              content={t('assets:purchaseFailed.acquisition_already_active')}
            >
              <button
                type='button'
                disabled={true}
                className='assets-hub-control mt-3 min-h-11 border-2 px-4 py-2 text-xs uppercase disabled:opacity-40'
                style={{
                  borderColor:
                    'var(--section-accent, var(--color-toxic-green))',
                  background: 'var(--section-accent, var(--color-toxic-green))',
                  color: 'var(--color-void-black)'
                }}
              >
                {t('assets:hub.actions.acquire')}
              </button>
            </Tooltip>
          ) : (
            <button
              type='button'
              onClick={() => setAcquireOpen(true)}
              disabled={false}
              className='assets-hub-control mt-3 min-h-11 border-2 px-4 py-2 text-xs uppercase disabled:opacity-40'
              style={{
                borderColor: 'var(--section-accent, var(--color-toxic-green))',
                background: 'var(--section-accent, var(--color-toxic-green))',
                color: 'var(--color-void-black)'
              }}
            >
              {t('assets:hub.actions.acquire')}
            </button>
          )}
          {acquisitionBlocked && (
            <p
              className='assets-hub-control mt-2 text-xs'
              style={{ color: 'var(--color-warning-yellow)' }}
            >
              {t('assets:purchaseFailed.acquisition_already_active')}
            </p>
          )}
        </section>
      ) : (
        sectionAssets.map(asset => (
          <AssetSectionDeck
            key={asset.id}
            asset={asset}
            hero={renderHero(asset, slotId => setPicker({ asset, slotId }))}
            onSlotClick={slotId => setPicker({ asset, slotId })}
            onRepair={() => setRepairAsset(asset)}
            onUpgrade={() => setUpgradeAsset(asset)}
            onSell={() => setSellAsset(asset)}
          />
        ))
      )}

      <section className='assets-hub-panel assets-hub-reveal p-3'>
        <h3 className='assets-hub-title text-lg uppercase'>
          {t('assets:hub.finance.title')}
        </h3>
        <div className='mt-2 flex flex-col gap-2'>
          <LiabilitiesPanel />
          {sectionCampaigns.length === 0 ? (
            <p className='assets-hub-control text-xs opacity-60'>
              {t('assets:hub.finance.noCampaigns')}
            </p>
          ) : (
            sectionCampaigns.map(campaign => (
              <CrowdfundCampaignCard key={campaign.id} campaign={campaign} />
            ))
          )}
        </div>
      </section>

      <ChassisAcquisitionModal
        kind={kind}
        isOpen={acquireOpen}
        onClose={() => setAcquireOpen(false)}
      />
      {picker && (
        <ModulePickerModal
          asset={picker.asset}
          slotId={picker.slotId}
          isOpen
          onClose={() => setPicker(null)}
        />
      )}
      {repairAsset && (
        <RepairConfirmModal
          asset={repairAsset}
          isOpen
          onClose={() => setRepairAsset(null)}
        />
      )}
      {upgradeAsset && (
        <UpgradeConfirmModal
          asset={upgradeAsset}
          isOpen
          onClose={() => setUpgradeAsset(null)}
        />
      )}
      {sellAsset && (
        <SellConfirmModal
          asset={sellAsset}
          isOpen
          onClose={() => setSellAsset(null)}
        />
      )}
    </div>
  )
}
