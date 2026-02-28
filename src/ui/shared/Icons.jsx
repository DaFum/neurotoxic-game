import PropTypes from 'prop-types'

export function RazorPlayIcon({ className = '' }) {
  return (
    <svg
      className={`text-(--toxic-green) ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 2V22L22 12L4 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M7 6V18L17 12L7 6Z" fill="currentColor" />

      <rect x="0" y="11" width="24" height="2" fill="var(--void-black)" opacity="0.8">
        <animate
          attributeName="y"
          values="2; 20; 2"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="2" y="12" width="20" height="1" fill="currentColor">
        <animate
          attributeName="opacity"
          values="1;0;1;0;1"
          dur="0.1s"
          repeatCount="indefinite"
          begin="5s"
        />
      </rect>
    </svg>
  )
}

RazorPlayIcon.propTypes = {
  className: PropTypes.string
}

export function VoidSkullIcon({ className = '' }) {
  return (
    <svg
      className={`text-(--toxic-green) ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 4H24V10H28V20H24V28H20V24H12V28H8V20H4V10H8V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      <rect x="10" y="12" width="4" height="4" fill="currentColor" />
      <rect x="18" y="12" width="4" height="4" fill="currentColor" />

      <rect x="14" y="20" width="4" height="2" fill="currentColor">
        <animate
          attributeName="opacity"
          values="1;0;1;1;0.5"
          dur="0.3s"
          repeatCount="indefinite"
        />
      </rect>

      <line
        x1="2"
        y1="16"
        x2="30"
        y2="16"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      >
        <animate
          attributeName="y1"
          values="4;28;4"
          dur="4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="y2"
          values="4;28;4"
          dur="4s"
          repeatCount="indefinite"
        />
      </line>
    </svg>
  )
}

VoidSkullIcon.propTypes = {
  className: PropTypes.string
}

export function UIFrameCorner({ className = '' }) {
  return (
    <svg
      className={`text-(--toxic-green) ${className}`}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 46V2H46"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />

      <rect x="2" y="2" width="12" height="12" fill="currentColor" />

      <path
        d="M18 2L28 12H46"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
      />

      <path
        d="M8 18V26M4 22H12"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
}

UIFrameCorner.propTypes = {
  className: PropTypes.string
}
