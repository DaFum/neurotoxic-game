import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../../context/GameState'
import { Tooltip } from '../../ui/shared'
import type {
  AssetKind,
  AssetSectionShortLabel,
  LongTermAsset
} from '../../types/assets'
import { AssetSectionDeck } from './AssetSectionDeck'
import { ChassisAcquisitionModal } from './ChassisAcquisitionModal'
import { CrowdfundCampaignCard } from './CrowdfundCampaignCard'
import { LiabilitiesPanel } from './LiabilitiesPanel'
import { ModulePickerModal } from './ModulePickerModal'
import { RepairConfirmModal } from './RepairConfirmModal'
import { SellConfirmModal } from './SellConfirmModal'
import { UpgradeConfirmModal } from './UpgradeConfirmModal'

/**
 * Maps primary asset categories to their abbreviated short-string identifiers.
 *
 * @remarks
 * These labels match the keys used in the translation namespace to fetch section descriptions
 * dynamically (e.g., `assets:section.tourbus.description`).
 */
const SECTION_LABELS = {
  tourbus_chassis: 'tourbus',
  studio_chassis: 'studio',
  bandhaus_chassis: 'bandhaus',
  merch_workshop_chassis: 'workshop'
} as const satisfies Record<AssetKind, AssetSectionShortLabel>

/**
 * Defines the configuration properties for the AssetSectionPanel component.
 */
interface AssetSectionPanelProps {
  /** The top-level category of assets to display in this panel. */
  kind: AssetKind
  /** A render prop function that constructs the visual hero element for a specific asset. */
  renderHero: (
    asset: LongTermAsset,
    onSlotClick: (slotId: string) => void
  ) => ReactNode
}

/**
 * The single dialog the section panel may show at a time.
 *
 * @remarks
 * Asset-bound dialogs keep the asset as it was when the dialog opened, so an
 * open confirm modal is not re-rendered or unmounted by later state changes.
 */
type SectionDialog =
  | { kind: 'acquire' }
  | { kind: 'picker'; asset: LongTermAsset; slotId: string }
  | { kind: 'repair'; asset: LongTermAsset }
  | { kind: 'upgrade'; asset: LongTermAsset }
  | { kind: 'sell'; asset: LongTermAsset }

/**
 * Provides the shared structural shell for rendering a specific long-term asset section.
 *
 * @remarks
 * This component acts as the parent container for a given asset category. It manages
 * the core acquisition logic when no assets exist, renders child decks for active assets,
 * and hosts the financial liability overview (loans and crowdfunds) specific to this category.
 *
 * @param props - The component properties.
 * @returns The rendered composite panel containing asset actions, decks, and financial trackers.
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
  const [dialog, setDialog] = useState<SectionDialog | null>(null)
  const closeDialog = () => setDialog(null)
  const acquisitionBlocked =
    sectionAssets.length > 0 || sectionCampaigns.length > 0
  const acquireButton = (
    <button
      type='button'
      onClick={() => setDialog({ kind: 'acquire' })}
      disabled={acquisitionBlocked}
      className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--section-accent,var(--color-toxic-green))] focus-visible:ring-offset-2 focus-visible:ring-offset-void-black assets-hub-control assets-hub-primary-button mt-3 min-h-11 border-2 px-4 py-2 text-xs uppercase disabled:opacity-40'
      style={{
        borderColor: 'var(--section-accent, var(--color-toxic-green))',
        background: 'var(--section-accent, var(--color-toxic-green))',
        color: 'var(--color-void-black)'
      }}
    >
      {t('assets:hub.actions.acquire')}
    </button>
  )

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
              {acquireButton}
            </Tooltip>
          ) : (
            acquireButton
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
            hero={renderHero(asset, slotId =>
              setDialog({ kind: 'picker', asset, slotId })
            )}
            onSlotClick={slotId => setDialog({ kind: 'picker', asset, slotId })}
            onRepair={() => setDialog({ kind: 'repair', asset })}
            onUpgrade={() => setDialog({ kind: 'upgrade', asset })}
            onSell={() => setDialog({ kind: 'sell', asset })}
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
        isOpen={dialog?.kind === 'acquire'}
        onClose={closeDialog}
      />
      {dialog?.kind === 'picker' && (
        <ModulePickerModal
          asset={dialog.asset}
          slotId={dialog.slotId}
          isOpen
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'repair' && (
        <RepairConfirmModal asset={dialog.asset} isOpen onClose={closeDialog} />
      )}
      {dialog?.kind === 'upgrade' && (
        <UpgradeConfirmModal
          asset={dialog.asset}
          isOpen
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'sell' && (
        <SellConfirmModal asset={dialog.asset} isOpen onClose={closeDialog} />
      )}
    </div>
  )
}
