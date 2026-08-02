import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ClockProvider, useClock } from '../../src/context/ClockContext'
import { createFixedClock, systemClock } from '../../src/utils/clock'

describe('ClockContext', () => {
  it('falls back to the system clock without a provider', () => {
    const { result } = renderHook(() => useClock())

    expect(result.current).toBe(systemClock)
  })

  it('injects the provided clock', () => {
    const clock = createFixedClock(1_700_000_000_000)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ClockProvider clock={clock}>{children}</ClockProvider>
    )

    const { result } = renderHook(() => useClock(), { wrapper })

    expect(result.current.now()).toBe(1_700_000_000_000)
  })
})
