import * as m from 'motion/react-m'
import { ReactNode } from 'react'

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
 * MotionConfig reducedMotion="user" handles reduced motion preferences at root level.
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
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </m.div>
  )
}
