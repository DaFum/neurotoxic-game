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
  const motionTagAllowlist = {
    h1: motion.h1,
    h2: motion.h2,
    h3: motion.h3,
    h4: motion.h4,
    p: motion.p,
    span: motion.span,
    div: motion.div
  } as const satisfies Record<string, ElementType>
  const MotionComponent =
    typeof as === 'string'
      ? Object.hasOwn(motionTagAllowlist, as)
        ? motionTagAllowlist[as]
        : motion.h2
      : motion(as)

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
