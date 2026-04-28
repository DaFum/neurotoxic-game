import { motion } from 'framer-motion'
import type { HTMLMotionProps, Transition } from 'framer-motion'
import PropTypes from 'prop-types'
import type { ComponentType, ElementType, ReactNode } from 'react'

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

const motionTagAllowlist = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  p: motion.p,
  span: motion.span,
  div: motion.div
} as const satisfies Record<MotionTag, ElementType>

export const AnimatedSubtitle = ({
  as = 'h2',
  initial,
  animate,
  transition,
  className = '',
  children
}: {
  as?: MotionTag | ComponentType
  initial?: HTMLMotionProps<'div'>['initial']
  animate?: HTMLMotionProps<'div'>['animate']
  transition?: Transition
  className?: string
  children: ReactNode
}) => {
  const MotionComponent =
    typeof as === 'string' ? motionTagAllowlist[as] : motion(as)

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
