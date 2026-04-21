import React, {
  useState,
  useId,
  cloneElement,
  isValidElement,
  useCallback
} from 'react'
import { logger } from '../../utils/logger'
import PropTypes from 'prop-types'

/**
 * Tooltip - Displays a floating tooltip on hover.
 * @param {Object} props
 * @param {React.ReactElement} props.children - The trigger element. Must be a valid React element.
 * @param {React.ReactNode} props.content - The tooltip content.
 * @param {string} [props.className] - Additional CSS classes for the container.
 */
export const Tooltip = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()

  const isDisabled =
    children?.props?.disabled ||
    children?.props?.['aria-disabled'] === true ||
    children?.props?.['aria-disabled'] === 'true' ||
    (typeof children?.props?.className === 'string' &&
      children.props.className.split(' ').includes('pointer-events-none')) ||
    children?.props?.style?.pointerEvents === 'none'

  const handleMouseEnter = useCallback(
    e => {
      setIsVisible(true)
      if (!isDisabled && children?.props?.onMouseEnter)
        children.props.onMouseEnter(e)
    },
    [children?.props, isDisabled]
  )

  const handleMouseLeave = useCallback(
    e => {
      setIsVisible(false)
      if (!isDisabled && children?.props?.onMouseLeave)
        children.props.onMouseLeave(e)
    },
    [children?.props, isDisabled]
  )

  const handleFocus = useCallback(
    e => {
      setIsVisible(true)
      if (!isDisabled && children?.props?.onFocus) children.props.onFocus(e)
    },
    [children?.props, isDisabled]
  )

  const handleBlur = useCallback(
    e => {
      setIsVisible(false)
      if (!isDisabled && children?.props?.onBlur) children.props.onBlur(e)
    },
    [children?.props, isDisabled]
  )

  const isValid = isValidElement(children)
  const isFragment = children && children.type === React.Fragment

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
    const existing = children.props['aria-describedby']
    if (!isVisible) return existing
    if (!existing) return tooltipId
    const ids = existing.split(' ').filter(Boolean)
    if (!ids.includes(tooltipId)) ids.push(tooltipId)
    return ids.join(' ')
  })()

  const isFullWidth =
    typeof children.props.className === 'string' &&
    children.props.className.split(' ').includes('w-full')

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
    cloneElement(children, {
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
