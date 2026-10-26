import { useEffect, useState, type CSSProperties } from 'react'
import {
  resolveGenImageUrl,
  getGeneratedImageFallbackUrl,
  appendImageSize
} from '../../utils/imageGen'

/**
 * Generated-image prompt, layout, fallback, and load-state inputs.
 */
interface GeneratedImagePanelProps {
  prompt: string
  alt: string
  aspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  className?: string
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

/**
 * Displays a generated image with skeleton loading and offline/error fallback handling.
 * @param props - Image prompt, alt text, sizing, variant, and wrapper styling.
 */
export const GeneratedImagePanel = ({
  prompt,
  alt,
  aspectRatio = '16:9',
  className = '',
  variant = 'card',
  sizeHint
}: GeneratedImagePanelProps) => {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  // Reset load/error state whenever the image URL inputs (prompt or size hint)
  // change — otherwise a previously successful image keeps `opacity: 1` during
  // the new image's network round-trip (flicker), or a previously errored image
  // stays on the fallback forever. The size hint is tracked by its dimensions,
  // not its object identity, because callers pass inline literals.
  const sizeHintWidth = sizeHint?.width
  const sizeHintHeight = sizeHint?.height
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setLoaded(false)
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setErrored(false)
  }, [prompt, sizeHintWidth, sizeHintHeight])

  // resolveGenImageUrl already checks navigator.onLine and returns the
  // fallback SVG when offline — no double-check needed here. Only the
  // <img>-level onError path branches us explicitly to the fallback.
  const baseSrc = errored
    ? getGeneratedImageFallbackUrl()
    : resolveGenImageUrl(prompt)
  // The bundled fallback is precached by its exact URL; a size query would miss
  // the precache and fail offline, so only the remote URL gets sizing.
  const src =
    sizeHint && baseSrc !== getGeneratedImageFallbackUrl()
      ? appendImageSize(baseSrc, sizeHint.width, sizeHint.height)
      : baseSrc

  const style: CSSProperties = {
    aspectRatio: ASPECT_CSS[aspectRatio],
    background: 'var(--color-void-black)',
    border: '2px solid var(--section-accent, var(--color-toxic-green))',
    boxShadow: '4px 4px 0 var(--color-void-black)',
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
            opacity: 0.2
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className='gen-image-img'
        loading='lazy'
        crossOrigin={src.startsWith('data:') ? undefined : 'anonymous'}
        onLoad={() => setLoaded(true)}
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
          opacity: loaded ? 1 : 0
        }}
      />
    </div>
  )
}
