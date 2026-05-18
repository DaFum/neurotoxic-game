import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DetailedStatsTab } from '../../../src/ui/bandhq/DetailedStatsTab.tsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'economy:brandDeals.energy_drink_cx.description':
          'Das grüne Zeug, das leuchtet. Sie wollen, dass ihr es auf der Bühne trinkt.',
        'economy:brandDeals.energy_drink_cx.name': 'Toxischer Energy-Drink',
        'events:quest_sponsor_demand.label': 'Bizarre Forderung des Sponsors',
        'ui:stats.active_quests': 'Aktive Quests',
        'ui:ui.day': 'Tag'
      }
      return translations[key] ?? options?.defaultValue ?? key
    }
  })
}))

const player = {
  money: 100,
  fame: 50,
  fameLevel: 1,
  day: 4,
  location: 'berlin',
  van: { fuel: 40, condition: 80, upgrades: [] },
  stats: {}
}

const band = {
  harmony: 60,
  members: [],
  inventory: {}
}

const social = {
  instagram: 0,
  tiktok: 0,
  youtube: 0,
  newsletter: 0,
  controversyLevel: 0,
  loyalty: 0,
  viral: 0
}

describe('DetailedStatsTab', () => {
  it('translates event namespace quest labels in Band HQ details', () => {
    render(
      <DetailedStatsTab
        player={player}
        band={band}
        social={social}
        activeQuests={[
          {
            id: 'quest_sponsor_demand',
            label: 'events:quest_sponsor_demand.label',
            progress: 0,
            required: 2,
            deadline: 10
          }
        ]}
      />
    )

    expect(
      screen.getByText('Bizarre Forderung des Sponsors')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('events:quest_sponsor_demand.label')
    ).not.toBeInTheDocument()
  })

  it('translates active brand deal names and descriptions', () => {
    render(
      <DetailedStatsTab
        player={player}
        band={band}
        social={{
          ...social,
          activeDeals: [{ id: 'energy_drink_cx', remainingGigs: 3 }]
        }}
      />
    )

    expect(screen.getByText('Toxischer Energy-Drink')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Das grüne Zeug, das leuchtet. Sie wollen, dass ihr es auf der Bühne trinkt.'
      )
    ).toBeInTheDocument()
  })
})
