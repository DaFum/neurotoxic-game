import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AssetSectionPanel } from '../../src/components/assets/AssetSectionPanel'
import type { CrowdfundCampaign, LongTermAsset } from '../../src/types/assets'

const mockState = vi.hoisted(() => ({
  assets: [] as LongTermAsset[],
  crowdfundCampaigns: [] as CrowdfundCampaign[]
}))

const tourbus: LongTermAsset = {
  id: 'asset-1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 80,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  slots: []
}

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (state: typeof mockState) => unknown) =>,
  useGameSelectorOptional: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState)
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key })
}))

vi.mock('../../src/components/assets/AssetSectionDeck', () => ({
  AssetSectionDeck: ({
    asset,
    hero,
    onSlotClick,
    onRepair,
    onUpgrade,
    onSell
  }: {
    asset: LongTermAsset
    hero: ReactNode
    onSlotClick: (slotId: string) => void
    onRepair: () => void
    onUpgrade: () => void
    onSell: () => void
  }) => (
    <article data-testid={`deck-${asset.id}`}>
      <div className='asset-hero-frame'>{hero}</div>
      <div>
        <button type='button' onClick={onRepair}>
          repair
        </button>
        <button type='button' onClick={onUpgrade}>
          upgrade
        </button>
        <button type='button' onClick={onSell}>
          sell
        </button>
        <button type='button' onClick={() => onSlotClick('slot-list')}>
          slot list
        </button>
      </div>
    </article>
  )
}))

vi.mock('../../src/components/assets/LiabilitiesPanel', () => ({
  LiabilitiesPanel: () => <div data-testid='liabilities' />
}))

vi.mock('../../src/components/assets/CrowdfundCampaignCard', () => ({
  CrowdfundCampaignCard: () => <div data-testid='campaign' />
}))

vi.mock('../../src/components/assets/ChassisAcquisitionModal', () => ({
  ChassisAcquisitionModal: ({
    isOpen,
    onClose
  }: {
    isOpen: boolean
    onClose: () => void
  }) => (
    <div data-testid='acquire-modal' data-open={String(isOpen)}>
      <button type='button' onClick={onClose}>
        close acquire
      </button>
    </div>
  )
}))

type AssetModalProps = {
  asset: LongTermAsset
  slotId?: string
  onClose: () => void
}

const { makeAssetModal } = vi.hoisted(() => ({
  makeAssetModal:
    (name: string) =>
    ({ asset, slotId, onClose }: AssetModalProps) => (
      <div role='dialog' aria-label={name} data-asset={asset.id}>
        {slotId && <span data-testid='picker-slot'>{slotId}</span>}
        <button type='button' onClick={onClose}>
          close {name}
        </button>
      </div>
    )
}))

vi.mock('../../src/components/assets/ModulePickerModal', () => ({
  ModulePickerModal: makeAssetModal('picker')
}))
vi.mock('../../src/components/assets/RepairConfirmModal', () => ({
  RepairConfirmModal: makeAssetModal('repair')
}))
vi.mock('../../src/components/assets/UpgradeConfirmModal', () => ({
  UpgradeConfirmModal: makeAssetModal('upgrade')
}))
vi.mock('../../src/components/assets/SellConfirmModal', () => ({
  SellConfirmModal: makeAssetModal('sell')
}))

const renderPanel = () =>
  render(
    <AssetSectionPanel
      kind='tourbus_chassis'
      renderHero={(asset, onSlotClick) => (
        <button type='button' onClick={() => onSlotClick('slot-hero')}>
          hero slot {asset.id}
        </button>
      )}
    />
  )

describe('AssetSectionPanel dialogs', () => {
  beforeEach(() => {
    mockState.assets = []
    mockState.crowdfundCampaigns = []
  })

  it('opens and closes the acquisition modal from the acquire button', () => {
    renderPanel()
    const modal = screen.getByTestId('acquire-modal')
    expect(modal).toHaveAttribute('data-open', 'false')

    const acquire = screen.getByRole('button', {
      name: 'assets:hub.actions.acquire'
    })
    expect(acquire).toBeEnabled()
    fireEvent.click(acquire)
    expect(modal).toHaveAttribute('data-open', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'close acquire' }))
    expect(modal).toHaveAttribute('data-open', 'false')
  })

  it.each(['repair', 'upgrade', 'sell'])(
    'opens only the %s dialog for the clicked asset and clears it on close',
    action => {
      mockState.assets = [tourbus]
      renderPanel()
      expect(screen.queryByRole('dialog')).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: action }))
      const dialogs = screen.getAllByRole('dialog')
      expect(dialogs).toHaveLength(1)
      expect(dialogs[0]).toHaveAccessibleName(action)
      expect(dialogs[0]).toHaveAttribute('data-asset', 'asset-1')
      expect(screen.getByTestId('acquire-modal')).toHaveAttribute(
        'data-open',
        'false'
      )

      fireEvent.click(screen.getByRole('button', { name: `close ${action}` }))
      expect(screen.queryByRole('dialog')).toBeNull()
    }
  )

  it.each([
    ['hero slot asset-1', 'slot-hero'],
    ['slot list', 'slot-list']
  ])(
    'opens the module picker with the slot from "%s"',
    (buttonName, slotId) => {
      mockState.assets = [tourbus]
      renderPanel()

      fireEvent.click(screen.getByRole('button', { name: buttonName }))
      expect(screen.getByRole('dialog', { name: 'picker' })).toHaveAttribute(
        'data-asset',
        'asset-1'
      )
      expect(screen.getByTestId('picker-slot')).toHaveTextContent(slotId)

      fireEvent.click(screen.getByRole('button', { name: 'close picker' }))
      expect(screen.queryByRole('dialog')).toBeNull()
    }
  )

  it('disables the acquire button while a section campaign is pending', () => {
    mockState.crowdfundCampaigns = [
      {
        id: 'camp_1',
        assetSpec: { kind: 'tourbus_chassis', flavor: 'legit', chassisTier: 1 },
        targetAmount: 4000,
        fameStake: 20,
        daysRemaining: 14,
        plannedSuccessRoll: 0.4,
        plannedSuccessProbability: 0.5,
        materializedAssetId: 'campaign_asset',
        materializedSlotIds: []
      }
    ]
    renderPanel()

    const acquire = screen.getByRole('button', {
      name: 'assets:hub.actions.acquire'
    })
    expect(acquire).toBeDisabled()
    fireEvent.click(acquire)
    expect(screen.getByTestId('acquire-modal')).toHaveAttribute(
      'data-open',
      'false'
    )
  })
})
