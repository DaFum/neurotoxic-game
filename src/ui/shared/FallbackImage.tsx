import { useState } from 'react'
import { getGeneratedImageFallbackUrl } from '../../utils/imageGen'

interface FallbackImageProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

/**
 * Renders an image that swaps to the shared generated-image fallback SVG when
 * the given source fails to load. Use for pre-resolved generated URLs passed
 * down as props (map icons, vans, band members) where the full
 * `GeneratedImagePanel` chrome (border, skeleton, aspect ratio) is wrong.
 * @param props - Image source URL, alt text, optional class, and optional fallback URL.
 */
export const FallbackImage = ({
  src,
  alt,
  className,
  fallbackSrc
}: FallbackImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  // Keying the failure on the src that failed means a src change retries the
  // new URL automatically, without an effect-based reset.
  const hasFailed = failedSrc === src
  const resolvedSrc = hasFailed
    ? (fallbackSrc ?? getGeneratedImageFallbackUrl())
    : src

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      aria-hidden={alt === '' ? 'true' : undefined}
      crossOrigin={resolvedSrc.startsWith('data:') ? undefined : 'anonymous'}
      className={className}
      onError={
        hasFailed
          ? undefined
          : event => {
              event.currentTarget.onerror = null
              setFailedSrc(src)
            }
      }
    />
  )
}
