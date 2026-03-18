import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { DetailedStatsTab } from '../src/ui/bandhq/DetailedStatsTab.jsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key
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
        traits: []
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
          traits: [],
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
