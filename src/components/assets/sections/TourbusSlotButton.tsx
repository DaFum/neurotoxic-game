import { AssetSlotButton } from '../shared/AssetSlotButton'
import type { SlotType } from '../../../types/assets'

/**
 * Configuration properties for the TourbusSlotButton component.
 */
interface Props {
  id: string
  slotType: SlotType
  installedModuleId: string | null
  onClick: (slotId: string) => void
  left: string | number
  top: string | number
  variant?: 'vehicle' | 'trailer'
  ariaLabel?: string
}

/**
 * Renders an interactive slot button for the Tourbus asset section.
 *
 * @remarks
 * Displays either a vehicle or trailer styled slot button, visually indicating if a module is installed
 * and providing an interface for module management.
 *
 * @param props - The component configuration properties
 * @returns The rendered slot button element
 */
export const TourbusSlotButton = ({
  id,
  slotType,
  installedModuleId,
  onClick,
  left,
  top,
  variant = 'vehicle',
  ariaLabel
}: Props) => {
  const isTrailer = variant === 'trailer'

  return (
    <AssetSlotButton
      id={id}
      slotType={slotType}
      installedModuleId={installedModuleId}
      onClick={onClick}
      ariaLabel={ariaLabel}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${
        isTrailer
          ? 'h-9 w-9 sm:h-12 sm:w-12'
          : 'border-2 h-9 w-9 sm:h-12 sm:w-12 md:h-16 md:w-16'
      }`}
      imageSizeHint={{ width: 128, height: 128 }}
      style={{
        left,
        top,
        border: isTrailer
          ? '2px dashed var(--section-accent, var(--color-toxic-green))'
          : undefined,
        borderColor: isTrailer
          ? undefined
          : 'var(--section-accent, var(--color-toxic-green))',
        borderRadius: isTrailer ? undefined : '50%',
        background:
          installedModuleId && !isTrailer
            ? 'transparent'
            : 'var(--color-hotspot-bg)',
        color: isTrailer
          ? 'var(--section-accent, var(--color-toxic-green))'
          : undefined
      }}
    >
      {!installedModuleId &&
        (isTrailer ? (
          '+'
        ) : (
          <span
            className='text-base sm:text-xl md:text-2xl'
            style={{
              color: 'var(--section-accent, var(--color-toxic-green))'
            }}
          >
            +
          </span>
        ))}
    </AssetSlotButton>
  )
}
