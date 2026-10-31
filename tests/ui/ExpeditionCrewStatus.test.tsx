import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExpeditionCrewStatus } from '../../src/ui/expedition/ExpeditionCrewStatus'
import { createInitialState } from '../../src/context/initialState'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (state: GameState) => unknown) =>
    selector(state.current)
}))
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key })
}))

it('shows semantic stress and injury for selected crew', () => {
  const base = createInitialState()
  state.current = {
    ...base,
    expedition: {
      ...base.expedition,
      status: 'active',
      loadout: { crewIds: ['mika'] } as never,
      crew: { stressByCrewId: { mika: 72 }, injuryByCrewId: { mika: 'light' } }
    }
  }
  render(<ExpeditionCrewStatus />)
  expect(
    screen.getByText('ui:expedition.crew.stress.crisis')
  ).toBeInTheDocument()
  expect(
    screen.getByText('ui:expedition.crew.injury.light')
  ).toBeInTheDocument()
})

describe('Count-aware grid layout', () => {
  it.each([
    {
      crewIds: ['mika'],
      expectedCardCount: 1,
      expectedColClass: 'sm:grid-cols-1',
      unexpectedColClasses: ['sm:grid-cols-2', 'sm:grid-cols-3']
    },
    {
      crewIds: ['mika', 'tom'],
      expectedCardCount: 2,
      expectedColClass: 'sm:grid-cols-2',
      unexpectedColClasses: ['sm:grid-cols-1', 'sm:grid-cols-3']
    },
    {
      crewIds: ['mika', 'tom', 'ines'],
      expectedCardCount: 3,
      expectedColClass: 'sm:grid-cols-3',
      unexpectedColClasses: ['sm:grid-cols-1', 'sm:grid-cols-2']
    }
  ])(
    'adapts grid columns for crew ids: $crewIds',
    ({
      crewIds,
      expectedCardCount,
      expectedColClass,
      unexpectedColClasses
    }) => {
      const base = createInitialState()
      state.current = {
        ...base,
        expedition: {
          ...base.expedition,
          status: 'active',
          loadout: { crewIds } as never
        }
      }
      render(<ExpeditionCrewStatus />)
      const section = screen.getByRole('region', {
        name: 'ui:expedition.crew.status'
      })
      const articles = section.querySelectorAll('article')
      expect(articles).toHaveLength(expectedCardCount)
      expect(section.className).toContain(expectedColClass)
      for (const unexpected of unexpectedColClasses) {
        expect(section.className).not.toContain(unexpected)
      }
    }
  )

  it('filters unknown IDs and adapts grid columns to known visible count', () => {
    const base = createInitialState()
    state.current = {
      ...base,
      expedition: {
        ...base.expedition,
        status: 'active',
        loadout: { crewIds: ['mika', 'tom', 'unknown-id'] } as never
      }
    }
    render(<ExpeditionCrewStatus />)
    const section = screen.getByRole('region', {
      name: 'ui:expedition.crew.status'
    })
    const articles = section.querySelectorAll('article')
    expect(articles).toHaveLength(2)
    expect(section.className).toContain('sm:grid-cols-2')
    expect(section.className).not.toContain('sm:grid-cols-1')
    expect(section.className).not.toContain('sm:grid-cols-3')
  })

  it('renders nothing when only unknown IDs are provided', () => {
    const base = createInitialState()
    state.current = {
      ...base,
      expedition: {
        ...base.expedition,
        status: 'active',
        loadout: { crewIds: ['unknown-1', 'unknown-2'] } as never
      }
    }
    render(<ExpeditionCrewStatus />)
    expect(
      screen.queryByRole('region', { name: 'ui:expedition.crew.status' })
    ).toBeNull()
  })

  it('renders four cards with 3 columns when four known IDs are provided', () => {
    const base = createInitialState()
    state.current = {
      ...base,
      expedition: {
        ...base.expedition,
        status: 'active',
        loadout: { crewIds: ['mika', 'tom', 'ines', 'yara'] } as never
      }
    }
    render(<ExpeditionCrewStatus />)
    const section = screen.getByRole('region', {
      name: 'ui:expedition.crew.status'
    })
    const articles = section.querySelectorAll('article')
    expect(articles).toHaveLength(4)
    expect(section.className).toContain('sm:grid-cols-3')
    expect(section.className).not.toContain('sm:grid-cols-1')
    expect(section.className).not.toContain('sm:grid-cols-2')
  })
})
