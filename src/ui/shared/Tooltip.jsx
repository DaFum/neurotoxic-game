import React, { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * Tooltip - Displays a floating tooltip on hover.
 * @param {Object} props
 * @param {React.ReactNode} props.children - The trigger element.
 * @param {React.ReactNode} props.content - The tooltip content.
 * @param {string} [props.className] - Additional CSS classes for the container.
 */
export const Tooltip = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-(--void-black) border border-(--ash-gray) shadow-lg z-50 text-xs text-(--star-white) pointer-events-none'>
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
