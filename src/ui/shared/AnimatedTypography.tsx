import { m } from 'motion/react'
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
    initial={{ width: 0 }}
    animate={{ width }}
    transition={transition}
    className={`h-0.5 ${className}`}
  />
)
type MotionTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

type AnimatedSubtitleProps = {
  as?: MotionTag
  initial?: HTMLMotionProps<'div'>['initial']
  animate?: HTMLMotionProps<'div'>['animate']
  transition?: Transition
  className?: string
  children: ReactNode
}

/**
 * Displays subtitle text with animated entrance timing.
 * @param props - Rendered element type, animation states, transition, classes, and content.
 */
export const AnimatedSubtitle = ({
  as = 'h2',
  initial,
  animate,
  transition,
  className = '',
  children
}: AnimatedSubtitleProps) => {
  const props = {
    initial,
    animate,
    transition,
    className: `uppercase ${className}`
  }
  if (as === 'h1') return <m.h1 {...props}>{children}</m.h1>
  if (as === 'h3') return <m.h3 {...props}>{children}</m.h3>
  if (as === 'h4') return <m.h4 {...props}>{children}</m.h4>
  if (as === 'p') return <m.p {...props}>{children}</m.p>
  if (as === 'span') return <m.span {...props}>{children}</m.span>
  if (as === 'div') return <m.div {...props}>{children}</m.div>
  return <m.h2 {...props}>{children}</m.h2>
}
