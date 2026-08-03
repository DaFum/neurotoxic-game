/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 */

// Shared UI supports both barrel imports for common primitives and direct leaf imports for focused component tests/mocks.
// Export components
export { SettingsPanel } from '../settings/SettingsPanel'
export { Tooltip } from './Tooltip'
export { Modal } from './Modal'
export { ActionButton } from './ActionButton'
export { AnimatedDivider, AnimatedSubtitle } from './AnimatedTypography'
export {
  KeyboardShortcutsPanel,
  useKeyboardShortcuts
} from './KeyboardShortcuts'
export { FrameCorners } from './FrameCorners'

export {
  BandcampIcon,
  InstaIcon,
  TikTokIcon,
  YouTubeIcon,
  BlogIcon,
  GameIcon
} from './Icons'
export {
  HexNode,
  BlockMeter,
  CrisisModal,
  HazardTicker,
  UplinkButton
} from './BrutalistUI'

export { StatBox } from './StatBox'
export { ProgressBar } from './ProgressBar'
export { StatMiniBar } from './StatMiniBar'
export { Panel } from './Panel'
