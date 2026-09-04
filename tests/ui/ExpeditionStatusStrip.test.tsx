import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExpeditionStatusStrip } from '../../src/ui/expedition/ExpeditionStatusStrip'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import type { GameState } from '../../src/types'

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current)
}))

vi.mock('../../src/utils/numberUtils', () => ({
  formatCurrency: (value: number) => `${value} EUR`
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, unknown>) =>
      options && Object.keys(options).length > 0
        ? `${key}:${Object.values(options).join(',')}`
        : key
  })
}))

/** The six resources the design fixes as permanently visible. */
const PERMANENT_RESOURCES = [
  'expedition-hud-cash',
  'expedition-hud-fuel',
  'expedition-hud-stamina',
  'expedition-hud-harmony',
  'expedition-hud-condition',
  'expedition-hud-heat'
]

const buildState = (overrides: Partial<GameState['expedition']> = {}) => {
  const base = createInitialState()
  base.player.money = 1200
  base.player.van = { ...base.player.van, fuel: 80, condition: 55 }
  base.band.harmony = 64
  base.band.members = base.band.members.map(member => ({
    ...member,
    stamina: 70
  }))
  base.expedition = {
    ...createDefaultExpeditionState(),
    status: 'active',
    runId: 'run_1',
    protectedCareerCash: 400,
    routeStep: 3,
    ...overrides
  }
  return base
}

describe('ExpeditionStatusStrip', () => {
  it('renders exactly the six permanent run resources', () => {
    state.current = buildState()
    const { container } = render(<ExpeditionStatusStrip />)

    for (const testId of PERMANENT_RESOURCES) {
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    }
    // Nothing else may live in the permanent strip: contextual statuses such as
    // crew stress or obligations surface only when actionable.
    const cells = container.querySelectorAll('[data-testid^="expedition-hud-"]')
    expect(cells).toHaveLength(PERMANENT_RESOURCES.length)
  })

  it('shows the spendable slice, not the raw balance', () => {
    state.current = buildState()
    render(<ExpeditionStatusStrip />)
    // 1200 total minus 400 protected.
    expect(screen.getByTestId('expedition-hud-cash')).toHaveTextContent(
      '800 EUR'
    )
    expect(screen.getByTestId('expedition-hud-cash')).toHaveTextContent(
      '400 EUR'
    )
  })

  it('reports the semantic condition band next to the value', () => {
    state.current = buildState()
    render(<ExpeditionStatusStrip />)
    const condition = screen.getByTestId('expedition-hud-condition')
    expect(condition).toHaveTextContent('55')
    expect(condition).toHaveTextContent('ui:expedition.condition.worn')
  })

  it('averages member stamina across the roster', () => {
    state.current = buildState()
    render(<ExpeditionStatusStrip />)
    expect(screen.getByTestId('expedition-hud-stamina')).toHaveTextContent('70')
  })

  it('renders nothing outside an active run', () => {
    for (const status of [
      'idle',
      'prepared',
      'extracted',
      'completed',
      'failed'
    ] as const) {
      state.current = buildState({ status })
      const { container } = render(<ExpeditionStatusStrip />)
      expect(container.firstChild).toBeNull()
    }
  })
})
