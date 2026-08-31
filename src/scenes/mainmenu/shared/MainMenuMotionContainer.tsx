import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { ReactNode } from 'react'
import { MOTION_DURATIONS } from '../../../config/motion'

/**
 * Props for configuring the animation container within the main menu.
 */
interface MainMenuMotionContainerProps {
  /** The child elements to be animated. */
  children: ReactNode
  /** Optional CSS classes to apply to the motion container. */
  className?: string
  /** The duration in seconds to wait before beginning the animation. */
  delay?: number
}

/**
 * A wrapper component that applies a delayed fade-in animation to its contents.
 *
 * @remarks
 * This component automatically respects the user's system preferences for reduced motion.
 * If reduced motion is preferred, the fade-in animation and its delay are bypassed entirely,
 * rendering the contents immediately.
 *
 * @param props - The component properties.
 * @returns A Motion for React div containing the animated children.
 *
 * @example
 * ```tsx
 * <MainMenuMotionContainer delay={0.5} className="my-custom-class">
 *   <h1>Welcome to Neurotoxic</h1>
 * </MainMenuMotionContainer>
 * ```
 */
export const MainMenuMotionContainer = ({
  children,
  className,
  delay = 1.2
}: MainMenuMotionContainerProps) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <m.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        prefersReducedMotion ? { duration: MOTION_DURATIONS.instant } : { delay }
      }
      className={className}
    >
      {children}
    </m.div>
  )
}
