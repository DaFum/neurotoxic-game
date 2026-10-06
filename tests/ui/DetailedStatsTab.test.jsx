import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { DetailedStatsTab } from '../../src/ui/bandhq/DetailedStatsTab.tsx'
import { createApplyEventDeltaAction } from '../../src/context/actionCreators'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'
import { createFixedClock } from '../../src/utils/clock'
import { eventEngine } from '../../src/utils/eventEngine'

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

    // Distinct deltas per entry so each rendered value pins its own entry.
    const banterEvents = Array.from({ length: 7 }, (_, i) => ({
      member1: `Left${i}`,
      member2: `Right${i}`,
      delta: i % 2 === 0 ? 10 + i : -(10 + i),
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
    // Only the 5 newest entries are shown, newest first, each with its own
    // signed delta.
    const rows = screen
      .getAllByText(/ ↔ /)
      .map(label => [label.textContent, label.nextElementSibling?.textContent])
    expect(rows).toEqual([
      ['Left6 ↔ Right6', '+16'],
      ['Left5 ↔ Right5', '-15'],
      ['Left4 ↔ Right4', '+14'],
      ['Left3 ↔ Right3', '-13'],
      ['Left2 ↔ Right2', '+12']
    ])
  })

  test('a banter event delta flows through the action creator and reducer into the banter log', () => {
    const initial = createInitialState()
    const [first, second] = initial.band.members
    const delta = eventEngine.applyResult(
      {
        type: 'composite',
        effects: [
          {
            type: 'relationship',
            member1: first.name,
            member2: second.name,
            value: -12,
            source: 'banter'
          }
        ]
      },
      {}
    )

    const action = createApplyEventDeltaAction(
      delta,
      createFixedClock(1_700_000_000_000)
    )
    const next = gameReducer(initial, action)

    expect(next.band.banterEvents).toEqual([
      {
        member1: first.name,
        member2: second.name,
        delta: -12,
        timestamp: 1_700_000_000_000
      }
    ])

    render(
      <DetailedStatsTab
        player={next.player}
        band={next.band}
        social={next.social}
      />
    )
    expect(screen.getByText('Recent Banter')).toBeInTheDocument()
    const label = screen.getByText(`${first.name} ↔ ${second.name}`)
    expect(label.nextElementSibling?.textContent).toBe('-12')
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
