import { motion } from 'framer-motion'
import type { HTMLMotionProps, Transition } from 'framer-motion'
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
  <motion.div
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
  if (as === 'h1') return <motion.h1 {...props}>{children}</motion.h1>
  if (as === 'h3') return <motion.h3 {...props}>{children}</motion.h3>
  if (as === 'h4') return <motion.h4 {...props}>{children}</motion.h4>
  if (as === 'p') return <motion.p {...props}>{children}</motion.p>
  if (as === 'span') return <motion.span {...props}>{children}</motion.span>
  if (as === 'div') return <motion.div {...props}>{children}</motion.div>
  return <motion.h2 {...props}>{children}</motion.h2>
}
