import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import en from '../../public/locales/en/ui.json'
import de from '../../public/locales/de/ui.json'
import { InputHint } from '../../src/ui/shared/InputHint'
import { KeyboardShortcutsPanel } from '../../src/ui/shared/KeyboardShortcuts'
import { ControllerSettings } from '../../src/ui/settings/ControllerSettings'
import { DataManagement } from '../../src/ui/settings/DataManagement'
import { GamepadContext } from '../../src/hooks/gamepad/GamepadContext'
import { setActiveInputSource } from '../../src/utils/gamepad/inputSource'

vi.unmock('react-i18next')

afterEach(() => act(() => setActiveInputSource('keyboard')))

describe('gamepad hints and button labels', () => {
  it('renders a supplied label without controller state', () => {
    render(<InputHint label='Custom key' />)
    expect(screen.getByText('Custom key')).toBeTruthy()
  })

  it.each([
    ['de', 'generic', 'Taste 4'],
    ['de', 'xbox', 'Taste 4'],
    ['en', 'generic', 'Button 4']
  ])(
    'localizes fallback buttons in settings and help (%s, %s)',
    async (language, family, expected) => {
      const i18n = i18next.createInstance()
      await i18n.init({
        lng: language,
        resources: { en: { ui: en }, de: { ui: de } },
        defaultNS: 'ui',
        keySeparator: false,
        interpolation: { escapeValue: false }
      })
      act(() => setActiveInputSource('gamepad'))
      const controller = {
        register: () => () => {},
        capture: () => () => {},
        bindings: [4, 0, 1],
        status: {
          available: true,
          devices: [{ index: 0, id: 'Controller', family, standard: true }]
        }
      }
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <GamepadContext value={controller}>
            <ControllerSettings
              bindings={controller.bindings}
              onChange={() => {}}
              onReset={() => {}}
            />
            <KeyboardShortcutsPanel showHelp onClose={() => {}} />
            <DataManagement onDeleteSave={() => {}} />
          </GamepadContext>
        </I18nextProvider>
      )
      expect(
        container.textContent.split(expected).length - 1
      ).toBeGreaterThanOrEqual(2)
      expect(
        screen.getByText(language === 'de' ? 'Halten' : 'Hold')
      ).toBeTruthy()
      if (family === 'xbox')
        expect(screen.getAllByText('A').length).toBeGreaterThan(0)
    }
  )
})
