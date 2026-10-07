import { useCallback, useState } from 'react'

/**
 * Open/close state with stable callbacks, for modals and other disclosures.
 *
 * @param initialOpen - Whether the disclosure starts open.
 * @returns The current state plus referentially stable `open` and `close` callbacks.
 */
export const useDisclosure = (
  initialOpen = false
): { isOpen: boolean; open: () => void; close: () => void } => {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  return { isOpen, open, close }
}
