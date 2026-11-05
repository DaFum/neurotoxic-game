import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import enUi from '../../public/locales/en/ui.json'
import deUi from '../../public/locales/de/ui.json'
import enItems from '../../public/locales/en/items.json'
import deItems from '../../public/locales/de/items.json'

const fixture = vi.hoisted(() => ({
  language: 'en',
  start: vi.fn(),
  uiState: {
    itemsRemaining: 3,
    itemsDelivered: 0,
    currentDamage: 0,
    carrying: { id: 'c_void_energy', type: 'CONTRABAND', weight: 1.5 },
    awaitingStart: true,
    isGameOver: false
  }
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options = {}) => {
      const [namespace, name] = key.split(':')
      const records =
        fixture.language === 'en'
          ? { ui: enUi, items: enItems }
          : { ui: deUi, items: deItems }
      const value = records[namespace]?.[name] ?? options.defaultValue ?? key
      return value.replace(/{{(\w+)}}/g, (_, token) =>
        String(options[token] ?? '')
      )
    }
  })
}))
vi.mock('../../src/hooks/minigames/useRoadieLogic', () => ({
  useRoadieLogic: () => ({
    uiState: fixture.uiState,
    gameStateRef: { current: {} },
    stats: {},
    update: vi.fn(),
    actions: { move: vi.fn(), start: fixture.start }
  })
}))
vi.mock('../../src/components/stage/RoadieStageController', () => ({
  createRoadieStageController: vi.fn()
}))
vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ changeScene: vi.fn() })
}))
vi.mock('../../src/components/MinigameSceneFrame', () => ({
  MinigameSceneFrame: ({ children }) => <div>{children}</div>
}))

const { RoadieRunScene } = await import('../../src/scenes/RoadieRunScene')

describe('Roadie contraband disclosure', () => {
  for (const [language, ui, items] of [
    ['en', enUi, enItems],
    ['de', deUi, deItems]
  ]) {
    it(`names the actual item and consumption consequence before play and in the HUD (${language})`, () => {
      fixture.start.mockClear()
      fixture.language = language
      render(<RoadieRunScene />)
      const itemName = items['contraband.c_void_energy.name']
      const warning = ui['roadieRun.contraband.warning']?.replace(
        '{{item}}',
        itemName
      )
      expect(warning).toBeTruthy()
      expect(screen.getByRole('dialog')).toHaveAccessibleDescription(warning)
      expect(screen.getAllByText(warning)).toHaveLength(2)
      expect(
        screen.getByRole('button', { name: ui['roadieRun.briefing.start'] })
      ).toHaveFocus()
      fireEvent.click(
        screen.getByRole('button', { name: ui['roadieRun.briefing.start'] })
      )
      expect(fixture.start).toHaveBeenCalledTimes(1)
    })
  }
})
