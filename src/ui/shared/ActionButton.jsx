/**
 * ActionButton - A standardized action button for overlays and dialogues.
 * @module ActionButton
 */

import { memo } from 'react'
import PropTypes from 'prop-types'

/**
 * ActionButton - A standardized action button for overlays and dialogues.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label.
 * @param {Function} [props.onClick] - Click handler (optional).
 * @param {string} [props.type='button'] - Button type attribute.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {React.Ref} [props.ref] - Forwarded ref.
 */
export const ActionButton = memo(
  ({ children, onClick, type = 'button', className = '', ref, ...rest }) => (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      className={`px-8 py-4 bg-(--toxic-green) text-(--void-black) font-bold uppercase
                hover:scale-105 transition-transform
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--toxic-green-20)
                ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
)

ActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  ref: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ])
}
