import { motion } from 'framer-motion'
import type { Transition } from 'framer-motion'
import PropTypes from 'prop-types'
import type { ElementType, ReactNode } from 'react'

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

export const AnimatedSubtitle = ({
  as = 'h2',
  initial,
  animate,
  transition,
  className = '',
  children
}: {
  as?: string | ElementType
  initial?: unknown
  animate?: unknown
  transition?: Transition
  className?: string
  children: ReactNode
}) => {
  // Access motion[...] dynamically; framer-motion provides typed helpers
  const motionRecord = motion as unknown as Record<string, ElementType>
  const MotionComponent =
    typeof as === 'string' ? motionRecord[as] || motion.h2 : motion(as)

  return (
    <MotionComponent
      initial={initial}
      animate={animate}
      transition={transition}
      className={`uppercase ${className}`}
    >
      {children}
    </MotionComponent>
  )
}

AnimatedSubtitle.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  initial: PropTypes.object,
  animate: PropTypes.object,
  transition: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
}
