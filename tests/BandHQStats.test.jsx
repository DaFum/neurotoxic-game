import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import { cleanup, render } from '@testing-library/react'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (
        key === 'ui:detailedStats.vanUpgrades.installed' ||
        key === 'ui:detailedStats.hqUpgrades.installed'
      ) {
        return `${options.count} Installed`
      }
      return key
    },
    i18n: {
      changeLanguage: () => new Promise(() => {})
    }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  }
}))

vi.mock('../src/ui/shared/index.jsx', () => ({
  StatBox: ({ label, value }) => (
    <div data-testid='stat-box'>
      <span data-testid='stat-label'>{label}</span>
      <span data-testid='stat-value'>{value}</span>
    </div>
  ),
  ProgressBar: () => <div data-testid='progress-bar' />,
  Panel: ({ title, children }) => (
    <div data-testid='panel'>
      <div data-testid='panel-title'>{title}</div>
      {children}
    </div>
  ),
  Tooltip: ({ children }) => <div data-testid='tooltip'>{children}</div>,
  SettingsPanel: () => <div />,
  VolumeSlider: () => <div />,
  Modal: () => <div />,
  ActionButton: () => <button type='button' />
}))

vi.mock('../src/data/characters.js', () => ({
  CHARACTERS: {
    AXEL: { name: 'Axel', traits: [] },
    FREDDIE: { name: 'Freddie', traits: [] }
  }
}))

describe('BandHQ Stats Discrepancy', () => {
  let StatsTab
  let DetailedStatsTab

  const parseLocalizedNumber = value => {
    if (!value) return Number.NaN

    const normalizedValue = value
      .replace(/[\u00A0\s]/g, '')
      .replace(/(\d)[,.](?=\d{3}(\D|$))/g, '$1')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')

    return Number.parseFloat(normalizedValue)
  }

  beforeAll(async () => {
    const statsModule = await import('../src/ui/bandhq/StatsTab.jsx')
    const detailsModule = await import('../src/ui/bandhq/DetailedStatsTab.jsx')
    StatsTab = statsModule.StatsTab
    DetailedStatsTab = detailsModule.DetailedStatsTab
  })

  afterEach(() => {
    cleanup()
  })

  test('StatsTab and DetailedStatsTab follower counts match', () => {
    const props = {
      player: {
        money: 1000,
        fame: 500,
        day: 10,
        van: { fuel: 80, condition: 90, breakdownChance: 0.1 }
      },
      band: {
        members: [{ name: 'Axel', stamina: 100, mood: 100 }],
        inventorySlots: 5,
        harmony: 80
      },
      social: {
        instagram: 1000,
        tiktok: 2000,
        youtube: 500,
        newsletter: 100
      }
    }

    const expectedReach = 3600

    const { getAllByTestId, getByText, unmount } = render(
      <StatsTab {...props} />
    )
    const statBoxes = getAllByTestId('stat-box')
    const followersBox = statBoxes.find(
      box =>
        box.querySelector('[data-testid="stat-label"]').textContent ===
        'ui:stats.followers'
    )

    expect(followersBox).toBeTruthy()
    const statsTabValue = parseLocalizedNumber(
      followersBox.querySelector('[data-testid="stat-value"]').textContent
    )

    unmount()

    const { container } = render(<DetailedStatsTab {...props} />)
    const totalReachLabel = getByText('ui:stats.totalReach')
    const detailRow = totalReachLabel.closest('.flex')

    expect(detailRow).toBeTruthy()
    const detailedStatsTabValue = parseLocalizedNumber(
      detailRow.querySelector('.text-right > div:first-child').textContent
    )

    expect(statsTabValue).toBe(expectedReach)
    expect(detailedStatsTabValue).toBe(expectedReach)
    expect(statsTabValue).toBe(detailedStatsTabValue)
    expect(container.textContent).toContain('ui:stats.totalReach')
  })
})
