import { useState, type CSSProperties } from 'react'
import {
  resolveGenImageUrl,
  getGeneratedImageFallbackUrl,
  isImageGenerationAvailable,
  appendImageSize
} from '../../utils/imageGen'

export interface GeneratedImagePanelProps {
  prompt: string
  alt: string
  aspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  className?: string
  onLoad?: () => void
  variant?: 'card' | 'inline' | 'hotspot'
  sizeHint?: { width: number; height: number }
}

const ASPECT_CSS: Record<
  NonNullable<GeneratedImagePanelProps['aspectRatio']>,
  string
> = {
  '16:9': '16 / 9',
  '1:1': '1 / 1',
  '4:3': '4 / 3',
  '3:4': '3 / 4',
  '21:9': '21 / 9'
}

export const GeneratedImagePanel = ({
  prompt,
  alt,
  aspectRatio = '16:9',
  className = '',
  onLoad,
  variant = 'card',
  sizeHint
}: GeneratedImagePanelProps) => {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  let src = isImageGenerationAvailable()
    ? resolveGenImageUrl(prompt)
    : getGeneratedImageFallbackUrl()
  if (errored) src = getGeneratedImageFallbackUrl()
  if (sizeHint) src = appendImageSize(src, sizeHint.width, sizeHint.height)

  const style: CSSProperties = {
    aspectRatio: ASPECT_CSS[aspectRatio],
    background: 'var(--color-void, #000)',
    border: '2px solid var(--section-accent, var(--color-toxic-green))',
    boxShadow: '4px 4px 0 var(--color-void, #000)',
    position: 'relative',
    overflow: 'hidden'
  }

  return (
    <div
      className={`gen-image-panel gen-image-${variant} ${className}`}
      style={style}
    >
      {!loaded && !errored && (
        <div
          className="gen-image-skeleton"
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent, var(--color-toxic-green, #0f0) 30%, transparent)',
            opacity: 0.2,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => {
          setLoaded(true)
          onLoad?.()
        }}
        onError={() => setErrored(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 200ms'
        }}
      />
    </div>
  )
}
