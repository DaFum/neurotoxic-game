import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'

export function GamepadTextEntry({
  target,
  onClose
}: {
  target: HTMLInputElement | HTMLTextAreaElement
  onClose: () => void
}) {
  const { t } = useTranslation('ui')
  const [value, setValue] = useState(target.value)
  const limit = target.maxLength < 0 ? Infinity : target.maxLength
  const add = (character: string) =>
    setValue(current => (current + character).slice(0, limit))
  const done = () => {
    const prototype =
      target instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(
      target,
      value
    )
    target.dispatchEvent(new Event('input', { bubbles: true }))
    onClose()
  }
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('ui:controller.keyboardTitle', { defaultValue: 'Enter text' })}
    >
      <output aria-live='polite' className='block mb-4'>
        {value || '\u00a0'}
      </output>
      <div className='grid grid-cols-7 gap-2'>
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('').map(character => (
          <button
            type='button'
            key={character}
            className='border border-toxic-green p-2'
            onClick={() => add(character)}
          >
            {character}
          </button>
        ))}
        <button
          type='button'
          className='border border-toxic-green p-2'
          onClick={() => add(' ')}
        >
          {t('ui:controller.space', { defaultValue: 'Space' })}
        </button>
        <button
          type='button'
          className='border border-toxic-green p-2'
          onClick={() => setValue(current => current.slice(0, -1))}
        >
          {t('ui:controller.backspace', { defaultValue: 'Backspace' })}
        </button>
        <button
          type='button'
          className='border border-toxic-green p-2'
          onClick={done}
        >
          {t('ui:controller.done', { defaultValue: 'Done' })}
        </button>
        <button
          type='button'
          className='border border-toxic-green p-2'
          onClick={onClose}
        >
          {t('ui:controller.cancel', { defaultValue: 'Cancel' })}
        </button>
      </div>
    </Modal>
  )
}
