import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { Modal } from '../../src/ui/shared/Modal.tsx'
import { hasActiveModal } from '../../src/ui/shared/useModalBehavior.ts'
import { useKeyboardShortcuts } from '../../src/ui/shared/KeyboardShortcuts.tsx'
import { useGigInput } from '../../src/hooks/useGigInput.ts'
import { ContrabandStash } from '../../src/ui/ContrabandStash.tsx'

vi.mock('../../src/ui/shared/GeneratedImagePanel.tsx', () => ({
  GeneratedImagePanel: ({ alt }) => <img alt={alt} />
}))

vi.mock('../../src/utils/audio/audioEngine', () => ({
  audioManager: {},
  audioService: { ensureAudioContext: vi.fn(() => Promise.resolve(true)) },
  getSongId: vi.fn()
}))

const ShortcutProbe = ({ onToggleMute, setShowHelp }) => {
  useKeyboardShortcuts({ setShowHelp, onToggleMute })
  return null
}

describe('modal keyboard gate', () => {
  it('suppresses global shortcuts while a dialog is open and restores them after', () => {
    const onToggleMute = vi.fn()
    const setShowHelp = vi.fn()
    render(
      <ShortcutProbe onToggleMute={onToggleMute} setShowHelp={setShowHelp} />
    )

    const { unmount } = render(
      <Modal isOpen onClose={() => {}} ariaLabel='Test dialog'>
        <button type='button'>ok</button>
      </Modal>
    )
    expect(hasActiveModal()).toBe(true)

    for (const key of ['m', 'h', '?']) fireEvent.keyDown(window, { key })
    expect(onToggleMute).not.toHaveBeenCalled()
    expect(setShowHelp).not.toHaveBeenCalled()

    unmount()
    expect(hasActiveModal()).toBe(false)
    fireEvent.keyDown(window, { key: 'm' })
    expect(onToggleMute).toHaveBeenCalledTimes(1)
  })
})

describe('ContrabandStash dialog name', () => {
  it('exposes an accessible dialog name', () => {
    render(
      <ContrabandStash
        selectedMember='member-1'
        setSelectedMember={vi.fn()}
        handleUseItem={vi.fn()}
        onClose={vi.fn()}
        members={[{ id: 'member-1', name: 'Matze' }]}
        stash={[]}
      />
    )
    expect(
      screen.getByRole('dialog', { name: /contraband/i })
    ).toBeInTheDocument()
  })
})

describe('Gig keyboard input behind a dialog', () => {
  it('ignores pause and lane keys while a dialog is open but still releases lanes', () => {
    const actions = { registerInput: vi.fn() }
    const onTogglePause = vi.fn()
    renderHook(() =>
      useGigInput({
        actions,
        gameStateRef: { current: { lanes: [{ key: 'a' }] } },
        triggerBandAnimation: vi.fn(),
        onTogglePause
      })
    )

    const { unmount } = render(
      <Modal isOpen onClose={() => {}} ariaLabel='Event'>
        <button type='button'>ok</button>
      </Modal>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.keyDown(window, { key: 'a' })
    expect(onTogglePause).not.toHaveBeenCalled()
    expect(actions.registerInput).not.toHaveBeenCalled()

    fireEvent.keyUp(window, { key: 'a' })
    expect(actions.registerInput).toHaveBeenCalledWith(0, false)

    unmount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onTogglePause).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'a' })
    expect(actions.registerInput).toHaveBeenCalledWith(0, true)
  })
})
