import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGamepadController } from '../../hooks/gamepad/GamepadContext'
import { isAssignableGamepadButton } from '../../utils/gamepad/constants'
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
      if (!isAssignableGamepadButton(button)) {
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
        <p className='text-ash-gray font-mono text-sm mb-4'>
          {t('ui:controller.unavailable', {
            defaultValue: 'Controller API unavailable.'
          })}
        </p>
      ) : controller.status.devices.length === 0 ? (
        <p className='text-ash-gray font-mono text-sm mb-4'>
          {t('ui:controller.none', {
            defaultValue: 'No controller connected.'
          })}
        </p>
      ) : (
        controller.status.devices.map(device => (
          <p
            key={device.index}
            className='text-ash-gray font-mono text-sm mb-4'
          >
            {device.id} ({device.family}){' '}
            {!device.standard &&
              t('ui:controller.nonStandard', {
                defaultValue: 'Non-standard mapping; buttons may differ.'
              })}
          </p>
        ))
      )}
      <div className='space-y-2 mb-6'>
        {(['guitar', 'drums', 'bass'] as const).map((name, index) => {
          const isListening = lane === index
          const laneLabel = t(`rhythm.lane_${name}`, { defaultValue: name })
          return (
            <div
              key={name}
              className={`flex items-center justify-between gap-3 p-3 border transition-colors ${
                isListening
                  ? 'border-toxic-green bg-toxic-green/10'
                  : 'border-ash-gray/30 bg-void-black/60'
              }`}
            >
              <span className='font-mono text-sm text-star-white'>
                <span className='text-toxic-green font-bold uppercase'>
                  {laneLabel}
                </span>
                :{' '}
                <span className='bg-ash-gray/20 px-2 py-0.5 text-xs text-toxic-green font-mono border border-toxic-green/30'>
                  {gamepadButtonLabel(bindings[index]!, family)}
                </span>
              </span>
              <button
                type='button'
                onClick={() => {
                  setMessage('')
                  setLane(isListening ? null : index)
                }}
                aria-pressed={isListening}
                aria-busy={isListening}
                aria-label={t('ui:controller.rebind_lane_aria', {
                  defaultValue: 'Rebind {{lane}} lane button',
                  lane: laneLabel
                })}
                className={`font-mono text-xs uppercase px-3 py-1.5 border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${
                  isListening
                    ? 'border-toxic-green bg-toxic-green text-void-black font-bold animate-pulse'
                    : 'border-toxic-green/60 text-toxic-green hover:bg-toxic-green hover:text-void-black'
                }`}
              >
                {isListening
                  ? t('ui:controller.listening', {
                      defaultValue: '[ PRESS BUTTON ]'
                    })
                  : t('ui:controller.rebind', { defaultValue: 'Rebind' })}
              </button>
            </div>
          )
        })}
      </div>

      {lane !== null && (
        <div className='p-3 border border-toxic-green/50 bg-toxic-green/5 mb-4 flex items-center justify-between gap-4'>
          <p
            className='font-mono text-xs text-toxic-green animate-pulse'
            aria-live='polite'
          >
            {t('ui:controller.capture', {
              defaultValue: 'Press a button. Start cancels.'
            })}
          </p>
          <button
            type='button'
            onClick={() => setLane(null)}
            aria-label={t('ui:controller.cancel_rebind_aria', {
              defaultValue: 'Cancel button rebind'
            })}
            className='font-mono text-xs uppercase px-3 py-1 border border-blood-red text-blood-red hover:bg-blood-red hover:text-void-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
          >
            {t('ui:controller.cancel', { defaultValue: 'Cancel' })}
          </button>
        </div>
      )}

      {message && (
        <p
          className='font-mono text-xs text-warning-yellow mb-4'
          aria-live='polite'
        >
          {message}
        </p>
      )}

      <button
        type='button'
        onClick={() => {
          setLane(null)
          onReset()
        }}
        aria-label={t('ui:controller.reset_aria', {
          defaultValue: 'Reset controller bindings to default'
        })}
        className='font-mono text-xs uppercase px-3 py-2 border border-ash-gray/60 text-ash-gray hover:border-toxic-green hover:text-toxic-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black'
      >
        {t('ui:controller.reset', { defaultValue: 'Reset to default' })}
      </button>
    </section>
  )
}
