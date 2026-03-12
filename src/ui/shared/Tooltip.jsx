import React, { useState, useId, cloneElement, isValidElement } from 'react'
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

  if (!isValidElement(children)) {
    console.warn('Tooltip children must be a single valid React element.')
    return children
  }

  if (children.type === React.Fragment) {
    console.warn('Tooltip children must be a single valid React element and not a Fragment.')
    return children
  }

  // eslint-disable-next-line @eslint-react/no-clone-element
  const trigger = cloneElement(children, {
    onMouseEnter: (e) => {
      setIsVisible(true)
      if (children.props.onMouseEnter) children.props.onMouseEnter(e)
    },
    onMouseLeave: (e) => {
      setIsVisible(false)
      if (children.props.onMouseLeave) children.props.onMouseLeave(e)
    },
    onFocus: (e) => {
      setIsVisible(true)
      if (children.props.onFocus) children.props.onFocus(e)
    },
    onBlur: (e) => {
      setIsVisible(false)
      if (children.props.onBlur) children.props.onBlur(e)
    },
    'aria-describedby': (() => {
      const existing = children.props['aria-describedby']
      if (!isVisible) return existing
      if (!existing) return tooltipId
      const ids = existing.split(' ').filter(Boolean)
      if (!ids.includes(tooltipId)) ids.push(tooltipId)
      return ids.join(' ')
    })()
  })

  return (
    <div className={`inline-block relative ${className}`}>
      {trigger}
      {isVisible && (
        <div
          id={tooltipId}
          role='tooltip'
          className='pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-(--void-black) border border-(--ash-gray) shadow-lg z-50 text-xs text-(--star-white)'
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
