import { useId, memo, type ReactNode, type SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string
}

export const RazorPlayIcon = memo(function RazorPlayIcon({
  className = ''
}: IconProps) {
  return (
    <svg
      className={`text-toxic-green ${className}`}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
      preserveAspectRatio='xMidYMid meet'
    >
      <path
        d='M4 2V22L22 12L4 2Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path d='M7 6V18L17 12L7 6Z' fill='currentColor' />

      <rect
        x='0'
        y='11'
        width='24'
        height='2'
        fill='var(--color-void-black)'
        opacity='0.8'
      >
        <animate
          attributeName='y'
          values='2; 20; 2'
          dur='2s'
          repeatCount='indefinite'
        />
      </rect>
      <rect x='2' y='12' width='20' height='1' fill='currentColor'>
        <animate
          attributeName='opacity'
          values='1;0;1;0;1'
          dur='0.1s'
          repeatCount='indefinite'
          begin='5s'
        />
      </rect>
    </svg>
  )
})

export const VoidSkullIcon = memo(function VoidSkullIcon({
  className = ''
}: IconProps) {
  return (
    <svg
      className={`text-toxic-green ${className}`}
      viewBox='0 0 32 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
      preserveAspectRatio='xMidYMid meet'
    >
      <path
        d='M8 4H24V10H28V20H24V28H20V24H12V28H8V20H4V10H8V4Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
      />

      <rect x='10' y='12' width='4' height='4' fill='currentColor' />
      <rect x='18' y='12' width='4' height='4' fill='currentColor' />

      <rect x='14' y='20' width='4' height='2' fill='currentColor'>
        <animate
          attributeName='opacity'
          values='1;0;1;1;0.5'
          dur='0.3s'
          repeatCount='indefinite'
        />
      </rect>

      <line
        x1='2'
        y1='16'
        x2='30'
        y2='16'
        stroke='currentColor'
        strokeWidth='1'
        opacity='0.5'
      >
        <animate
          attributeName='y1'
          values='4;28;4'
          dur='4s'
          repeatCount='indefinite'
        />
        <animate
          attributeName='y2'
          values='4;28;4'
          dur='4s'
          repeatCount='indefinite'
        />
      </line>
    </svg>
  )
})

const BaseIcon = memo(function BaseIcon({
  className = '',
  viewBox = '0 0 24 24',
  title,
  children,
  ...props
}: IconProps & { viewBox?: string; title?: string; children?: ReactNode }) {
  const titleId = useId()
  return (
    <svg
      aria-hidden={!title}
      focusable={title ? undefined : 'false'}
      role={title ? 'img' : 'presentation'}
      aria-labelledby={title ? titleId : undefined}
      {...props}
      className={className}
      viewBox={viewBox}
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='xMidYMid meet'
    >
      {title && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  )
})

export const BandcampIcon = memo(function BandcampIcon({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon {...props} className={className}>
      <path
        d='M2 6H22V18H2V6Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <circle cx='8' cy='12' r='2' fill='currentColor' />
      <circle cx='16' cy='12' r='2' fill='currentColor' />
      <path
        d='M6 12H18'
        stroke='currentColor'
        strokeWidth='1'
        strokeDasharray='2 2'
      />
      <path d='M10 18L14 18' stroke='currentColor' strokeWidth='4' />
    </BaseIcon>
  )
})

export const InstaIcon = memo(function InstaIcon({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon {...props} className={className}>
      <path
        d='M3 3H21V21H3V3Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <circle cx='12' cy='12' r='4' stroke='currentColor' strokeWidth='2' />
      <rect x='16' y='6' width='2' height='2' fill='currentColor' />
      <path
        d='M12 2V4M12 20V22M2 12H4M20 12H22'
        stroke='currentColor'
        strokeWidth='2'
      />
    </BaseIcon>
  )
})

export const TikTokIcon = memo(function TikTokIcon({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon {...props} className={className} viewBox='-2 0 26 26'>
      <path d='M14 2V16H8V22H14V8H20V2H14Z' fill='currentColor' />
      <path
        d='M12 4V18H6V24H12V10H18V4H12Z'
        fill='currentColor'
        fillOpacity='0.3'
        transform='translate(-2, 2)'
      />
    </BaseIcon>
  )
})

export const YouTubeIcon = memo(function YouTubeIcon({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon {...props} className={className}>
      <path
        d='M2 5H22V19H2V5Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <path d='M10 9L16 12L10 15V9Z' fill='currentColor' />
      <path
        d='M4 19L8 23M20 19L16 23'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
    </BaseIcon>
  )
})

export const BlogIcon = memo(function BlogIcon({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon {...props} className={className}>
      <path
        d='M3 4H21V20H3V4Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <path
        d='M6 8L10 12L6 16'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
        strokeLinejoin='miter'
      />
      <path
        d='M12 16H18'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <rect
        x='3'
        y='4'
        width='18'
        height='4'
        fill='currentColor'
        fillOpacity='0.2'
      />
    </BaseIcon>
  )
})

export const GameIcon = memo(function GameIcon({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon {...props} className={className} viewBox='0 0 32 32'>
      <path
        d='M6 22V6H9L19 18V6H22V22H19L9 10V22H6Z'
        fill='currentColor'
        opacity='0.3'
        transform='translate(-2, 0)'
      />
      <path d='M8 24V8H11L21 20V8H24V24H21L11 12V24H8Z' fill='currentColor' />
    </BaseIcon>
  )
})

export const UIFrameCorner = memo(function UIFrameCorner({
  className = ''
}: IconProps) {
  return (
    <svg
      className={`text-toxic-green ${className}`}
      viewBox='0 0 48 48'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
      preserveAspectRatio='xMidYMid meet'
    >
      <path d='M2 46V2H46' stroke='currentColor' strokeWidth='4' fill='none' />

      <rect x='2' y='2' width='12' height='12' fill='currentColor' />

      <path
        d='M18 2L28 12H46'
        stroke='currentColor'
        strokeWidth='2'
        fill='none'
        strokeDasharray='4 4'
      />

      <path d='M8 18V26M4 22H12' stroke='currentColor' strokeWidth='1' />
    </svg>
  )
})
