import * as audioEngine from './audioEngine.js'
import { handleError } from './errorHandler.js'
import { logger } from './logger.js'

/**
 * High-level audio facade that wraps audioEngine with user preference persistence.
 *
 * Architecture (three layers):
 *   AudioManager  — this file: localStorage prefs, mute toggle, ambient lifecycle
 *   audioEngine   — barrel re-export aggregating src/utils/audio/* modules
 *   audio/*       — low-level Tone.js / WebAudio implementation
 *
 * Volume methods here intentionally duplicate the audioEngine calls because they
 * add localStorage persistence and deferred-apply logic (audio graph may not
 * exist yet when preferences are loaded at startup).
 */
class AudioSystem {
  constructor() {
    this.currentSongId = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.5
    this.muted = false
    this.prefsLoaded = false
    this.isStartingAmbient = false
    this.ambientStartPromise = null
    this.listeners = new Set()
    this.stateSnapshot = {
      musicVol: this.musicVolume,
      sfxVol: this.sfxVolume,
      isMuted: this.muted,
      isPlaying: false,
      currentSongId: this.currentSongId
    }
  }

  /**
   * Returns true when audio is actively playing through ambient OGG or Tone transport.
   * Keeps playback-state logic encapsulated for UI consumers.
   */
  get isPlaying() {
    return (
      this.currentSongId != null &&
      (audioEngine.isAmbientOggPlaying() ||
        audioEngine.getTransportState() === 'started')
    )
  }

  /**
   * Subscribes to audio state changes for reactive UI consumers.
   * @param {() => void} listener - Callback invoked after audio state transitions.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {}
    }

    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Returns the current audio state snapshot for external-store consumers.
   * @returns {{musicVol: number, sfxVol: number, isMuted: boolean, isPlaying: boolean, currentSongId: string | null}}
   */
  getStateSnapshot() {
    return this.stateSnapshot
  }

  /**
   * Emits audio state updates to subscribers.
   */
  emitChange() {
    this.stateSnapshot = {
      musicVol: this.musicVolume,
      sfxVol: this.sfxVolume,
      isMuted: this.muted,
      isPlaying: this.isPlaying,
      currentSongId: this.currentSongId
    }

    this.listeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        logger.warn('AudioSystem', 'Audio subscriber callback failed', error)
      }
    })
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
      audioEngine.setSFXVolume(this.sfxVolume)
      audioEngine.setMusicVolume(this.musicVolume)

      // Tone mute is handled globally by Volume node in engine if implemented, or we can use Destination
      audioEngine.setDestinationMute(this.muted)

      this.prefsLoaded = true
      this.emitChange()
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
    if (!this.prefsLoaded) return false

    // Prevent re-entrant calls or redundant starts
    if (this.isStartingAmbient) {
      logger.debug('AudioSystem', 'Ambient start already in progress.')
      return this.ambientStartPromise ?? false
    }

    // If ambient is already playing (OGG buffer or MIDI transport)
    if (this.currentSongId === 'ambient') {
      if (audioEngine.isAmbientOggPlaying()) return true
      if (audioEngine.getTransportState() === 'started') return true
    }

    this.isStartingAmbient = true
    this.ambientStartPromise = (async () => {
      this.stopMusic({ emit: false })
      this.currentSongId = 'ambient'
      this.emitChange()
      try {
        const oggSuccess = await audioEngine.playRandomAmbientOgg(Math.random, {
          skipStop: true
        })
        if (oggSuccess) {
          this.emitChange()
          logger.info('AudioSystem', 'Ambient started via OGG buffer playback.')
          return true
        }

        logger.debug(
          'AudioSystem',
          'OGG ambient unavailable, falling back to MIDI synthesis.'
        )

        const midiSuccess = await audioEngine.playRandomAmbientMidi()
        if (!midiSuccess) {
          this.currentSongId = null
          this.emitChange()
          logger.warn(
            'AudioSystem',
            'Ambient playback did not start (OGG and MIDI both failed).'
          )
          return false
        }
        this.emitChange()
        logger.info(
          'AudioSystem',
          'Ambient started via MIDI synthesis fallback.'
        )
        return true
      } catch (e) {
        handleError(e, { fallbackMessage: 'Failed to start ambient music' })
        this.stopMusic()
        return false
      } finally {
        this.isStartingAmbient = false
        this.ambientStartPromise = null
      }
    })()

    return this.ambientStartPromise
  }

  /**
   * Stops the currently playing music.
   * @param {{ emit?: boolean }} [options] - Controls whether subscriber notifications are emitted.
   */
  stopMusic(options = {}) {
    logger.debug(
      'AudioSystem',
      `stopMusic called (was playing: ${this.currentSongId ?? 'nothing'}).`
    )
    audioEngine.stopAudio()
    this.currentSongId = null

    if (options.emit !== false) {
      this.emitChange()
    }
  }

  /**
   * Resumes the paused music or starts ambient if none is loaded.
   * We assume mutually exclusive playback states (either ambient or gig audio is active, not both).
   * @returns {Promise<boolean>} True when music is running or successfully started.
   */
  async resumeMusic() {
    try {
      if (
        this.currentSongId === 'ambient' &&
        audioEngine.isAmbientOggPlaying()
      ) {
        return true
      }

      if (audioEngine.getTransportState() === 'paused') {
        audioEngine.resumeAudio()
        this.emitChange()
        return true
      }

      if (audioEngine.getTransportState() !== 'started') {
        return await this.startAmbient()
      }

      return true
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to resume music' })
      this.emitChange()
      return false
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
      audioEngine.setMusicVolume(this.musicVolume)
      audioEngine.setSFXVolume(this.sfxVolume)
      audioEngine.setDestinationMute(this.muted)

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
    let operationSucceeded = true
    let appliedNow = false
    try {
      appliedNow = audioEngine.setMusicVolume(next) !== false
      this.musicVolume = next
    } catch (e) {
      operationSucceeded = false
      handleError(e, { fallbackMessage: 'Failed to set music volume' })
    }
    if (operationSucceeded) {
      if (!appliedNow) {
        logger.debug(
          'AudioSystem',
          'Music volume stored for deferred apply (audio graph not ready).'
        )
      }
      try {
        localStorage.setItem('neurotoxic_vol_music', next)
      } catch (e) {
        handleError(e, {
          fallbackMessage: 'Failed to persist music volume preference'
        })
      }
    }
    if (operationSucceeded) {
      this.emitChange()
    }

    return operationSucceeded
  }

  /**
   * Sets the SFX volume and persists it.
   * @param {number} vol - Volume level between 0 and 1.
   */
  setSFXVolume(vol) {
    const next = Math.min(1, Math.max(0, vol))
    let operationSucceeded = true
    let appliedNow = false
    try {
      appliedNow = audioEngine.setSFXVolume(next) !== false
      this.sfxVolume = next
    } catch (e) {
      operationSucceeded = false
      handleError(e, { fallbackMessage: 'Failed to set SFX volume' })
    }
    if (operationSucceeded) {
      if (!appliedNow) {
        logger.debug(
          'AudioSystem',
          'SFX volume stored for deferred apply (audio graph not ready).'
        )
      }
      try {
        localStorage.setItem('neurotoxic_vol_sfx', next)
      } catch (e) {
        handleError(e, {
          fallbackMessage: 'Failed to persist SFX volume preference'
        })
      }
    }
    if (operationSucceeded) {
      this.emitChange()
    }

    return operationSucceeded
  }

  /**
   * Toggles global mute state.
   * @returns {boolean} The new mute state.
   */
  toggleMute() {
    this.muted = !this.muted

    try {
      audioEngine.setDestinationMute(this.muted)
    } catch (e) {
      logger.warn('AudioSystem', 'audioEngine mute failed:', e)
    }

    this.emitChange()

    try {
      localStorage.setItem('neurotoxic_muted', this.muted)
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to persist mute preference' })
    }
    return this.muted
  }

  /**
   * Disposes of the audio system, unloading resources.
   */
  dispose() {
    this.stopMusic()
    audioEngine.disposeAudio?.()
    this.prefsLoaded = false
    this.listeners.clear()
  }
}

export const audioManager = new AudioSystem()
audioManager.init()
