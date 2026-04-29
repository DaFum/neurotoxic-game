import React, {
  useState,
  useId,
  cloneElement,
  isValidElement,
  useCallback
} from 'react'
import { logger } from '../../utils/logger'
import PropTypes from 'prop-types'
import type { ReactElement, ReactNode, SyntheticEvent } from 'react'

const getOwn = <T,>(
  obj: Record<string, unknown>,
  key: string
): T | undefined => {
  if (!Object.hasOwn(obj, key)) return undefined
  return obj[key] as T
}

/**
 * Tooltip - Displays a floating tooltip on hover.
 * @param {Object} props
 * @param {React.ReactElement} props.children - The trigger element. Must be a valid React element.
 * @param {React.ReactNode} props.content - The tooltip content.
 * @param {string} [props.className] - Additional CSS classes for the container.
 */
export const Tooltip = ({
  children,
  content,
  className = ''
}: {
  children: ReactElement
  content: ReactNode
  className?: string
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()

  const isValid = isValidElement(children)
  const isFragment = isValid && children.type === React.Fragment
  const child = isValid && !isFragment ? children : null
  const childProps =
    child && typeof child.props === 'object' && child.props !== null
      ? (child.props as Record<string, unknown>)
      : {}

  const classNameValue = getOwn<string>(childProps, 'className')
  const ariaDisabled = getOwn<unknown>(childProps, 'aria-disabled')
  const styleValue = getOwn<unknown>(childProps, 'style')

  const isDisabled =
    Boolean(getOwn<unknown>(childProps, 'disabled')) ||
    ariaDisabled === true ||
    ariaDisabled === 'true' ||
    (typeof classNameValue === 'string' &&
      classNameValue.split(' ').includes('pointer-events-none')) ||
    (typeof styleValue === 'object' &&
      styleValue !== null &&
      Object.hasOwn(styleValue as Record<string, unknown>, 'pointerEvents') &&
      (styleValue as Record<string, unknown>).pointerEvents === 'none')

  const handleMouseEnter = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(true)
      const fn = getOwn<unknown>(childProps, 'onMouseEnter')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const handleMouseLeave = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(false)
      const fn = getOwn<unknown>(childProps, 'onMouseLeave')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const handleFocus = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(true)
      const fn = getOwn<unknown>(childProps, 'onFocus')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const handleBlur = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(false)
      const fn = getOwn<unknown>(childProps, 'onBlur')
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

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
      className={`inline-block ${isFullWidth ? 'w-full' : ''}`}
      tabIndex={0}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
      'aria-describedby': computedAriaDescribedBy
    })
  )

  return (
    <div
      className={`${isFullWidth ? 'block w-full' : 'inline-block'} ${className?.split(/\s+/).includes('absolute') ? '' : 'relative'} ${className}`}
    >
      {trigger}
      {isVisible && (
        <div
          id={tooltipId}
          role='tooltip'
          className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-void-black border border-ash-gray shadow-lg z-50 text-xs text-star-white'
        >
          {content}
        </div>
      )}
    </div>
  )
}

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  className: PropTypes.string
}
