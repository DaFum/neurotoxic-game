/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 */

// Shared UI supports both barrel imports for common primitives and direct leaf imports for focused component tests/mocks.
// Export components
export { SettingsPanel } from '../settings/SettingsPanel'
export { VolumeSlider } from './VolumeSlider'
export { SegmentedSlider } from './SegmentedSlider'
export { Tooltip } from './Tooltip'
export { Modal } from './Modal'
export { ActionButton } from './ActionButton'
export { ToggleSwitch } from './ToggleSwitch'
export { AnimatedDivider, AnimatedSubtitle } from './AnimatedTypography'
export {
  KeyboardShortcutsPanel,
  useKeyboardShortcuts
} from './KeyboardShortcuts'
import { UIFrameCorner } from './Icons'
import { FrameCorners } from './FrameCorners'

export { UIFrameCorner }
export { FrameCorners }

export {
  RazorPlayIcon,
  VoidSkullIcon,
  BandcampIcon,
  InstaIcon,
  TikTokIcon,
  YouTubeIcon,
  BlogIcon,
  GameIcon
} from './Icons'
export {
  AlertIcon,
  HexNode,
  BlockMeter,
  CrisisModal,
  DeadmanButton,
  HazardTicker,
  UplinkButton
} from './BrutalistUI'

export { StatBox } from './StatBox'
export { ProgressBar } from './ProgressBar'
export { StatMiniBar } from './StatMiniBar'
export { Panel } from './Panel'
