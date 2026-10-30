import type { ReactNode } from 'react'

type InputHintProps = { label: ReactNode }

export function InputHint({ label }: InputHintProps) {
  return <kbd className='border px-1.5 py-0.5 border-ash-gray/30'>{label}</kbd>
}
