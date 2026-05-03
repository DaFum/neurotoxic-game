import { motion } from 'framer-motion'
import type { HTMLMotionProps, Transition } from 'framer-motion'
import PropTypes from 'prop-types'
import type { ReactNode } from 'react'

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
    className={`h-[2px] ${className}`}
  />
)

AnimatedDivider.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  transition: PropTypes.object,
  className: PropTypes.string
}

type MotionTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

type AnimatedSubtitleProps = {
  as?: MotionTag
  initial?: HTMLMotionProps<'div'>['initial']
  animate?: HTMLMotionProps<'div'>['animate']
  transition?: Transition
  className?: string
  children: ReactNode
}

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

AnimatedSubtitle.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  initial: PropTypes.object,
  animate: PropTypes.object,
  transition: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
}
