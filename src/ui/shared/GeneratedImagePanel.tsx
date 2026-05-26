import { useEffect, useState, type CSSProperties } from 'react'
import {
  resolveGenImageUrl,
  getGeneratedImageFallbackUrl,
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

  // Reset load/error state whenever the prompt changes — otherwise a previously
  // successful image keeps `opacity: 1` during the new image's network round-trip
  // (flicker), or a previously errored image stays on the fallback forever.
  useEffect(() => {
    requestAnimationFrame(() => {
      setLoaded(false)
      setErrored(false)
    })
  }, [prompt])

  // resolveGenImageUrl already checks navigator.onLine and returns the
  // fallback SVG when offline — no double-check needed here. Only the
  // <img>-level onError path branches us explicitly to the fallback.
  const baseSrc = errored
    ? getGeneratedImageFallbackUrl()
    : resolveGenImageUrl(prompt)
  const src = sizeHint
    ? appendImageSize(baseSrc, sizeHint.width, sizeHint.height)
    : baseSrc

  const style: CSSProperties = {
    aspectRatio: ASPECT_CSS[aspectRatio],
    background: 'var(--color-void)',
    border: '2px solid var(--section-accent, var(--color-toxic-green))',
    boxShadow: '4px 4px 0 var(--color-void)',
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
          className='gen-image-skeleton'
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, transparent, var(--color-toxic-green) 30%, transparent)',
            opacity: 0.2,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading='lazy'
        onLoad={() => {
          setLoaded(true)
          onLoad?.()
        }}
        onError={() => {
          // If the fallback itself failed, bail to avoid re-rendering with
          // the same broken src and triggering React's onError forever.
          // Clearing the DOM onerror handler does not detach React's
          // synthetic listener, so we gate on `errored` state instead.
          if (errored) return
          setErrored(true)
        }}
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
