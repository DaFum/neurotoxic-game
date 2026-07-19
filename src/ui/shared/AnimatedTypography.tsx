import { animate } from 'animejs'
import type { AnimationParams } from 'animejs'
import {
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode
} from 'react'

type AnimeTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'

type AnimeEntrance = Partial<
  Pick<
    AnimationParams,
    | 'opacity'
    | 'x'
    | 'y'
    | 'scale'
    | 'width'
    | 'letterSpacing'
    | 'duration'
    | 'delay'
    | 'ease'
  >
>

type AnimeElementProps = {
  as?: AnimeTag
  className?: string
  children?: ReactNode
  style?: CSSProperties
  animation?: AnimeEntrance
}

const DEFAULT_EASE = 'outCubic'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Runs a scoped Anime.js animation on a React element and reverts it on unmount.
 * @param animation - Anime.js parameters for the mounted element.
 */
export const useAnime = <TElement extends HTMLElement>(
  animation: AnimeEntrance | undefined
) => {
  const targetRef = useRef<TElement | null>(null)
  const serializedAnimation = animation ? JSON.stringify(animation) : ''
  const ref = useCallback((node: TElement | null) => {
    targetRef.current = node
  }, [])

  useLayoutEffect(() => {
    if (!animation || prefersReducedMotion() || typeof NodeList === 'undefined')
      return undefined
    const target = targetRef.current
    if (!target) return undefined

    const instance = animate(target, {
      duration: 300,
      ease: DEFAULT_EASE,
      ...animation
    })

    return () => {
      instance.revert()
    }
    // Anime params are primitive/primitive-array config; serialize to avoid object-literal reruns.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [serializedAnimation])

  return ref
}

/**
 * Displays an animated divider line with configurable width and timing.
 * @param props - Divider width, animation timing, and optional classes.
 */
export const AnimatedDivider = ({
  width = '100%',
  animation,
  className = ''
}: {
  width?: string | number
  animation?: Omit<AnimeEntrance, 'width'>
  className?: string
}) => {
  const ref = useAnime<HTMLDivElement>({
    width: [0, width],
    duration: 450,
    ...animation
  })

  return <div ref={ref} className={`h-0.5 ${className}`} style={{ width }} />
}

const animeDefaultEntrance = {
  opacity: [0, 1],
  y: [10, 0],
  duration: 350,
  ease: DEFAULT_EASE
} as const satisfies AnimeEntrance

/**
 * Displays subtitle text with animated entrance timing.
 * @param props - Rendered element type, Anime.js animation, classes, and content.
 */
export const AnimatedSubtitle = ({
  as = 'h2',
  animation = animeDefaultEntrance,
  className = '',
  children,
  style
}: AnimeElementProps) => {
  const ref = useAnime<HTMLElement>(animation)

  if (as === 'h1')
    return (
      <h1 ref={ref} className={`uppercase ${className}`} style={style}>
        {children}
      </h1>
    )
  if (as === 'h3')
    return (
      <h3 ref={ref} className={`uppercase ${className}`} style={style}>
        {children}
      </h3>
    )
  if (as === 'h4')
    return (
      <h4 ref={ref} className={`uppercase ${className}`} style={style}>
        {children}
      </h4>
    )
  if (as === 'p')
    return (
      <p ref={ref} className={`uppercase ${className}`} style={style}>
        {children}
      </p>
    )
  if (as === 'span')
    return (
      <span ref={ref} className={`uppercase ${className}`} style={style}>
        {children}
      </span>
    )
  if (as === 'div')
    return (
      <div ref={ref} className={`uppercase ${className}`} style={style}>
        {children}
      </div>
    )
  return (
    <h2 ref={ref} className={`uppercase ${className}`} style={style}>
      {children}
    </h2>
  )
}
