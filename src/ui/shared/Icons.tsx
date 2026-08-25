import { useId, memo, type ReactNode, type SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Draws the razor play SVG icon.
 * @param props - Optional class for the play icon.
 */
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

/**
 * Draws the void skull SVG icon.
 * @param props - Optional class for the skull icon.
 */
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
  fill = 'none',
  ...props
}: IconProps & {
  viewBox?: string
  title?: string
  children?: ReactNode
  fill?: string
  stroke?: string
}) {
  const titleId = useId()
  return (
    <svg
      aria-hidden={!title}
      focusable={title ? undefined : 'false'}
      role={title ? 'img' : 'presentation'}
      aria-labelledby={title ? titleId : undefined}
      fill={fill}
      xmlns='http://www.w3.org/2000/svg'
      preserveAspectRatio='xMidYMid meet'
      {...props}
      className={className}
      viewBox={viewBox}
    >
      {title && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  )
})

/**
 * Draws the Bandcamp SVG icon.
 * @param props - Optional class and SVG props for the Bandcamp icon.
 */
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

/**
 * Draws the Instagram SVG icon.
 * @param props - Optional class and SVG props for the Instagram icon.
 */
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

/**
 * Draws the TikTok SVG icon.
 * @param props - Optional class and SVG props for the TikTok icon.
 */
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

/**
 * Draws the YouTube SVG icon.
 * @param props - Optional class and SVG props for the YouTube icon.
 */
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

/**
 * Draws the blog/newsletter SVG icon.
 * @param props - Optional class and SVG props for the blog icon.
 */
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

/**
 * Draws the generic game SVG icon.
 * @param props - Optional class and SVG props for the game icon.
 */
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

/**
 * Draws one reusable UI frame-corner SVG marker.
 * @param props - Optional class for the frame-corner ornament.
 */
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

const IconChevronBase = memo(function IconChevronBase({
  className,
  d
}: {
  className: string
  d: string
}) {
  return (
    <svg
      aria-hidden='true'
      focusable='false'
      role='presentation'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      className={className}
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d={d} />
    </svg>
  )
})

export const IconChevronDown = memo(function IconChevronDown({
  className = 'w-5 h-5'
}: IconProps) {
  return <IconChevronBase className={className} d='m6 9 6 6 6-6' />
})

export const IconChevronUp = memo(function IconChevronUp({
  className = 'w-5 h-5'
}: IconProps) {
  return <IconChevronBase className={className} d='m18 15-6-6-6 6' />
})

export const IconStar = memo(function IconStar({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon className={className} fill='currentColor' {...props}>
      <path d='M11.999 1.439l2.844 7.218 7.718.666-5.859 5.093 1.764 7.584-6.467-3.968-6.467 3.968 1.764-7.584-5.859-5.093 7.718-.666 2.844-7.218z' />
    </BaseIcon>
  )
})
export const IconClock = memo(function IconClock({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon
      className={className}
      fill='none'
      stroke='currentColor'
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </BaseIcon>
  )
})
export const IconTrophy = memo(function IconTrophy({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon className={className} fill='currentColor' {...props}>
      <path d='M21 4h-3V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1H3a1 1 0 00-1 1v3c0 2.2 1.8 4 4 4h1v1.6c0 1.9 1.5 3.4 3.4 3.4H9v3a1 1 0 001 1h4a1 1 0 001-1v-3h-1.4c1.9 0 3.4-1.5 3.4-3.4V12h1c2.2 0 4-1.8 4-4V5a1 1 0 00-1-1zM6 10c-1.1 0-2-.9-2-2V6h2v4zm14-2c0 1.1-.9 2-2 2h-2V6h2v2z' />
    </BaseIcon>
  )
})
export const IconCoin = memo(function IconCoin({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon className={className} fill='currentColor' {...props}>
      <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.26.28 2.62 1.15 2.84 2.99h-1.96c-.15-.97-.9-1.62-2.31-1.62-1.45 0-2.13.79-2.13 1.48 0 .84.53 1.36 2.88 1.9 2.5.58 3.97 1.68 3.97 3.86 0 1.76-1.12 2.89-3.24 3.53z' />
    </BaseIcon>
  )
})
export const IconFire = memo(function IconFire({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon className={className} fill='currentColor' {...props}>
      <path d='M12 2C8 6 4 9 4 14a8 8 0 0016 0c0-5-4-8-8-12zm1 14a3 3 0 11-6 0c0-2 2-4 3-5 1 1 3 3 3 5z' />
    </BaseIcon>
  )
})
export const IconThumbUp = memo(function IconThumbUp({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon className={className} fill='currentColor' {...props}>
      <path d='M14 9V5a3 3 0 00-3-3l-4 9v11h11.3c1.4 0 2.6-1 2.8-2.3l2-11c.1-.8-.5-1.7-1.4-1.7H14zM4 11H1v11h3V11z' />
    </BaseIcon>
  )
})
export const IconCube = memo(function IconCube({
  className = '',
  ...props
}: IconProps) {
  return (
    <BaseIcon
      className={className}
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
    </BaseIcon>
  )
})
