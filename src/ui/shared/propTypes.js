import PropTypes from 'prop-types'

export const AudioStatePropType = PropTypes.shape({
  musicVol: PropTypes.number,
  sfxVol: PropTypes.number,
  isMuted: PropTypes.bool
})

export const OnAudioChangePropType = PropTypes.shape({
  setMusic: PropTypes.func,
  setSfx: PropTypes.func,
  toggleMute: PropTypes.func
})
