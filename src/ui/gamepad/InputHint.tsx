import { useTranslation } from 'react-i18next'
import { InputHint as SharedInputHint } from '../shared/InputHint'
import { useGamepadController } from '../../hooks/gamepad/GamepadContext'
import { useActiveInputSource } from '../../utils/gamepad/inputSource'
import { gamepadButtonLabel } from '../../utils/gamepad/labels'
import type { LayoutFamily } from '../../types/gamepad'
import { DEFAULT_GAMEPAD_LANE_BINDINGS } from '../../utils/gamepad/constants'

export function useGamepadButtonLabel() {
  const { t } = useTranslation('ui')
  return (button: number, family: LayoutFamily) =>
    gamepadButtonLabel(button, family, number =>
      t('ui:controller.button', { defaultValue: 'Button {{number}}', number })
    )
}

type InputHintProps = {
  action: 'confirm' | 'back' | 'menu' | 'help' | 'direction' | 'lane'
  lane?: number
}
export function InputHint({ action, lane = 0 }: InputHintProps) {
  const source = useActiveInputSource()
  const controller = useGamepadController()
  const buttonLabel = useGamepadButtonLabel()
  const bindings = controller?.bindings ?? DEFAULT_GAMEPAD_LANE_BINDINGS
  const button =
    action === 'confirm'
      ? 0
      : action === 'back'
        ? 1
        : action === 'menu'
          ? 9
          : action === 'help'
            ? 8
            : (bindings[lane] ?? 0)
  const label =
    action === 'direction'
      ? '↕ ↔'
      : source === 'gamepad'
        ? buttonLabel(
            button,
            controller?.status.devices[0]?.family ?? 'generic'
          )
        : action === 'lane'
          ? ['←', '↓', '→'][lane]
          : action === 'confirm'
            ? 'Enter'
            : action === 'help'
              ? '?'
              : 'Esc'
  return <SharedInputHint label={label} />
}

export function GamepadHint({
  action,
  children
}: {
  action: InputHintProps['action']
  children: React.ReactNode
}) {
  const source = useActiveInputSource()
  if (source !== 'gamepad') return null
  return (
    <span className='text-xs font-mono text-ash-gray'>
      <InputHint action={action} /> {children}
    </span>
  )
}
