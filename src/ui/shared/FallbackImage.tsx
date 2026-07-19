import { useState, type CSSProperties } from 'react'
import { getGeneratedImageFallbackUrl } from '../../utils/imageGen'

interface FallbackImageProps {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
}

/**
 * Renders an image that swaps to the shared generated-image fallback SVG when
 * the given source fails to load. Use for pre-resolved generated URLs passed
 * down as props (map icons, vans, band members) where the full
 * `GeneratedImagePanel` chrome (border, skeleton, aspect ratio) is wrong.
 * @param props - Image source URL, alt text, and optional class/style.
 */
export const FallbackImage = ({
  src,
  alt,
  className,
  style
}: FallbackImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  // Keying the failure on the src that failed means a src change retries the
  // new URL automatically, without an effect-based reset.
  const resolvedSrc = failedSrc === src ? getGeneratedImageFallbackUrl() : src

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      crossOrigin={resolvedSrc.startsWith('data:') ? undefined : 'anonymous'}
      className={className}
      style={style}
      onError={() => {
        // If the fallback itself failed, bail to avoid re-rendering with the
        // same broken src and re-triggering React's onError forever.
        if (resolvedSrc !== src) return
        setFailedSrc(src)
      }}
    />
  )
}
