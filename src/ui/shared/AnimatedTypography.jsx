import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

export const AnimatedDivider = ({
  width = '100%',
  transition,
  className = ''
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
  initial,
  animate,
  transition,
  className = '',
  children
}) => (
  <motion.h2
    initial={initial}
    animate={animate}
    transition={transition}
    className={`uppercase ${className}`}
  >
    {children}
  </motion.h2>
)

AnimatedSubtitle.propTypes = {
  initial: PropTypes.object,
  animate: PropTypes.object,
  transition: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
}
