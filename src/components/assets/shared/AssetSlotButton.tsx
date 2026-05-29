import { useTranslation } from 'react-i18next'
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getModuleImagePrompt } from '../../../utils/imageGen'
import { getSlotButtonAriaLabel } from '../sections/slotLabels'
import type { SlotType } from '../../../types/assets'

export interface AssetSlotButtonProps {
  id: string
  slotType: SlotType
  installedModuleId: string | null
  onClick: (slotId: string) => void
  style?: React.CSSProperties
  className?: string
  imageAspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  imageSizeHint?: { width: number; height: number }
  ariaLabel?: string
  children?: React.ReactNode
}

export const AssetSlotButton = ({
  id,
  slotType,
  installedModuleId,
  onClick,
  style,
  className = 'absolute',
  imageAspectRatio = '1:1',
  imageSizeHint = { width: 256, height: 256 },
  ariaLabel,
  children
}: AssetSlotButtonProps) => {
  const { t } = useTranslation(['assets'])

  return (
    <button
      key={id}
      type='button'
      aria-label={
        ariaLabel ?? getSlotButtonAriaLabel(t, slotType, installedModuleId)
      }
      onClick={() => onClick(id)}
      className={className}
      style={{
        cursor: 'pointer',
        ...style
      }}
    >
      {installedModuleId ? (
        <GeneratedImagePanel
          prompt={getModuleImagePrompt(installedModuleId)}
          alt={t(`assets:module.${installedModuleId}.name`, {
            defaultValue: installedModuleId
          })}
          aspectRatio={imageAspectRatio}
          variant='hotspot'
          sizeHint={imageSizeHint}
          className='h-full w-full'
        />
      ) : children ? (
        children
      ) : null}
    </button>
  )
}
