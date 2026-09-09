import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExpeditionCrewPicker } from '../../src/ui/expedition/ExpeditionCrewPicker'
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
describe('ExpeditionCrewPicker', () => {
  it('selects at most three available crew', () => {
    state.current = createInitialState()
    const onChange = vi.fn()
    const { rerender } = render(
      <ExpeditionCrewPicker selectedCrewIds={[]} onChange={onChange} />
    )
    fireEvent.click(screen.getByRole('button', { name: /mika/i }))
    expect(onChange).toHaveBeenCalledWith(['mika'])
    rerender(
      <ExpeditionCrewPicker
        selectedCrewIds={['mika', 'tom', 'ines']}
        onChange={onChange}
      />
    )
    expect(screen.getByRole('button', { name: /yara/i })).toBeDisabled()
  })

  it('renders a selected crew tile differently from an unselected one', () => {
    // The picker shipped with a single static className, so a selected crew
    // member looked exactly like an unselected one and the only signal that a
    // choice had registered was the `(n/3)` counter in the legend.
    state.current = createInitialState()
    render(
      <ExpeditionCrewPicker selectedCrewIds={['mika']} onChange={vi.fn()} />
    )

    const selected = screen.getByRole('button', { name: /mika/i })
    const unselected = screen.getByRole('button', { name: /tom/i })

    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(unselected).toHaveAttribute('aria-pressed', 'false')
    expect(selected.className).not.toBe(unselected.className)

    // Matches the selected treatment every other Tour Prep picker uses.
    expect(selected.className).toContain('border-toxic-green')
    expect(selected.className).toContain('bg-toxic-green/20')
    expect(unselected.className).toContain('border-steel-gray')
  })
})
