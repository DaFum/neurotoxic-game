import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'

import { StorageProvider, useStorage } from '../../src/context/StorageContext'
import { InMemoryAdapter, NoopAdapter } from '../../src/utils/storageAdapter'
import { defaultStorageAdapter } from '../../src/utils/storage'

describe('StorageContext', () => {
  it('falls back to the default adapter without a provider', () => {
    const { result } = renderHook(() => useStorage())

    expect(result.current).toBe(defaultStorageAdapter)
  })

  it('injects the provided adapter', () => {
    const adapter = new InMemoryAdapter()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider adapter={adapter}>{children}</StorageProvider>
    )

    const { result } = renderHook(() => useStorage(), { wrapper })

    expect(result.current).toBe(adapter)
    result.current.set('k', 'v')
    expect(adapter.get('k')).toBe('v')
  })

  it('supports a no-op adapter for tests that must not persist', () => {
    const adapter = new NoopAdapter()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider adapter={adapter}>{children}</StorageProvider>
    )

    const { result } = renderHook(() => useStorage(), { wrapper })

    expect(result.current.set('k', 'v')).toBe(false)
    expect(result.current.get('k')).toBeNull()
  })
})
