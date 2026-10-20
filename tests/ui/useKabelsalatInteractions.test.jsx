import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef, useState } from 'react'
import { useKabelsalatInteractions } from '../../src/scenes/kabelsalat/hooks/useKabelsalatInteractions'

const t = vi.fn(key => key)

/**
 * Drives the hook with real React state so assertions read the resulting
 * board state instead of setter call shapes.
 */
const renderInteractions = ({
  selectedCable = null,
  connections = {},
  isShocked = false,
  isPoweredOn = false,
  isGameOver = false,
  isWinning = false
} = {}) =>
  renderHook(() => {
    const isWinningRef = useRef(isWinning)
    const [selected, setSelected] = useState(selectedCable)
    const [conns, setConns] = useState(connections)
    const [shocked, setShocked] = useState(isShocked)
    const [faultReason, setFaultReason] = useState('')
    const handlers = useKabelsalatInteractions(
      t,
      isPoweredOn,
      isGameOver,
      isWinningRef,
      selected,
      setSelected,
      conns,
      setConns,
      shocked,
      setShocked,
      setFaultReason
    )
    return {
      ...handlers,
      selectedCable: selected,
      connections: conns,
      isShocked: shocked,
      faultReason
    }
  })

describe('useKabelsalatInteractions - shock rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const expectShock = (result, reason) => {
    expect(result.current.isShocked).toBe(true)
    expect(result.current.faultReason).toBe(reason)
    expect(result.current.selectedCable).toBeNull()
    expect(result.current.connections).toEqual({})

    act(() => {
      vi.advanceTimersByTime(1199)
    })
    expect(result.current.isShocked).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.isShocked).toBe(false)
    expect(result.current.faultReason).toBe('')
  }

  it('shocks with wrongCable when the cable type does not fit the socket', () => {
    const { result } = renderInteractions({
      selectedCable: 'jack',
      connections: { power: 'iec' }
    })

    act(() => {
      result.current.handleSocketClick('mic')
    })

    expectShock(result, 'ui:minigames.kabelsalat.errors.wrongCable')
  })

  it('shocks with noPower when a non-power socket is wired before power', () => {
    const { result } = renderInteractions({ selectedCable: 'jack' })

    act(() => {
      result.current.handleSocketClick('amp')
    })

    expectShock(result, 'ui:minigames.kabelsalat.errors.noPower')
  })

  it.each([
    ['mic', 'xlr'],
    ['synth', 'midi']
  ])(
    'shocks with noAmp when %s is wired with power but no amp',
    (socketId, cableId) => {
      const { result } = renderInteractions({
        selectedCable: cableId,
        connections: { power: 'iec' }
      })

      act(() => {
        result.current.handleSocketClick(socketId)
      })

      expectShock(result, 'ui:minigames.kabelsalat.errors.noAmp')
    }
  )
})

describe('useKabelsalatInteractions - valid plugs', () => {
  it('connects power first and clears the selection', () => {
    const { result } = renderInteractions({ selectedCable: 'iec' })

    act(() => {
      result.current.handleSocketClick('power')
    })

    expect(result.current.connections).toEqual({ power: 'iec' })
    expect(result.current.selectedCable).toBeNull()
    expect(result.current.isShocked).toBe(false)
  })

  it('allows the pedal with power but no amp (noAmp only gates mic and synth)', () => {
    const { result } = renderInteractions({
      selectedCable: 'dc',
      connections: { power: 'iec' }
    })

    act(() => {
      result.current.handleSocketClick('pedal')
    })

    expect(result.current.connections).toEqual({ power: 'iec', pedal: 'dc' })
    expect(result.current.isShocked).toBe(false)
  })

  it('allows the mic once power and amp are connected', () => {
    const { result } = renderInteractions({
      selectedCable: 'xlr',
      connections: { power: 'iec', amp: 'jack' }
    })

    act(() => {
      result.current.handleSocketClick('mic')
    })

    expect(result.current.connections).toEqual({
      power: 'iec',
      amp: 'jack',
      mic: 'xlr'
    })
    expect(result.current.selectedCable).toBeNull()
    expect(result.current.isShocked).toBe(false)
  })
})

describe('useKabelsalatInteractions - guards', () => {
  it('ignores a socket click with no selected cable', () => {
    const { result } = renderInteractions()

    act(() => {
      result.current.handleSocketClick('power')
    })

    expect(result.current.connections).toEqual({})
    expect(result.current.isShocked).toBe(false)
  })

  it('ignores a click on an already connected socket instead of shocking', () => {
    const { result } = renderInteractions({
      selectedCable: 'jack',
      connections: { power: 'iec' }
    })

    act(() => {
      result.current.handleSocketClick('power')
    })

    expect(result.current.connections).toEqual({ power: 'iec' })
    expect(result.current.selectedCable).toBe('jack')
    expect(result.current.isShocked).toBe(false)
  })

  it.each([
    ['shocked', { isShocked: true }],
    ['powered on', { isPoweredOn: true }],
    ['game over', { isGameOver: true }],
    ['winning', { isWinning: true }]
  ])('ignores socket and cable clicks while %s', (_label, flags) => {
    const { result } = renderInteractions({
      selectedCable: 'iec',
      connections: { amp: 'jack' },
      ...flags
    })

    act(() => {
      result.current.handleSocketClick('power')
    })
    act(() => {
      result.current.handleCableClick('jack')
    })
    act(() => {
      result.current.handleCableClick('xlr')
    })

    expect(result.current.connections).toEqual({ amp: 'jack' })
    expect(result.current.selectedCable).toBe('iec')
  })
})

describe('useKabelsalatInteractions - handleCableClick', () => {
  it('disconnects an already connected cable and clears the selection', () => {
    const { result } = renderInteractions({
      selectedCable: 'xlr',
      connections: { power: 'iec', amp: 'jack' }
    })

    act(() => {
      result.current.handleCableClick('jack')
    })

    expect(result.current.connections).toEqual({ power: 'iec' })
    expect(result.current.selectedCable).toBeNull()
  })

  it('toggles selection on the same cable and switches to another cable', () => {
    const { result } = renderInteractions()

    act(() => {
      result.current.handleCableClick('xlr')
    })
    expect(result.current.selectedCable).toBe('xlr')

    act(() => {
      result.current.handleCableClick('dc')
    })
    expect(result.current.selectedCable).toBe('dc')

    act(() => {
      result.current.handleCableClick('dc')
    })
    expect(result.current.selectedCable).toBeNull()
    expect(result.current.connections).toEqual({})
  })
})
