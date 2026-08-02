import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import { defaultStorageAdapter } from '../utils/storage'
import type { IStorageAdapter } from '../utils/storageAdapter'

const StorageContext = createContext<IStorageAdapter>(defaultStorageAdapter)

/**
 * Provides a storage adapter to the tree below. Tests wrap with an
 * `InMemoryAdapter` or `NoopAdapter`; the app relies on the
 * `defaultStorageAdapter` default, so production needs no wiring.
 *
 * @param props - Adapter to provide and the subtree receiving it.
 */
export const StorageProvider = ({
  adapter,
  children
}: {
  adapter: IStorageAdapter
  children: ReactNode
}) => <StorageContext value={adapter}>{children}</StorageContext>

/**
 * Reads the injected storage adapter.
 *
 * @returns The adapter provided by the nearest `StorageProvider`, or
 * `defaultStorageAdapter`.
 */
export const useStorage = (): IStorageAdapter => use(StorageContext)
