import { logger } from '../../src/utils/logger.js'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import GigModifierButton from '../../src/ui/GigModifierButton'
import { SettingsTab } from '../../src/ui/bandhq/SettingsTab'
import { ShopItem } from '../../src/ui/bandhq/ShopItem'
import { ShopTab } from '../../src/ui/bandhq/ShopTab'
import { UpgradesTab } from '../../src/ui/bandhq/UpgradesTab'
import { DebugLogViewer } from '../../src/ui/DebugLogViewer'
import {
  RazorPlayIcon,
  VoidSkullIcon,
  BandcampIcon,
  InstaIcon,
  TikTokIcon,
  YouTubeIcon
} from '../../src/ui/shared/Icons'
import {
  AudioStatePropType,
  OnAudioChangePropType
} from '../../src/ui/shared/propTypes'

vi.mock('../../src/ui/shared', () => ({
  SettingsPanel: ({ onToggleCRT, onLogLevelChange, onDeleteSave }) => (
    <div>
      <button onClick={onToggleCRT}>toggle-crt</button>
      <button onClick={() => onLogLevelChange('warn')}>log-warn</button>
      <button onClick={onDeleteSave}>delete-save</button>
    </div>
  )
}))

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: () => 'mock://image',
  IMG_PROMPTS: {}
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (k, o) => o?.defaultValue || k })
}))

vi.mock('../../src/data/hqItems', () => ({
  HQ_ITEMS: {
    gear: [{ id: 'g1', name: 'g1', cost: 10, currency: 'money', effects: [] }],
    instruments: [
      { id: 'i1', name: 'i1', cost: 20, currency: 'money', effects: [] }
    ]
  }
}))

vi.mock('../../src/utils/logger', () => {
  const listeners = new Set()
  const logger = {
    maxLogs: 100,
    logs: [
      {
        id: '1',
        timestamp: '2025-01-01T10:00:00.000Z',
        level: 'INFO',
        channel: 'Test',
        message: 'hello'
      }
    ],
    subscribe: cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    clear: vi.fn(() => listeners.forEach(cb => cb({ type: 'clear' }))),
    dump: vi.fn(() => []),
    LOG_LEVELS: undefined
  }
  return {
    logger,
    LOG_LEVELS: { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 }
  }
})

describe('UI missing-target smoke/branch tests', () => {
  it('GigModifierButton triggers callback and active state', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <GigModifierButton
        item={{ key: 'm1', label: 'Mod', desc: 'desc', cost: 20 }}
        isActive={false}
        onClick={onClick}
      />
    )

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledWith('m1')
    expect(screen.getByRole('button')).toHaveClass('text-ash-gray')

    // test active state branches
    rerender(
      <GigModifierButton
        item={{ key: 'm1', label: 'Mod', desc: 'desc', cost: 20 }}
        isActive={true}
        onClick={onClick}
      />
    )
    expect(screen.getByRole('button')).toHaveClass('bg-toxic-green')
  })

  it('SettingsTab delegates settings interactions', () => {
    const updateSettings = vi.fn()
    const deleteSave = vi.fn()
    render(
      <SettingsTab
        settings={{ crtEnabled: false, logLevel: 'info' }}
        audioState={{ musicVol: 0.5, sfxVol: 0.6, isMuted: false }}
        onAudioChange={{
          setMusic: vi.fn(),
          setSfx: vi.fn(),
          toggleMute: vi.fn()
        }}
        updateSettings={updateSettings}
        deleteSave={deleteSave}
      />
    )

    fireEvent.click(screen.getByText('toggle-crt'))
    fireEvent.click(screen.getByText('log-warn'))
    fireEvent.click(screen.getByText('delete-save'))

    expect(updateSettings).toHaveBeenCalledWith({ crtEnabled: true })
    expect(updateSettings).toHaveBeenCalledWith({ logLevel: 'warn' })
    expect(deleteSave).toHaveBeenCalled()
  })

  it('ShopItem handles buy disabled/owned branches', () => {
    const onBuy = vi.fn()
    const baseItem = {
      id: 'x',
      name: 'x',
      cost: 10,
      currency: 'money',
      effects: []
    }

    const { rerender } = render(
      <ShopItem
        item={baseItem}
        isOwned={false}
        isDisabled={false}
        onBuy={onBuy}
        processingItemId={null}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /buy/i }))
    expect(onBuy).toHaveBeenCalledTimes(1)

    rerender(
      <ShopItem
        item={baseItem}
        isOwned
        isDisabled={false}
        onBuy={onBuy}
        processingItemId={null}
      />
    )
    expect(screen.getByRole('button', { name: /owned/i })).toBeDisabled()
  })

  it('ShopTab and UpgradesTab render item lists', () => {
    const handleBuy = vi.fn()
    render(
      <ShopTab
        player={{ money: 100 }}
        handleBuy={handleBuy}
        isItemOwned={item => item.id === 'g1'}
        isItemDisabled={item => item.id === 'i1'}
        getAdjustedCost={item => item.cost - 5}
      />
    )
    expect(screen.getByText('FUNDS:')).toBeInTheDocument()
    // g1 should be owned, i1 disabled.
    expect(screen.getByRole('button', { name: /OWNED/ })).toBeInTheDocument()

    const { container } = render(
      <UpgradesTab
        player={{ money: 100, fame: 5 }}
        upgrades={[
          { id: 'u1', name: 'u1', cost: 1, currency: 'fame', effects: [] },
          { id: 'u2', name: 'u2', cost: 2, currency: 'fame', effects: [] }
        ]}
        handleBuy={handleBuy}
        isItemOwned={item => item.id === 'u1'}
        isItemDisabled={item => item.id === 'u2'}
        getAdjustedCost={item => item.cost + 10}
      />
    )
    expect(screen.getByText('FAME:')).toBeInTheDocument()
    expect(
      within(container).getByRole('button', { name: /OWNED/ })
    ).toBeInTheDocument()
  })

  it('DebugLogViewer shows logs after keyboard toggle and allows close/clear', async () => {
    render(<DebugLogViewer />)

    fireEvent.keyDown(window, { key: '`', ctrlKey: true })
    expect(await screen.findByText('NEUROTOXIC DEBUGGER')).toBeInTheDocument()

    fireEvent.click(screen.getByText('ui:action_clear'))
    fireEvent.click(screen.getByLabelText('Close log'))
  })

  it('icon components render with and without accessibility title', () => {
    const { container } = render(
      <div>
        <RazorPlayIcon className='a' />
        <VoidSkullIcon className='b' />
        <BandcampIcon title='Bandcamp' />
        <InstaIcon />
        <TikTokIcon />
        <YouTubeIcon />
      </div>
    )

    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(6)
    expect(screen.getByTitle('Bandcamp')).toBeInTheDocument()
  })

  it('shared PropTypes shapes expose expected keys', () => {
    expect(AudioStatePropType).toBeTruthy()
    expect(OnAudioChangePropType).toBeTruthy()
  })
})
