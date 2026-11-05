import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { TourbusScene } from '../../src/scenes/TourbusScene'
import { setActiveInputSource } from '../../src/utils/gamepad/inputSource'

const { van, locale } = vi.hoisted(() => ({
  van: { condition: 100 },
  locale: { language: 'en' }
}))
vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector => selector({ player: { van } })
}))
const moveLeft = vi.fn()
const moveRight = vi.fn()
const handleArrivalSequence = vi.fn()

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: locale,
    t: (_k, o) =>
      _k === 'ui:continue'
        ? 'WEITER'
        : (o?.defaultValue ?? _k).replace(/\{\{(\w+)\}\}/g, (_m, name) =>
            String(o?.[name])
          )
  })
}))

vi.mock('../../src/hooks/minigames/useTourbusLogic', () => ({
  useTourbusLogic: () => ({
    uiState: { distance: 123, damage: 40, isComplete: false },
    gameStateRef: { current: {} },
    stats: {},
    update: vi.fn(),
    actions: { moveLeft, moveRight }
  })
}))

vi.mock('../../src/hooks/useArrivalLogic', () => ({
  useArrivalLogic: () => ({ handleArrivalSequence })
}))

vi.mock('../../src/components/stage/TourbusStageController', () => ({
  createTourbusStageController: vi.fn()
}))

vi.mock('../../src/components/MinigameSceneFrame', () => ({
  MinigameSceneFrame: ({
    children,
    onComplete,
    completionButtonText,
    renderCompletionStats
  }) => (
    <div>
      <button type='button' onClick={() => onComplete()}>
        {completionButtonText}
      </button>
      <div>{renderCompletionStats({ damage: 40 })}</div>
      {children}
    </div>
  )
}))

describe('TourbusScene', () => {
  beforeEach(() => {
    van.condition = 100
    locale.language = 'en'
  })
  it.each([
    [100, 73, '27.0'],
    [10, 0, '10.0']
  ])(
    'reports actual settled loss from %s to %s condition as %s%%',
    (starting, settled, loss) => {
      van.condition = starting
      const { rerender } = render(<TourbusScene />)
      van.condition = settled
      rerender(<TourbusScene />)
      expect(screen.getByText(`Condition Loss: ${loss}%`)).toBeInTheDocument()
    }
  )
  it('renders overlays and routes controls/completion actions', () => {
    render(<TourbusScene />)

    expect(screen.getByText('TOURBUS TERROR')).toBeInTheDocument()
    expect(screen.getByText(/DISTANCE:/)).toBeInTheDocument()
    expect(screen.getByText(/DAMAGE:/)).toBeInTheDocument()
    expect(screen.getByText('Condition Loss: 0.0%')).toBeInTheDocument()
    const completionButton = screen.getByRole('button', { name: 'WEITER' })
    expect(completionButton).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Move Left'))
    fireEvent.click(screen.getByLabelText('Move Right'))
    fireEvent.click(completionButton)

    expect(moveLeft).toHaveBeenCalled()
    expect(moveRight).toHaveBeenCalled()
    expect(handleArrivalSequence).toHaveBeenCalled()
  })

  describe('steering guidance', () => {
    const STEER_HINT = /←\/→ or A\/D/

    afterEach(() => {
      act(() => setActiveInputSource('keyboard'))
    })

    it.each(['keyboard', 'pointer', 'touch'])(
      'shows the arrow glyphs for %s input',
      source => {
        act(() => setActiveInputSource(source))
        render(<TourbusScene />)
        for (const [name, glyph] of [
          ['Move Left', '<'],
          ['Move Right', '>']
        ]) {
          const button = screen.getByRole('button', { name })
          // The glyph used to be `text-transparent` unless the pointer was
          // coarse, so mouse and keyboard players saw no steering cue.
          expect(button.className).not.toMatch(/text-transparent/)
          const glyphNode = button.querySelector('[aria-hidden="true"]')
          expect(glyphNode).toHaveTextContent(glyph)
          expect(glyphNode.className).toMatch(/text-star-white\//)
        }
      }
    )

    it('shows the keyboard and mouse instruction outside gamepad play', () => {
      render(<TourbusScene />)
      expect(screen.getByText(STEER_HINT)).toBeInTheDocument()
      expect(screen.queryByText('Steer one lane at a time')).toBeNull()
    })

    it('swaps the instruction for the gamepad hint on a controller', () => {
      act(() => setActiveInputSource('gamepad'))
      render(<TourbusScene />)
      expect(screen.queryByText(STEER_HINT)).toBeNull()
      expect(screen.getByText(/Steer one lane at a time/)).toBeInTheDocument()
    })
  })
})

for (const [language, formatted] of [
  ['en', '27.2'],
  ['de', '27,2']
]) {
  it(`formats fractional settled wear in ${language}`, () => {
    locale.language = language
    van.condition = 100
    const { rerender } = render(<TourbusScene />)
    van.condition = 72.83999999999999
    rerender(<TourbusScene />)
    expect(
      screen.getByText(`Condition Loss: ${formatted}%`)
    ).toBeInTheDocument()
  })
}
