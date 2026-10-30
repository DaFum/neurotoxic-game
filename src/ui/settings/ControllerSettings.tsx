/**
 * Controller Settings Panel.
 * Manages device status display, lane binding configuration, capture mode,
 * collision swap handling, reserved button rejection, and default resets.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGamepadInputOptional } from '../../context/GamepadInputContext'
import { getButtonLabel, RESERVED_START_BUTTON } from '../../utils/gamepad'
import { useGameSelector, useGameActions } from '../../context/GameState'

export function ControllerSettings() {
  const { t } = useTranslation()
  const { updateSettings } = useGameActions()
  const bindings = useGameSelector(state => state.settings?.gamepadLaneBindings) ?? [2, 0, 1]
  const gamepadContext = useGamepadInputOptional()

  const connectedPads = gamepadContext?.connectedPads ?? []
  const layoutFamily = gamepadContext?.activeLayoutFamily ?? 'xbox'
  const isCapturing = gamepadContext?.isCapturingBinding ?? false

  const [capturingLane, setCapturingLane] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleStartRebind = (laneIndex: number) => {
    if (!gamepadContext) return
    setErrorMessage('')
    setCapturingLane(laneIndex)
    gamepadContext.startBindingCapture((newButtonIndex: number) => {
      if (newButtonIndex === RESERVED_START_BUTTON) {
        setErrorMessage(
          t('controller.reservedButtonError', {
            defaultValue: 'Button 9 (Start) is reserved for menu navigation.'
          })
        )
        setCapturingLane(null)
        return
      }

      const nextBindings = [...bindings]
      const existingLaneIdx = nextBindings.indexOf(newButtonIndex)

      if (existingLaneIdx !== -1 && existingLaneIdx !== laneIndex) {
        // Swap bindings on collision
        const prevValue = nextBindings[laneIndex]
        nextBindings[laneIndex] = newButtonIndex
        nextBindings[existingLaneIdx] = prevValue
        const msg = t('controller.swapAnnouncement', {
          defaultValue: 'Swapped controller lane bindings.'
        })
        setAnnouncement(msg)
      } else {
        nextBindings[laneIndex] = newButtonIndex
        setAnnouncement(
          t('controller.reboundAnnouncement', {
            defaultValue: 'Rebound lane control.'
          })
        )
      }

      updateSettings({ gamepadLaneBindings: nextBindings })
      setCapturingLane(null)
    })
  }

  const handleCancelRebind = () => {
    gamepadContext?.cancelBindingCapture()
    setCapturingLane(null)
    setErrorMessage('')
  }

  const handleResetBindings = () => {
    updateSettings({ gamepadLaneBindings: [2, 0, 1] })
    setAnnouncement(
      t('controller.resetAnnouncement', {
        defaultValue: 'Reset lane bindings to default.'
      })
    )
    setErrorMessage('')
  }

  const laneNames = [
    t('controller.laneGuitar', { defaultValue: 'Guitar (Lane 1)' }),
    t('controller.laneDrums', { defaultValue: 'Drums (Lane 2)' }),
    t('controller.laneBass', { defaultValue: 'Bass (Lane 3)' })
  ]

  return (
    <div className='flex flex-col gap-6 p-4 bg-void-black/80 border border-toxic-green/40'>
      {/* Live announcement region */}
      <div className='sr-only' aria-live='polite'>
        {announcement}
      </div>

      {/* Controller Status Header */}
      <div className='flex flex-col gap-2 border-b border-toxic-green/30 pb-4'>
        <h3 className='text-lg font-display text-toxic-green uppercase tracking-wider'>
          {t('controller.statusTitle', { defaultValue: 'Controller Status' })}
        </h3>
        {connectedPads.length === 0 ? (
          <p className='text-sm font-mono text-ash-gray'>
            {t('controller.noController', {
              defaultValue: 'No controller connected'
            })}
          </p>
        ) : (
          <div className='flex flex-col gap-1 font-mono text-xs text-toxic-green/90'>
            {connectedPads.map(pad => (
              <div key={pad.index} className='flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-toxic-green animate-pulse' />
                <span className='font-bold'>{pad.id}</span>
                <span className='opacity-60'>({layoutFamily.toUpperCase()})</span>
                {pad.mapping !== 'standard' && (
                  <span className='text-warning-yellow text-[10px] border border-warning-yellow px-1 uppercase'>
                    {t('controller.nonStandardBadge', {
                      defaultValue: 'Non-Standard Mapping'
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rebinding Lane Section */}
      <div className='flex flex-col gap-4'>
        <h3 className='text-lg font-display text-toxic-green uppercase tracking-wider'>
          {t('controller.bindingsTitle', {
            defaultValue: 'Lane Button Bindings'
          })}
        </h3>

        {errorMessage && (
          <p className='text-xs font-mono text-blood-red bg-blood-red/10 border border-blood-red p-2'>
            {errorMessage}
          </p>
        )}

        <div className='flex flex-col gap-3'>
          {bindings.map((btnIdx, idx) => {
            const isTarget = capturingLane === idx
            const glyph = getButtonLabel(btnIdx, layoutFamily)

            return (
              <div
                key={idx}
                className='flex items-center justify-between p-3 border border-toxic-green/30 bg-void-black/60'
              >
                <span className='font-mono text-sm text-star-white'>
                  {laneNames[idx]}
                </span>
                <div className='flex items-center gap-3'>
                  <span className='px-3 py-1 border border-toxic-green bg-toxic-green/10 text-toxic-green font-mono font-bold text-sm'>
                    {glyph}
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      isTarget ? handleCancelRebind() : handleStartRebind(idx)
                    }
                    className={`px-3 py-1 text-xs font-mono font-bold uppercase border transition-colors ${
                      isTarget
                        ? 'bg-warning-yellow text-void-black border-warning-yellow animate-pulse'
                        : 'border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black'
                    }`}
                  >
                    {isTarget
                      ? t('controller.pressAnyButton', {
                          defaultValue: 'Press Button...'
                        })
                      : t('controller.rebind', { defaultValue: 'Rebind' })}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Controls */}
        <div className='flex justify-between items-center mt-2'>
          <button
            type='button'
            onClick={handleResetBindings}
            className='px-4 py-2 border-2 border-toxic-green/60 text-toxic-green font-mono text-xs hover:bg-toxic-green hover:text-void-black transition-colors uppercase font-bold'
          >
            {t('controller.resetDefaults', {
              defaultValue: 'Reset Default Bindings'
            })}
          </button>
          {isCapturing && (
            <button
              type='button'
              onClick={handleCancelRebind}
              className='px-4 py-2 border-2 border-blood-red text-blood-red font-mono text-xs hover:bg-blood-red hover:text-star-white transition-colors uppercase font-bold'
            >
              {t('controller.cancelCapture', { defaultValue: 'Cancel Rebind' })}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
