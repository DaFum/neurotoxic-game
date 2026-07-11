import type { LongTermAsset } from './assets'

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface AssetConfirmModalProps extends BaseModalProps {
  asset: LongTermAsset
}
