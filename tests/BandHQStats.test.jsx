import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { render, cleanup } from '@testing-library/react'


// Mock shared UI components
vi.mock('../src/ui/shared/index.jsx', () => ({
    StatBox: ({ label, value }) => (
      <div data-testid="stat-box">
        <span data-testid="stat-label">{label}</span>
        <span data-testid="stat-value">{value}</span>
      </div>
    ),
    ProgressBar: () => <div data-testid="progress-bar" />,
    Panel: ({ title, children }) => (
      <div data-testid="panel">
        <div data-testid="panel-title">{title}</div>
        {children}
      </div>
    ),
    Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
    SettingsPanel: () => <div />,
    VolumeSlider: () => <div />,
    Modal: () => <div />,
    ActionButton: () => <button />
  }))
// Mock CHARACTERS data
vi.mock('../src/data/characters.js', () => ({
    CHARACTERS: {
      AXEL: { name: 'Axel', traits: [] },
      FREDDIE: { name: 'Freddie', traits: [] }
    }
  }))
describe('BandHQ Stats Discrepancy', () => {
  let StatsTab
  let DetailedStatsTab

  beforeAll(async () => {
    //  removed (handled by vitest env)
    // Dynamic imports to ensure mocks are applied
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

    const totalFollowers = 1000 + 2000 + 500 + 100 // 3600

    // Render StatsTab
    const { getByTestId, getAllByTestId } = render(<StatsTab {...props} />)

    // Find the StatBox for Followers in StatsTab
    const statBoxes = getAllByTestId('stat-box')
    const followersBox = statBoxes.find(box =>
      box.querySelector('[data-testid="stat-label"]').textContent === 'Followers'
    )

    expect(followersBox).toBeTruthy()
    const statsTabValue = parseInt(followersBox.querySelector('[data-testid="stat-value"]').textContent)

    // Render DetailedStatsTab
    const { getByText } = render(<DetailedStatsTab {...props} />)

    // DetailedStatsTab uses DetailRow which renders label and value.
    // "Total Reach" is the label we are looking for.
    // The value is rendered in a div next to it.
    // Since we didn't mock DetailRow (it's internal), we need to find it in the DOM.
    // DetailRow structure:
    // <div ...>
    //   <span>Total Reach</span>
    //   <div>
    //     <div>3600</div>
    //   </div>
    // </div>

    // Helper to find value by label text
    const findValueByLabel = (labelText) => {
      const labelElement = getByText(labelText)
      // The value is in the next sibling's child (based on DetailRow structure in DetailedStatsTab.jsx)
      // Structure: span(label) -> div(wrapper) -> div(value)
      const row = labelElement.closest('.flex') // DetailRow has flex class
      const valueDiv = row.querySelector('.text-right > div:first-child')
      return parseInt(valueDiv.textContent)
    }

    const detailedStatsTabValue = findValueByLabel('Total Reach')

    // Assertion for the fix: StatsTab should now sum all followers (3600)
    // DetailedStatsTab sums all (3600)

    // Check if the fix works
    expect(statsTabValue).toBe(3600)
    expect(detailedStatsTabValue).toBe(3600)

    expect(statsTabValue).toBe(detailedStatsTabValue)
  })
})
