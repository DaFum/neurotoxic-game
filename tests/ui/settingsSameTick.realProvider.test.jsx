import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import {
  readGlobalSettings,
  resetStorageFallback
} from '../../src/utils/storage'

// #3648: `updateSettings` writes global settings synchronously because
// `resetState` builds its action from the stored settings at call time. Moving
// the write into an effect would silently lose an update made in the same tick.

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

const GLOBAL_SETTINGS_KEY = 'neurotoxic_global_settings'

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const renderProvider = () =>
  renderHook(
    () => ({
      actions: useGameActions(),
      crtEnabled: useGameSelector(s => s.settings.crtEnabled)
    }),
    { wrapper }
  )

describe('updateSettings through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  test('resetState in the same tick keeps a settings update', () => {
    const { result } = renderProvider()
    const crtEnabled = !result.current.crtEnabled

    act(() => {
      result.current.actions.updateSettings({ crtEnabled })
      // The write must already be in storage before resetState reads it; a
      // write deferred to an effect would otherwise pass the checks below.
      expect(readGlobalSettings().crtEnabled).toBe(crtEnabled)
      result.current.actions.resetState()
    })

    expect(readGlobalSettings().crtEnabled).toBe(crtEnabled)
    expect(result.current.crtEnabled).toBe(crtEnabled)
  })

  test('unknown keys in the stored settings record survive an update', () => {
    localStorage.setItem(
      GLOBAL_SETTINGS_KEY,
      JSON.stringify({ futureFlag: 'keep-me', crtEnabled: true })
    )
    const { result } = renderProvider()

    act(() => {
      result.current.actions.updateSettings({ crtEnabled: false })
    })

    const stored = JSON.parse(
      localStorage.getItem(GLOBAL_SETTINGS_KEY) ?? 'null'
    )
    expect(stored.futureFlag).toBe('keep-me')
    expect(stored.crtEnabled).toBe(false)
  })
})
