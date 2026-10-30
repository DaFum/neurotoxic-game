/**
 * On-Screen Gamepad Text Entry Modal.
 * Offers a character grid for text entry via controller navigation.
 * Updates target text input via native value setter and bubbling input event.
 */

import { useState } from 'react'
import { Modal } from '../../ui/shared/Modal'
import { useTranslation } from 'react-i18next'

interface GamepadTextEntryProps {
  isOpen: boolean
  initialValue: string
  maxLength?: number
  targetInput: HTMLInputElement | HTMLTextAreaElement | null
  onClose: () => void
}

const CHAR_GRID = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', '1', '2', '3'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N', '4', '5', '6'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U', '7', '8', '9'],
  ['V', 'W', 'X', 'Y', 'Z', ' ', '-', '_', '.', '0']
]

export const GamepadTextEntry = ({
  isOpen,
  initialValue,
  maxLength = 50,
  targetInput,
  onClose
}: GamepadTextEntryProps) => {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue)

  if (!isOpen) return null

  const handleAppend = (char: string) => {
    if (value.length < maxLength) {
      setValue(prev => prev + char)
    }
  }

  const handleBackspace = () => {
    setValue(prev => prev.slice(0, -1))
  }

  const handleDone = () => {
    if (targetInput) {
      const prototype = Object.getPrototypeOf(targetInput)
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
      descriptor?.set?.call(targetInput, value)
      targetInput.dispatchEvent(new Event('input', { bubbles: true }))
      targetInput.dispatchEvent(new Event('change', { bubbles: true }))
      targetInput.focus()
    }
    onClose()
  }

  const handleCancel = () => {
    if (targetInput) {
      targetInput.focus()
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('controller.textEntryTitle', { defaultValue: 'Text Entry' })}
    >
      <div className='flex flex-col gap-4'>
        {/* Text preview */}
        <div className='p-3 border-2 border-toxic-green bg-void-black font-mono text-xl text-toxic-green tracking-wider min-h-[3rem] flex items-center justify-between'>
          <span>{value || <span className='opacity-40'>_</span>}</span>
          <span className='text-xs opacity-60 font-sans'>
            {value.length}/{maxLength}
          </span>
        </div>

        {/* On-screen grid */}
        <div className='grid grid-cols-10 gap-1.5 p-2 border border-toxic-green/40 bg-void-black/80'>
          {CHAR_GRID.flatMap((row, rIdx) =>
            row.map((char, cIdx) => (
              <button
                key={`${rIdx}-${cIdx}-${char}`}
                type='button'
                onClick={() => handleAppend(char)}
                className='h-10 border border-toxic-green/60 text-toxic-green font-mono text-lg flex items-center justify-center hover:bg-toxic-green hover:text-void-black focus:bg-toxic-green focus:text-void-black focus:outline-none transition-colors'
                data-gamepad-autofocus={
                  rIdx === 0 && cIdx === 0 ? 'true' : undefined
                }
              >
                {char === ' ' ? '␣' : char}
              </button>
            ))
          )}
        </div>

        {/* Action Controls */}
        <div className='flex gap-2 mt-2'>
          <button
            type='button'
            onClick={handleBackspace}
            className='flex-1 py-2 px-3 border-2 border-toxic-green/80 text-toxic-green font-mono text-sm hover:bg-toxic-green hover:text-void-black focus:bg-toxic-green focus:text-void-black transition-colors uppercase font-bold'
          >
            {t('controller.backspace', { defaultValue: 'Backspace' })}
          </button>
          <button
            type='button'
            onClick={handleCancel}
            className='py-2 px-4 border-2 border-red-500 text-red-500 font-mono text-sm hover:bg-red-500 hover:text-void-black focus:bg-red-500 focus:text-void-black transition-colors uppercase font-bold'
          >
            {t('controller.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type='button'
            onClick={handleDone}
            className='flex-1 py-2 px-3 border-2 border-toxic-green bg-toxic-green text-void-black font-mono text-sm hover:bg-white focus:bg-white transition-colors uppercase font-bold'
          >
            {t('controller.done', { defaultValue: 'Done' })}
          </button>
        </div>
      </div>
    </Modal>
  )
}
