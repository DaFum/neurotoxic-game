import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
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
