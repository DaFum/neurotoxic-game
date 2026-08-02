import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import { systemClock } from '../utils/clock'
import type { IClock } from '../utils/clock'

const ClockContext = createContext<IClock>(systemClock)

/**
 * Provides a clock to the tree below. Tests wrap with a fixed clock; the app
 * relies on the `systemClock` default.
 *
 * @param props - Clock to provide and the subtree receiving it.
 */
export const ClockProvider = ({
  clock,
  children
}: {
  clock: IClock
  children: ReactNode
}) => <ClockContext value={clock}>{children}</ClockContext>

/**
 * Reads the injected clock.
 *
 * @returns The clock provided by the nearest `ClockProvider`, or `systemClock`.
 */
export const useClock = (): IClock => use(ClockContext)
