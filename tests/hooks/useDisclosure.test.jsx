import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDisclosure } from '../../src/hooks/useDisclosure'

describe('useDisclosure', () => {
  it('starts closed and toggles with open/close', () => {
    const { result } = renderHook(() => useDisclosure())

    expect(result.current.isOpen).toBe(false)
    act(() => result.current.open())
    expect(result.current.isOpen).toBe(true)
    act(() => result.current.close())
    expect(result.current.isOpen).toBe(false)
  })

  it('honours the initial state and keeps callbacks referentially stable', () => {
    const { result } = renderHook(() => useDisclosure(true))
    const { open, close } = result.current

    expect(result.current.isOpen).toBe(true)
    act(() => result.current.close())
    expect(result.current.open).toBe(open)
    expect(result.current.close).toBe(close)
  })
})
