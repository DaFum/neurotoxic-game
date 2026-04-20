import React from 'react'
import { Modal } from './shared/Modal'
import { GlitchButton } from './GlitchButton'

export const DarkWebLeakModal = ({ config, canLeak, onConfirm, onCancel, hasLeakedToday }: any) => {
  return (
    <Modal title="Dark Web Data Leak" onClose={onCancel}>
      <div className="flex flex-col gap-4 p-4 border border-zinc-700 bg-zinc-900/90 text-zinc-100">
        <p className="text-sm">
          Leak unreleased tracks to the dark web to instantly boost your fame and zealotry. But beware, it will spark controversy and damage band harmony.
        </p>
        <div className="flex flex-col gap-1 text-sm bg-black/50 p-2 border border-zinc-800">
          <div className="text-red-400">COST: ${config.COST}</div>
          <div className="text-green-400">FAME: +{config.FAME_GAIN}</div>
          <div className="text-yellow-400">ZEALOTRY: +{config.ZEALOTRY_GAIN}</div>
          <div className="text-purple-400">CONTROVERSY: +{config.CONTROVERSY_GAIN}</div>
          <div className="text-orange-400">HARMONY COST: -{config.HARMONY_COST}</div>
        </div>
        {hasLeakedToday && (
          <p className="text-red-500 text-sm font-bold border border-red-500 p-1 text-center">Data leaked for today.</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <GlitchButton variant="secondary" onClick={onCancel}>CANCEL</GlitchButton>
          <GlitchButton variant="danger" onClick={onConfirm} disabled={!canLeak || hasLeakedToday}>EXECUTE LEAK</GlitchButton>
        </div>
      </div>
    </Modal>
  )
}
