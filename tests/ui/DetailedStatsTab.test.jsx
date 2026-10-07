import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { DetailedStatsTab } from '../../src/ui/bandhq/DetailedStatsTab.tsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

describe('DetailedStatsTab', () => {
  const mockPlayer = {
    fame: 100,
    fameLevel: 1,
    money: 500,
    activeEffects: [],
    socialTrends: { trendFactor: 1.2 },
    hqUpgrades: []
  }
  const mockBand = {
    members: [
      {
        id: '1',
        name: 'Member 1',
        role: 'Vocalist',
        skill: 50,
        stamina: 100,
        maxStamina: 100,
        mood: 100,
        traits: {}
      }
    ],
    equipment: {}
  }
  const mockSocial = {
    instagram: 100,
    tiktok: 200,
    youtube: 300,
    newsletter: 400
  }

  test('renders base stats correctly', () => {
    render(
      <DetailedStatsTab
        player={mockPlayer}
        band={mockBand}
        social={mockSocial}
      />
    )

    expect(screen.getByText('BAND MEMBERS')).toBeInTheDocument()
    expect(screen.getByText('Member 1')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument() // Total social reach
  })

  test('renders Inventory & Equipment section when empty', () => {
    render(
      <DetailedStatsTab
        player={mockPlayer}
        band={mockBand}
        social={mockSocial}
      />
    )
    expect(screen.getByText('Inventory & Equipment')).toBeInTheDocument()
    expect(screen.getByText('Standard Gear')).toBeInTheDocument()
  })

  test('lists the most recent banter outcomes, newest first, only when present', () => {
    const { rerender } = render(
      <DetailedStatsTab
        player={mockPlayer}
        band={mockBand}
        social={mockSocial}
      />
    )
    expect(screen.queryByText('Recent Banter')).not.toBeInTheDocument()

    const banterEvents = Array.from({ length: 7 }, (_, i) => ({
      member1: `Left${i}`,
      member2: `Right${i}`,
      delta: i % 2 === 0 ? 10 : -15,
      timestamp: 1000 + i
    }))
    rerender(
      <DetailedStatsTab
        player={mockPlayer}
        band={{ ...mockBand, banterEvents }}
        social={mockSocial}
      />
    )

    expect(screen.getByText('Recent Banter')).toBeInTheDocument()
    // Only the 5 newest entries are shown, newest first.
    expect(screen.getByText('Left6 ↔ Right6')).toBeInTheDocument()
    expect(screen.getByText('Left2 ↔ Right2')).toBeInTheDocument()
    expect(screen.queryByText('Left1 ↔ Right1')).not.toBeInTheDocument()
    expect(screen.getAllByText('+10').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/-15/).length).toBeGreaterThan(0)
  })

  test('renders Member equipment correctly', () => {
    const bandWithEquipment = {
      ...mockBand,
      members: [
        {
          id: '1',
          name: 'Member 1',
          role: 'Vocalist',
          skill: 50,
          stamina: 100,
          maxStamina: 100,
          mood: 100,
          traits: {},
          equipment: { mic: 'Golden Mic' }
        }
      ]
    }
    render(
      <DetailedStatsTab
        player={mockPlayer}
        band={bandWithEquipment}
        social={mockSocial}
      />
    )
    expect(screen.getByText('Inventory & Equipment')).toBeInTheDocument()
    expect(screen.getByText('mic:')).toBeInTheDocument()
    expect(screen.getByText('Golden Mic')).toBeInTheDocument()
  })
})
