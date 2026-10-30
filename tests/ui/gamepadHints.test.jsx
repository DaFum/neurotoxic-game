import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KeyboardShortcutsPanel } from '../../src/ui/shared/KeyboardShortcuts'
import { setActiveInputSource } from '../../src/utils/gamepad/inputSource'
import { GamepadContext } from '../../src/hooks/gamepad/GamepadContext'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, options) => options?.defaultValue ?? key })
}))
afterEach(() => setActiveInputSource('keyboard'))

it('labels controller actions and the remapped lanes in the help panel', () => {
  setActiveInputSource('gamepad')
  const controller = {
    register: () => () => {},
    capture: () => () => {},
    bindings: [4, 0, 1],
    status: {
      available: true,
      devices: [{ index: 0, id: 'Xbox', family: 'xbox', standard: true }]
    }
  }
  render(
    <GamepadContext value={controller}>
      <KeyboardShortcutsPanel showHelp onClose={() => {}} />
    </GamepadContext>
  )
  expect(screen.getByText('Confirm')).toBeTruthy()
  expect(screen.getByText('Help')).toBeTruthy()
  expect(screen.getByText('Button 4')).toBeTruthy()
})
