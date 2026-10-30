import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGamepadController } from '../../hooks/gamepad/GamepadContext'
import { GAMEPAD_BUTTON } from '../../utils/gamepad/constants'
import { useGamepadButtonLabel } from '../gamepad/InputHint'
import { setActiveInputSource } from '../../utils/gamepad/inputSource'

type Props = {
  bindings: readonly [number, number, number]
  onChange: (bindings: [number, number, number]) => void
  onReset: () => void
}
export function ControllerSettings({ bindings, onChange, onReset }: Props) {
  const { t } = useTranslation('ui')
  const controller = useGamepadController()
  const [lane, setLane] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const capture = controller?.capture
  const onCaptured = useCallback(
    (button: number) => {
      if (lane === null) return
      if (button === GAMEPAD_BUTTON.START || button > 63) {
        setMessage(
          t('ui:controller.reserved', {
            defaultValue: 'This button is reserved.'
          })
        )
        setLane(null)
        return
      }
      const next: [number, number, number] = [...bindings]
      const other = next.indexOf(button)
      if (other !== -1 && other !== lane) {
        next[other] = next[lane]!
        setMessage(
          t('ui:controller.swapped', {
            defaultValue: '{{first}} and {{second}} bindings swapped.',
            first: t(
              `rhythm.lane_${(['guitar', 'drums', 'bass'] as const)[lane]}`
            ),
            second: t(
              `rhythm.lane_${(['guitar', 'drums', 'bass'] as const)[other]}`
            )
          })
        )
      } else setMessage('')
      next[lane] = button
      onChange(next)
      setLane(null)
    },
    [bindings, lane, onChange, t]
  )
  useEffect(() => {
    if (lane === null || !capture) return
    return capture(onCaptured)
  }, [capture, lane, onCaptured])
  useEffect(() => {
    if (lane === null) return
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (event.isTrusted) setActiveInputSource('keyboard')
      event.stopImmediatePropagation()
      setLane(null)
    }
    window.addEventListener('keydown', cancelOnEscape, true)
    return () => window.removeEventListener('keydown', cancelOnEscape, true)
  }, [lane])
  const gamepadButtonLabel = useGamepadButtonLabel()
  const family = controller?.status.devices[0]?.family ?? 'generic'
  return (
    <section>
      <h2 className='font-display text-4xl uppercase text-toxic-green mb-6 border-b border-ash-gray pb-2'>
        {t('ui:controller.title', { defaultValue: 'Controller' })}
      </h2>
      {!controller?.status.available ? (
        <p>
          {t('ui:controller.unavailable', {
            defaultValue: 'Controller API unavailable.'
          })}
        </p>
      ) : controller.status.devices.length === 0 ? (
        <p>
          {t('ui:controller.none', {
            defaultValue: 'No controller connected.'
          })}
        </p>
      ) : (
        controller.status.devices.map(device => (
          <p key={device.index}>
            {device.id} ({device.family}){' '}
            {!device.standard &&
              t('ui:controller.nonStandard', {
                defaultValue: 'Non-standard mapping; buttons may differ.'
              })}
          </p>
        ))
      )}
      {(['guitar', 'drums', 'bass'] as const).map((name, index) => (
        <div
          key={name}
          className='flex items-center justify-between gap-3 py-2'
        >
          <span>
            {t(`rhythm.lane_${name}`, { defaultValue: name })}:{' '}
            {gamepadButtonLabel(bindings[index]!, family)}
          </span>
          <button
            type='button'
            className='border border-toxic-green p-2'
            onClick={() => {
              setMessage('')
              setLane(index)
            }}
          >
            {t('ui:controller.rebind', { defaultValue: 'Rebind' })}
          </button>
        </div>
      ))}
      {lane !== null && (
        <div>
          <p>
            {t('ui:controller.capture', {
              defaultValue: 'Press a button. Start cancels.'
            })}
          </p>
          <button
            type='button'
            className='border border-toxic-green p-2'
            onClick={() => setLane(null)}
          >
            {t('ui:controller.cancel', { defaultValue: 'Cancel' })}
          </button>
        </div>
      )}
      <p aria-live='polite'>{message}</p>
      <button
        type='button'
        className='border border-toxic-green p-2'
        onClick={() => {
          setLane(null)
          onReset()
        }}
      >
        {t('ui:controller.reset', { defaultValue: 'Reset to default' })}
      </button>
    </section>
  )
}
