import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ForeclosureModal } from '../../src/components/assets/ForeclosureModal'
import { FailureCrisisDialog } from '../../src/ui/expedition/FailureCrisisDialog'
import { createInitialState } from '../../src/context/initialState'
import { createDefaultExpeditionState } from '../../src/domain/expedition/defaults'
import type { GameState } from '../../src/types'

// These use the real CrisisModal on purpose: they pin the Escape split between
// its callers (Foreclosure closes, the expedition crisis must be answered).

const state: { current: GameState } = vi.hoisted(
  () => ({ current: null }) as never
)
const acceptExpeditionFailure = vi.hoisted(() => vi.fn())
const resolveExpeditionCrisis = vi.hoisted(() => vi.fn())

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: (selector: (s: GameState) => unknown) =>
    selector(state.current),
  useGameActions: () => ({ acceptExpeditionFailure, resolveExpeditionCrisis })
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, unknown>) =>
      options && Object.hasOwn(options, 'defaultValue')
        ? String(options.defaultValue)
        : key
  })
}))

describe('CrisisModal Escape handling per caller', () => {
  it('ForeclosureModal closes on Escape', () => {
    const onClose = vi.fn()
    render(<ForeclosureModal isOpen onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FailureCrisisDialog swallows Escape: no response is picked', () => {
    const base = createInitialState()
    base.expedition = {
      ...createDefaultExpeditionState(),
      status: 'active',
      runId: 'run_1',
      routeStep: 4,
      pendingFailure: {
        id: 'exp_fail::run_1::fuel_stranded::exp_4_0::4',
        reason: 'fuel_stranded',
        sourceId: 'exp_4_0',
        raisedAtRouteStep: 4,
        choices: ['refuel', 'tow', 'accept_failure']
      }
    }
    state.current = base
    render(<FailureCrisisDialog />)

    const notPrevented = fireEvent.keyDown(window, { key: 'Escape' })

    expect(notPrevented).toBe(false)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(acceptExpeditionFailure).not.toHaveBeenCalled()
    expect(resolveExpeditionCrisis).not.toHaveBeenCalled()
  })
})
