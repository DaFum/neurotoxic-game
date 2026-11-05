import React, {
  useState,
  useId,
  cloneElement,
  isValidElement,
  useCallback,
  useRef
} from 'react'
import { logger } from '../../utils/logger'
import type {
  KeyboardEvent,
  ReactElement,
  ReactNode,
  SyntheticEvent
} from 'react'

const getOwn = <T,>(
  obj: Record<string, unknown>,
  key: string
): T | undefined => {
  if (!Object.hasOwn(obj, key)) return undefined
  return obj[key] as T
}

/**
 * Wraps one focusable/hoverable element with an accessible floating tooltip.
 * @param props - Trigger element, tooltip content, placement, and wrapper classes.
 */
export const Tooltip = ({
  children,
  content,
  className = '',
  position = 'top'
}: {
  children: ReactElement
  content: ReactNode
  className?: string
  position?: 'top' | 'bottom'
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()
  const isHoveredRef = useRef(false)
  const isFocusedRef = useRef(false)

  const isValid = isValidElement(children)
  const isFragment = isValid && children.type === React.Fragment
  const child = isValid && !isFragment ? children : null
  const childProps =
    child && typeof child.props === 'object' && child.props !== null
      ? (child.props as Record<string, unknown>)
      : {}

  const classNameValue = getOwn<string>(childProps, 'className')
  const styleValue = getOwn<unknown>(childProps, 'style')

  const isDisabled =
    Boolean(getOwn<unknown>(childProps, 'disabled')) ||
    (typeof classNameValue === 'string' &&
      classNameValue.split(' ').includes('pointer-events-none')) ||
    (typeof styleValue === 'object' &&
      styleValue !== null &&
      Object.hasOwn(styleValue as Record<string, unknown>, 'pointerEvents') &&
      (styleValue as Record<string, unknown>).pointerEvents === 'none')

  const childPropsRef = useRef(childProps)
  // Ensure ref is updated synchronously during render so stale handlers are never called
  // before the effect runs.
  childPropsRef.current = childProps

  const handleMouseEnter = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(true)
      const fn = getOwn<unknown>(childPropsRef.current, 'onMouseEnter')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [isDisabled]
  )

  const handleMouseLeave = useCallback(
    (e: SyntheticEvent) => {
      const fn = getOwn<unknown>(childPropsRef.current, 'onMouseLeave')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [isDisabled]
  )

  const handleFocus = useCallback(
    (e: SyntheticEvent) => {
      isFocusedRef.current = true
      setIsVisible(true)
      const fn = getOwn<unknown>(childPropsRef.current, 'onFocus')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [isDisabled]
  )

  const handleBlur = useCallback(
    (e: SyntheticEvent) => {
      isFocusedRef.current = false
      if (!isHoveredRef.current) setIsVisible(false)
      const fn = getOwn<unknown>(childPropsRef.current, 'onBlur')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [isDisabled]
  )

  // WCAG 1.4.13: Escape dismisses the tooltip without moving focus. The event
  // keeps propagating so an enclosing dialog's Escape handling still runs.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false)
      const fn = getOwn<unknown>(childPropsRef.current, 'onKeyDown')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [isDisabled]
  )

  // WCAG 1.4.13: a hover-opened tooltip has no focus on its trigger, so Escape
  // is also heard on the document while (and only while) it is visible.
  React.useEffect(() => {
    if (!isVisible) return undefined
    const onDocumentKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false)
    }
    document.addEventListener('keydown', onDocumentKeyDown)
    return () => document.removeEventListener('keydown', onDocumentKeyDown)
  }, [isVisible])

  React.useEffect(() => {
    if (!isValid) {
      logger.warn(
        'Tooltip',
        'Tooltip children must be a single valid React element.'
      )
    } else if (isFragment) {
      logger.warn(
        'Tooltip',
        'Tooltip children must be a single valid React element and not a Fragment.'
      )
    }
  }, [isValid, isFragment])

  if (content == null || content === false || content === '') {
    return children
  }

  if (!isValid || isFragment) {
    return children
  }

  const computedAriaDescribedBy = (() => {
    const existingValue = getOwn<unknown>(childProps, 'aria-describedby')
    const existing =
      typeof existingValue === 'string' ? existingValue : undefined
    if (!isVisible) return existing
    if (!existing) return tooltipId
    const ids = existing.split(' ').filter(Boolean)
    if (!ids.includes(tooltipId)) ids.push(tooltipId)
    return ids.join(' ')
  })()

  const isFullWidth =
    typeof classNameValue === 'string' &&
    classNameValue.split(' ').includes('w-full')

  const trigger = isDisabled ? (
    <span
      className={`inline-block cursor-not-allowed ${isFullWidth ? 'w-full' : ''}`}
      tabIndex={0}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-describedby={computedAriaDescribedBy}
    >
      {children}
    </span>
  ) : (
    // eslint-disable-next-line @eslint-react/no-clone-element
    cloneElement(children as ReactElement<Record<string, unknown>>, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      'aria-describedby': computedAriaDescribedBy
    })
  )

  return (
    <div
      onMouseEnter={() => {
        isHoveredRef.current = true
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
        if (!isFocusedRef.current) setIsVisible(false)
      }}
      className={`${isFullWidth ? 'block w-full' : 'inline-block'} ${className?.split(/\s+/).includes('absolute') ? '' : 'relative'} ${className}`}
    >
      {trigger}
      {isVisible && (
        <div
          id={tooltipId}
          role='tooltip'
          className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 w-48 p-2 bg-void-black border border-ash-gray shadow-lg z-(--z-toast) text-xs text-star-white ${position === 'bottom' ? 'top-full before:absolute before:inset-x-0 before:bottom-full before:h-2 translate-y-2' : 'bottom-full before:absolute before:inset-x-0 before:top-full before:h-2 -translate-y-2'}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
