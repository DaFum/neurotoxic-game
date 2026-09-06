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
})
