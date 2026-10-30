import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { GamepadInputProvider } from '../../src/context/GamepadInputContext'
import { useGamepadActions } from '../../src/hooks/gamepad/GamepadContext'

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({ addToast: vi.fn() }),
  useGameSelector: selector =>
    selector({ settings: { gamepadLaneBindings: [2, 0, 1] } })
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue ?? _key
  })
}))

describe('GamepadInputProvider', () => {
  let pads, frame, original
  beforeEach(() => {
    pads = []
    original = Object.getOwnPropertyDescriptor(navigator, 'getGamepads')
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => pads
    })
    vi.stubGlobal('requestAnimationFrame', callback => {
      frame = callback
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      frame = undefined
    })
  })
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'getGamepads', original)
    else delete navigator.getGamepads
    vi.unstubAllGlobals()
  })
  it('delivers one press and its release on blur', () => {
    const events = []
    function Consumer() {
      useGamepadActions(
        { onButton: (button, down) => events.push([button, down]) },
        { kind: 'gameplay', consumes: [2] }
      )
      return null
    }
    const pad = {
      index: 0,
      id: 'Xbox',
      mapping: 'standard',
      buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
      axes: [0, 0]
    }
    pads = [pad]
    render(
      <GamepadInputProvider>
        <Consumer />
      </GamepadInputProvider>
    )
    act(() => frame(0))
    pad.buttons[2].pressed = true
    act(() => frame(20))
    act(() => frame(40))
    act(() => window.dispatchEvent(new Event('blur')))
    expect(events).toEqual([
      [2, true],
      [2, false]
    ])
  })
})

it('releases on disconnect, gates modal presses, and suppresses held carry-over', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const { Modal } = await import('../../src/ui/shared/Modal')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  fixture.pads.push(pad)
  const events = []
  const onDisconnect = vi.fn()
  function Consumer() {
    useGamepadActions(
      { onButton: (button, down) => events.push([button, down]), onDisconnect },
      { kind: 'gameplay', consumes: [2] }
    )
    return null
  }
  try {
    const view = render(
      <GamepadInputProvider>
        <Consumer />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[2].pressed = true
    act(() => fixture.step(20))
    view.rerender(
      <GamepadInputProvider>
        <Consumer />
        <Modal isOpen onClose={() => {}} ariaLabel='Dialog'>
          <button>Confirm</button>
        </Modal>
      </GamepadInputProvider>
    )
    pad.buttons[2].pressed = false
    act(() => fixture.step(40))
    pad.buttons[2].pressed = true
    act(() => fixture.step(60))
    expect(events).toEqual([
      [2, true],
      [2, false]
    ])
    act(() => fixture.disconnect(0))
    act(() => fixture.step(80))
    expect(onDisconnect).toHaveBeenCalledTimes(1)
    view.unmount()
  } finally {
    fixture.restore()
  }
})

it('keeps a merged button held until all connected controllers release it', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const fixture = installGamepadFixture()
  const first = fixture.makePad(0)
  const second = fixture.makePad(1)
  fixture.pads.push(first, second)
  const events = []
  function Consumer() {
    useGamepadActions(
      { onButton: (button, down) => events.push([button, down]) },
      { kind: 'gameplay', consumes: [2] }
    )
    return null
  }
  try {
    const view = render(
      <GamepadInputProvider>
        <Consumer />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    first.buttons[2].pressed = true
    act(() => fixture.step(20))
    second.buttons[2].pressed = true
    act(() => fixture.step(40))
    act(() => fixture.disconnect(0))
    act(() => fixture.step(60))
    expect(events).toEqual([[2, true]])
    second.buttons[2].pressed = false
    act(() => fixture.step(80))
    expect(events).toEqual([
      [2, true],
      [2, false]
    ])
    view.unmount()
  } finally {
    fixture.restore()
  }
})

it('releases held input when the document becomes hidden', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  fixture.pads.push(pad)
  const events = []
  const descriptor = Object.getOwnPropertyDescriptor(document, 'hidden')
  function Consumer() {
    useGamepadActions(
      { onButton: (button, down) => events.push([button, down]) },
      { kind: 'gameplay', consumes: [2] }
    )
    return null
  }
  try {
    const view = render(
      <GamepadInputProvider>
        <Consumer />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[2].pressed = true
    act(() => fixture.step(20))
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(events).toEqual([
      [2, true],
      [2, false]
    ])
    view.unmount()
  } finally {
    if (descriptor) Object.defineProperty(document, 'hidden', descriptor)
    else delete document.hidden
    fixture.restore()
  }
})

it('does not switch source or focus for stick drift', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const { setActiveInputSource } =
    await import('../../src/utils/gamepad/inputSource')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  pad.axes = [0.1, 0.1]
  fixture.pads.push(pad)
  setActiveInputSource('keyboard')
  try {
    const view = render(
      <GamepadInputProvider>
        <button>Focus</button>
      </GamepadInputProvider>
    )
    const button = view.getByText('Focus')
    button.focus()
    act(() => fixture.step(0))
    expect(document.documentElement.dataset.inputSource).toBe('keyboard')
    expect(document.activeElement).toBe(button)
    view.unmount()
  } finally {
    fixture.restore()
  }
})

it('lets the top modal use a D-pad button even when a gameplay adapter binds it', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const { Modal } = await import('../../src/ui/shared/Modal')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  fixture.pads.push(pad)
  const onButton = vi.fn()
  const onClose = vi.fn()
  function Consumer() {
    useGamepadActions({ onButton }, { kind: 'gameplay', consumes: [14] })
    return null
  }
  try {
    const view = render(
      <GamepadInputProvider>
        <Consumer />
        <Modal isOpen onClose={onClose} ariaLabel='Critical'>
          <button>First</button>
          <button>Second</button>
        </Modal>
      </GamepadInputProvider>
    )
    view.getByText('Second').focus()
    act(() => fixture.step(0))
    pad.buttons[14].pressed = true
    act(() => fixture.step(20))
    expect(document.activeElement).toBe(view.getByText('First'))
    expect(onButton).not.toHaveBeenCalled()
    view.unmount()
  } finally {
    fixture.restore()
  }
})

it('closes only the top modal with B and restores its opener', async () => {
  const { useState } = await import('react')
  const { installGamepadFixture } = await import('../gamepadFixture')
  const { Modal } = await import('../../src/ui/shared/Modal')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  fixture.pads.push(pad)
  function Dialogs() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Open dialog</button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          ariaLabel='Closable'
        >
          <button>Inside</button>
        </Modal>
      </>
    )
  }
  try {
    const view = render(
      <GamepadInputProvider>
        <Dialogs />
      </GamepadInputProvider>
    )
    const opener = view.getByText('Open dialog')
    opener.focus()
    act(() => opener.click())
    act(() => fixture.step(0))
    pad.buttons[1].pressed = true
    act(() => fixture.step(20))
    expect(view.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    view.unmount()
  } finally {
    fixture.restore()
  }
})

it('releases an unmounted consumer and suppresses a held button in the next scene', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  fixture.pads.push(pad)
  const events = []
  function Scene({ name }) {
    useGamepadActions(
      { onButton: (button, down) => events.push([name, button, down]) },
      { kind: 'gameplay', consumes: [2] }
    )
    return null
  }
  try {
    const view = render(
      <GamepadInputProvider>
        <Scene key='old' name='old' />
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[2].pressed = true
    act(() => fixture.step(20))
    view.rerender(
      <GamepadInputProvider>
        <Scene key='new' name='new' />
      </GamepadInputProvider>
    )
    act(() => fixture.step(40))
    expect(events).toEqual([
      ['old', 2, true],
      ['old', 2, false]
    ])
    pad.buttons[2].pressed = false
    act(() => fixture.step(60))
    pad.buttons[2].pressed = true
    act(() => fixture.step(80))
    expect(events.at(-1)).toEqual(['new', 2, true])
    view.unmount()
  } finally {
    fixture.restore()
  }
})

it('leaves a critical dialog open when B is pressed', async () => {
  const { installGamepadFixture } = await import('../gamepadFixture')
  const { CriticalDialogShell } =
    await import('../../src/ui/shared/CriticalDialogShell')
  const fixture = installGamepadFixture()
  const pad = fixture.makePad()
  fixture.pads.push(pad)
  try {
    const view = render(
      <GamepadInputProvider>
        <CriticalDialogShell
          labelledBy='critical-title'
          severityLabel='Critical'
          panelClassName=''
          severityLabelClassName=''
        >
          <h2 id='critical-title'>Critical decision</h2>
          <button>Choose</button>
        </CriticalDialogShell>
      </GamepadInputProvider>
    )
    act(() => fixture.step(0))
    pad.buttons[1].pressed = true
    act(() => fixture.step(20))
    expect(view.getByRole('dialog', { name: 'Critical decision' })).toBeTruthy()
    view.unmount()
  } finally {
    fixture.restore()
  }
})
