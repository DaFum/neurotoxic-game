import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { DetailedStatsTab } from '../../../src/ui/bandhq/DetailedStatsTab.tsx'
import { sanitizeBand } from '../../../src/context/reducers/sanitizers/stateSanitizers'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'economy:brandDeals.energy_drink_cx.description':
          'Das grüne Zeug, das leuchtet. Sie wollen, dass ihr es auf der Bühne trinkt.',
        'economy:brandDeals.energy_drink_cx.name': 'Toxischer Energy-Drink',
        'events:quest_sponsor_demand.label': 'Bizarre Forderung des Sponsors',
        'items:strings.name': 'Guitar Strings',
        'ui:detailedStats.useInventoryItem': 'Use',
        'ui:stats.active_quests': 'Aktive Quests',
        'ui:ui.day': 'Tag'
      }
      const template = translations[key] ?? options?.defaultValue ?? key
      return template.replace(/\{\{(\w+)\}\}/g, (_m, name) =>
        String(options?.[name] ?? '')
      )
    },
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
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

  it('calls the inventory consume action for usable gear', () => {
    const onConsumeItem = vi.fn()
    render(
      <DetailedStatsTab
        player={player}
        band={{ ...band, inventory: { strings: true } }}
        social={social}
        onConsumeItem={onConsumeItem}
      />
    )

    expect(screen.queryByText('OWNED')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use Guitar Strings' }))

    expect(onConsumeItem).toHaveBeenCalledWith('strings')
  })

  it('shows a graft trait loaded from a legacy save as active', () => {
    const legacySave = {
      ...band,
      members: [
        {
          id: 'matze',
          name: 'Matze',
          traits: {
            // Pre-registration graft fallback: wrong key names, no unlockHint.
            neuro_overclock: {
              id: 'neuro_overclock',
              name: 'traits:neuro_overclock.name',
              description: 'traits:neuro_overclock.description'
            }
          }
        }
      ]
    }

    render(
      <DetailedStatsTab
        player={player}
        band={sanitizeBand(legacySave)}
        social={social}
      />
    )

    const trait = screen.getByRole('button', {
      name: /traits:neuroOverclock\.name/
    })
    expect(trait).toHaveTextContent('Active')
  })

  it('does not expose consume controls for passive owned gear', () => {
    render(
      <DetailedStatsTab
        player={player}
        band={{ ...band, inventory: { golden_pick: true } }}
        social={social}
        onConsumeItem={vi.fn()}
      />
    )

    expect(
      screen.queryByRole('button', { name: 'Use golden_pick' })
    ).not.toBeInTheDocument()
  })

  it('formats float performance multipliers to two locale decimals', () => {
    render(
      <DetailedStatsTab
        player={player}
        band={{
          ...band,
          performance: {
            guitarDifficulty: 0.7000000000000001,
            drumMultiplier: 1,
            crowdDecay: 1.25
          }
        }}
        social={social}
        onConsumeItem={vi.fn()}
      />
    )

    expect(screen.getByText('x0.70')).toBeInTheDocument()
    expect(screen.getByText('x1.00')).toBeInTheDocument()
    expect(screen.getByText('x1.25')).toBeInTheDocument()
    expect(screen.queryByText(/0\.7000000000000001/)).not.toBeInTheDocument()
  })

  it('uses aria-disabled on locked crafting buttons to keep them keyboard focusable without triggering craft callbacks', () => {
    const onCraft = vi.fn()
    render(
      <DetailedStatsTab
        player={player}
        band={{ ...band, stash: {} }}
        social={social}
        onCraft={onCraft}
      />
    )

    const craftButtons = screen.getAllByRole('button', { name: /^Craft / })
    expect(craftButtons.length).toBeGreaterThan(0)
    const lockedBtn = craftButtons[0]

    expect(lockedBtn).toHaveAttribute('aria-disabled', 'true')
    expect(lockedBtn).not.toBeDisabled()

    fireEvent.click(lockedBtn)
    expect(onCraft).not.toHaveBeenCalled()
  })

  it('uses aria-disabled on unaffordable make amends buttons to keep them keyboard focusable without triggering callback', () => {
    const onMakeAmends = vi.fn()
    render(
      <DetailedStatsTab
        player={{ ...player, money: 0 }}
        spendableCash={0}
        band={band}
        social={social}
        venueBlacklist={['underground_berlin']}
        onMakeAmends={onMakeAmends}
      />
    )

    const makeAmendsBtn = screen.getByRole('button', {
      name: /Make Amends/
    })

    expect(makeAmendsBtn).toHaveAttribute('aria-disabled', 'true')
    expect(makeAmendsBtn).not.toBeDisabled()

    fireEvent.click(makeAmendsBtn)
    expect(onMakeAmends).not.toHaveBeenCalled()
  })
})
