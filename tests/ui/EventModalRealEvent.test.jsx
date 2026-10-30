import { expect, test, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMotionReactMock } from '../mocks/motionMock'
import { EventModal } from '../../src/ui/EventModal.tsx'
import { EVENTS_DB } from '../../src/data/events/index.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { getExpeditionRelationshipPairKey } from '../../src/domain/expedition/relationships.ts'

vi.mock('motion/react', () => createMotionReactMock())

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: {
      language: 'en',
      changeLanguage: () => new Promise(() => {}),
      options: {}
    }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

const store = vi.hoisted(() => ({ state: null }))

vi.mock('../../src/context/GameState', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useGameSelector: selector => selector(store.state),
  useGameSelectorOptional: selector => selector(store.state)
  }
})

const MATZE_TOM = getExpeditionRelationshipPairKey(
  { kind: 'band', id: 'matze' },
  { kind: 'crew', id: 'tom' }
)

const injuryScare = EVENTS_DB.band.find(
  event => event.id === 'expedition_crew_injury_scare'
)

/** A full game state with an active run carrying Ines and Tom. */
const activeRunWithTom = tiers => {
  const base = createInitialState()
  return {
    ...base,
    activeEvent: injuryScare,
    career: { ...base.career, expeditionRelationshipByPair: tiers },
    expedition: {
      ...base.expedition,
      status: 'active',
      loadout: { crewIds: ['ines', 'tom'] }
    }
  }
}

const tomCoversButton = () =>
  screen
    .getByText('events:expedition_crew_injury_scare.tom_covers.label')
    .closest('button')

test('the shipped injury scare disables Tom covering below the trust tier', () => {
  expect(injuryScare).toBeDefined()
  store.state = activeRunWithTom({})

  render(<EventModal event={injuryScare} onOptionSelect={vi.fn()} />)

  expect(tomCoversButton()).toHaveAttribute('aria-disabled', 'true')
  expect(
    screen
      .getByText('events:expedition_crew_injury_scare.push_on.label')
      .closest('button')
  ).toHaveAttribute('aria-disabled', 'false')
})

test('the shipped injury scare lets a trusted Tom cover and previews the outcome', async () => {
  store.state = activeRunWithTom({ [MATZE_TOM]: 1 })

  render(<EventModal event={injuryScare} onOptionSelect={vi.fn()} />)

  const button = tomCoversButton()
  expect(button).toHaveAttribute('aria-disabled', 'false')

  fireEvent.click(button)
  await waitFor(() => {
    expect(
      screen.getByText(
        /events:expedition_crew_injury_scare\.tom_covers\.outcome/
      )
    ).toBeInTheDocument()
  })
})
