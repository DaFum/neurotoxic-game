import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'

import { SONGS_DB } from '../../src/data/songs'

const gameState = vi.hoisted(() => ({ current: {} }))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ setCurrentGig: vi.fn(), changeScene: vi.fn() }),
  useGameSelector: selector => selector(gameState.current),
  useGameSelectorOptional: selector => selector(gameState.current)
}))

const { SetlistTab } = await import('../../src/ui/bandhq/SetlistTab')

const renderTab = () => {
  const setSetlist = vi.fn()
  const addToast = vi.fn()
  render(
    <SetlistTab
      setlist={[{ id: SONGS_DB[0].id }]}
      setSetlist={setSetlist}
      addToast={addToast}
    />
  )
  return { setSetlist, addToast }
}

describe('SetlistTab during an active Expedition', () => {
  afterEach(cleanup)

  it('disables song edits, explains why, and announces nothing', () => {
    gameState.current = {
      currentScene: 'OVERWORLD',
      expedition: { status: 'active', loadout: { build: {} } }
    }
    const { setSetlist, addToast } = renderTab()

    expect(screen.getByRole('status')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button', { pressed: true })
    expect(buttons[0]).toBeDisabled()

    if (buttons[0].parentElement) {
      fireEvent.mouseEnter(buttons[0].parentElement)
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Setlist is locked while an Expedition is active.'
      )
    }

    fireEvent.click(buttons[0])
    expect(setSetlist).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })

  it('keeps editing enabled outside an active run', () => {
    gameState.current = {
      currentScene: 'OVERWORLD',
      expedition: { status: 'prepared', loadout: null }
    }
    const { setSetlist, addToast } = renderTab()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { pressed: true })[0])
    expect(setSetlist).toHaveBeenCalledTimes(1)
    expect(addToast).toHaveBeenCalledTimes(1)
  })
})
