import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Modal } from '../../src/ui/shared/Modal.tsx'
import { hasActiveModal } from '../../src/ui/shared/useModalBehavior.ts'
import { useKeyboardShortcuts } from '../../src/ui/shared/KeyboardShortcuts.tsx'
import { ContrabandStash } from '../../src/ui/ContrabandStash.tsx'

vi.mock('../../src/ui/shared/GeneratedImagePanel.tsx', () => ({
  GeneratedImagePanel: ({ alt }) => <img alt={alt} />
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
