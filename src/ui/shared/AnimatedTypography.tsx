import * as m from 'motion/react-m'
import type { HTMLMotionProps, Transition } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Displays an animated divider line with configurable width and timing.
 * @param props - Divider width, animation transition, and optional classes.
 */
export const AnimatedDivider = ({
  width = '100%',
  transition,
  className = ''
}: {
  width?: string | number
  transition?: Transition
  className?: string
}) => (
  <m.div
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={transition}
    style={{ width, transformOrigin: 'center' }}
    className={`h-0.5 ${className}`}
  />
)
type AnimatedSubtitleProps = {
  initial?: HTMLMotionProps<'div'>['initial']
  animate?: HTMLMotionProps<'div'>['animate']
  transition?: Transition
  className?: string
  children: ReactNode
}

/**
 * Displays an `h2` subtitle with animated entrance timing.
 * @param props - Animation states, transition, classes, and content.
 */
export const AnimatedSubtitle = ({
  initial,
  animate,
  transition,
  className = '',
  children
}: AnimatedSubtitleProps) => (
  <m.h2
    initial={initial}
    animate={animate}
    transition={transition}
    className={`uppercase ${className}`}
  >
    {children}
  </m.h2>
)
