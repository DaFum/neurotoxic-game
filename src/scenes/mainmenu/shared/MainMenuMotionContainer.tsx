import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'

interface MainMenuMotionContainerProps {
  children: ReactNode
  className?: string
  delay?: number
}

export const MainMenuMotionContainer = ({
  children,
  className,
  delay = 1.2
}: MainMenuMotionContainerProps) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
