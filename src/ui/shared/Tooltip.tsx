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

  const child = children as ReactElement & { props: Record<string, unknown> }
  const childProps = child.props as Record<string, unknown>

  const isDisabled =
    Boolean(childProps.disabled) ||
    childProps['aria-disabled'] === true ||
    childProps['aria-disabled'] === 'true' ||
    (typeof childProps.className === 'string' &&
      (childProps.className as string)
        .split(' ')
        .includes('pointer-events-none')) ||
    (childProps.style &&
      (childProps.style as Record<string, unknown>).pointerEvents === 'none')

  const handleMouseEnter = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(true)
      const fn = childProps.onMouseEnter
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const handleMouseLeave = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(false)
      const fn = childProps.onMouseLeave
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const handleFocus = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(true)
      const fn = childProps.onFocus
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const handleBlur = useCallback(
    (e: SyntheticEvent) => {
      setIsVisible(false)
      const fn = childProps.onBlur
      if (!isDisabled && typeof fn === 'function')
        (fn as (...args: unknown[]) => void)(e)
    },
    [childProps, isDisabled]
  )

  const isValid = isValidElement(children)
  const isFragment = children && (children as any).type === React.Fragment

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
    const existing = childProps['aria-describedby'] as string | undefined
    if (!isVisible) return existing
    if (!existing) return tooltipId
    const ids = existing.split(' ').filter(Boolean)
    if (!ids.includes(tooltipId)) ids.push(tooltipId)
    return ids.join(' ')
  })()

  const isFullWidth =
    typeof childProps.className === 'string' &&
    (childProps.className as string).split(' ').includes('w-full')

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
    cloneElement(
      children as ReactElement<any, any>,
      {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        'aria-describedby': computedAriaDescribedBy
      } as any
    )
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
