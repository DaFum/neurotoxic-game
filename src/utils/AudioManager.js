import * as Tone from 'tone'
import * as audioEngine from './audioEngine.js'
import { handleError } from './errorHandler.js'
import { logger } from './logger.js'

/**
 * Manages global audio playback including music (Tone.js) and SFX (audioEngine.js).
 */
class AudioSystem {
  constructor() {
    this.currentSongId = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.5
    this.muted = false
    this.prefsLoaded = false
    this.isStartingAmbient = false
  }

  /**
   * Initializes the audio system, loading preferences and setting up synthesizers.
   * Note: Audio playback remains blocked until ensureAudioContext() is called after a user gesture.
   */
  init() {
    if (this.prefsLoaded) return

    try {
      // Load preferences
      const savedMusicVol = localStorage.getItem('neurotoxic_vol_music')
      const savedSfxVol = localStorage.getItem('neurotoxic_vol_sfx')
      const savedMuted = localStorage.getItem('neurotoxic_muted')

      const clamp01 = (n, fallback) => {
        const v = Number.parseFloat(n)
        if (!Number.isFinite(v)) return fallback
        return Math.min(1, Math.max(0, v))
      }

      this.musicVolume =
        savedMusicVol != null ? clamp01(savedMusicVol, 0.5) : 0.5
      this.sfxVolume = savedSfxVol != null ? clamp01(savedSfxVol, 0.5) : 0.5
      this.muted = savedMuted === 'true'

      // Initialize Audio Engine settings (but don't start Context yet)
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)
      audioEngine.setMusicVolume(this.muted ? 0 : this.musicVolume)

      // Tone mute is handled globally by Volume node in engine if implemented, or we can use Destination
      Tone.Destination.mute = this.muted

      this.prefsLoaded = true
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'AudioSystem initialization failed'
      })
    }
  }

  /**
   * Starts the ambient background music stream if not already playing.
   * Prefers OGG buffer playback for quality/CPU; falls back to MIDI synthesis.
   */
  async startAmbient() {
    if (!this.prefsLoaded) return

    // Prevent re-entrant calls or redundant starts
    if (this.isStartingAmbient) {
      logger.debug('AudioSystem', 'Ambient start already in progress.')
      return
    }

    // If ambient is already playing (OGG buffer or MIDI transport)
    if (this.currentSongId === 'ambient') {
      if (audioEngine.isAmbientOggPlaying()) return
      if (Tone.Transport.state === 'started') return
    }

    this.isStartingAmbient = true
    this.stopMusic()
    this.currentSongId = 'ambient'
    try {
      const oggSuccess = await audioEngine.playRandomAmbientOgg()
      if (!oggSuccess) {
        logger.debug(
          'AudioSystem',
          'OGG ambient unavailable, falling back to MIDI synthesis.'
        )
        await audioEngine.playRandomAmbientMidi()
      }
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to start ambient music' })
      this.currentSongId = null
      this.stopMusic()
    } finally {
      this.isStartingAmbient = false
    }
  }

  /**
   * Stops the currently playing music.
   */
  stopMusic() {
    audioEngine.stopAudio()
    this.currentSongId = null
  }

  /**
   * Resumes the paused music or starts ambient if none is loaded.
   * Note: The logic here is asymmetric compared to pauseMusic(). We assume mutually exclusive
   * playback states (either ambient or gig audio is active, not both).
   */
  resumeMusic() {
    if (Tone.Transport.state === 'paused') {
      audioEngine.resumeAudio()
    } else if (Tone.Transport.state !== 'started') {
      this.startAmbient()
    }
  }

  /**
   * Ensures the AudioContext is running (Tone.js).
   * Should be called after a user gesture.
   * @returns {Promise<boolean>} True if successful.
   */
  async ensureAudioContext() {
    try {
      await audioEngine.setupAudio()

      // Always re-apply volumes when unlocking to ensure engine state matches prefs
      // (engine nodes might have been created after init() calls)
      audioEngine.setMusicVolume(this.muted ? 0 : this.musicVolume)
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)

      return await audioEngine.ensureAudioContext()
    } catch (e) {
      logger.warn('AudioSystem', 'Failed to resume AudioContext:', e)
      return false
    }
  }

  /**
   * Plays a sound effect by key.
   * @param {string} key - The SFX identifier (e.g., 'CLICK', 'ERROR').
   */
  playSFX(key) {
    if (!this.prefsLoaded) return
    const validTypes = ['hit', 'miss', 'menu', 'travel', 'cash']
    if (!validTypes.includes(key)) {
      logger.warn('AudioSystem', `Unknown SFX type: ${key}`)
      return
    }
    audioEngine.playSFX(key)
  }

  /**
   * Sets the music volume and persists it.
   * @param {number} vol - Volume level between 0 and 1.
   */
  setMusicVolume(vol) {
    const next = Math.min(1, Math.max(0, vol))
    this.musicVolume = next
    localStorage.setItem('neurotoxic_vol_music', next)
    try {
      audioEngine.setMusicVolume(this.muted ? 0 : next)
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to set music volume' })
    }
  }

  /**
   * Sets the SFX volume and persists it.
   * @param {number} vol - Volume level between 0 and 1.
   */
  setSFXVolume(vol) {
    const next = Math.min(1, Math.max(0, vol))
    this.sfxVolume = next
    localStorage.setItem('neurotoxic_vol_sfx', next)
    audioEngine.setSFXVolume(this.muted ? 0 : next)
  }

  /**
   * Toggles global mute state.
   * @returns {boolean} The new mute state.
   */
  toggleMute() {
    this.muted = !this.muted

    try {
      Tone.Destination.mute = this.muted
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)
      audioEngine.setMusicVolume(this.muted ? 0 : this.musicVolume)
    } catch (e) {
      logger.warn('AudioSystem', 'Tone.js mute failed:', e)
    }

    localStorage.setItem('neurotoxic_muted', this.muted)
    return this.muted
  }

  /**
   * Disposes of the audio system, unloading resources.
   */
  dispose() {
    this.stopMusic()
    audioEngine.disposeAudio?.()
    this.prefsLoaded = false
  }
}

// Deprecated getter for backward compatibility during refactor
Object.defineProperty(AudioSystem.prototype, 'initialized', {
  get() {
    return this.prefsLoaded
  }
})

export const audioManager = new AudioSystem()
audioManager.init()
