import * as audioEngine from './audioEngine'
import { secureRandom } from '../crypto'
import { handleError } from '../errorHandler'
import { logger } from '../logger'

type AudioListener = () => void
type AudioSfxType =
  | 'hit'
  | 'miss'
  | 'menu'
  | 'travel'
  | 'cash'
  | 'crash'
  | 'honk'
  | 'pickup'
  | 'deliver'

type AudioStateSnapshot = {
  musicVol: number
  sfxVol: number
  isMuted: boolean
  isPlaying: boolean
  currentSongId: string | null
}

/**
 * High-level audio facade that wraps audioEngine with user preference persistence.
 *
 * Architecture (three layers):
 *   AudioManager — localStorage prefs, mute toggle, ambient lifecycle
 *   audioEngine  — barrel re-export aggregating low-level audio modules
 *   audio/*      — Tone.js / WebAudio implementation
 *
 * Volume methods here intentionally duplicate the audioEngine calls because they
 * add localStorage persistence and deferred-apply logic (audio graph may not
 * exist yet when preferences are loaded at startup).
 */
class AudioSystem {
  currentSongId: string | null
  musicVolume: number
  sfxVolume: number
  muted: boolean
  prefsLoaded: boolean
  isStartingAmbient: boolean
  ambientStartPromise: Promise<boolean> | null
  ambientStartToken: number
  listeners: Set<AudioListener>
  stateSnapshot: AudioStateSnapshot

  constructor() {
    this.currentSongId = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.5
    this.muted = false
    this.prefsLoaded = false
    this.isStartingAmbient = false
    this.ambientStartPromise = null
    this.ambientStartToken = 0
    this.listeners = new Set()
    this.stateSnapshot = {
      musicVol: this.musicVolume,
      sfxVol: this.sfxVolume,
      isMuted: this.muted,
      isPlaying: false,
      currentSongId: this.currentSongId
    }
  }

  static VALID_SFX_TYPES = new Set<AudioSfxType>([
    'hit',
    'miss',
    'menu',
    'travel',
    'cash',
    'crash',
    'honk',
    'pickup',
    'deliver'
  ])

  /**
   * Returns true when audio is actively playing through ambient OGG or Tone transport.
   * Keeps playback-state logic encapsulated for UI consumers.
   */
  get isPlaying(): boolean {
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
  subscribe(listener: AudioListener): () => void {
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
  getStateSnapshot(): AudioStateSnapshot {
    return this.stateSnapshot
  }

  /**
   * Emits audio state updates to subscribers.
   */
  emitChange(): void {
    this.stateSnapshot = {
      musicVol: this.musicVolume,
      sfxVol: this.sfxVolume,
      isMuted: this.muted,
      isPlaying: this.isPlaying,
      currentSongId: this.currentSongId
    }

    this.listeners.forEach((listener: AudioListener) => {
      try {
        listener()
      } catch (error) {
        logger.warn('AudioSystem', 'Audio subscriber callback failed', error)
        this.listeners.delete(listener)
      }
    })
  }

  /**
   * Initializes the audio system, loading preferences and setting up synthesizers.
   * Note: Audio playback remains blocked until ensureAudioContext() is called after a user gesture.
   */
  init(): void {
    if (this.prefsLoaded) return

    const clamp01 = (n: string | null, fallback: number): number => {
      if (n == null) return fallback
      const v = Number.parseFloat(n)
      if (!Number.isFinite(v)) return fallback
      return Math.min(1, Math.max(0, v))
    }

    let savedMusicVol: string | null = null
    let savedSfxVol: string | null = null
    let savedMuted: string | null = null

    try {
      savedMusicVol = localStorage.getItem('neurotoxic_vol_music')
      savedSfxVol = localStorage.getItem('neurotoxic_vol_sfx')
      savedMuted = localStorage.getItem('neurotoxic_muted')
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'AudioSystem preference load failed'
      })
    }

    this.musicVolume = clamp01(savedMusicVol, 0.5)
    this.sfxVolume = clamp01(savedSfxVol, 0.5)
    this.muted = savedMuted === 'true'

    try {
      // Initialize Audio Engine settings (but don't start Context yet)
      audioEngine.setSFXVolume(this.sfxVolume)
      audioEngine.setMusicVolume(this.musicVolume)

      // Tone mute is handled globally by Volume node in engine if implemented, or we can use Destination
      audioEngine.setDestinationMute(this.muted)
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'AudioSystem engine initialization failed'
      })
    }

    this.prefsLoaded = true
    this.emitChange()
  }

  /**
   * Starts the ambient background music stream if not already playing.
   * Prefers OGG buffer playback for quality/CPU; falls back to MIDI synthesis.
   */
  async startAmbient(): Promise<boolean> {
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
    const ambientStartToken = ++this.ambientStartToken
    this.ambientStartPromise = (async () => {
      this.stopMusic({ emit: false, invalidateAmbientStart: false })
      this.currentSongId = 'ambient'
      this.emitChange()
      try {
        const oggSuccess = await audioEngine.playRandomAmbientOgg(
          secureRandom,
          {
            skipStop: true
          }
        )
        if (ambientStartToken !== this.ambientStartToken) return false
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
        if (ambientStartToken !== this.ambientStartToken) return false
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
        this.stopMusic({ invalidateAmbientStart: false })
        return false
      } finally {
        if (ambientStartToken === this.ambientStartToken) {
          this.isStartingAmbient = false
          this.ambientStartPromise = null
        }
      }
    })()

    return this.ambientStartPromise
  }

  /**
   * Stops the currently playing music.
   * @param {{ emit?: boolean }} [options] - Controls whether subscriber notifications are emitted.
   */
  stopMusic(
    options: { emit?: boolean; invalidateAmbientStart?: boolean } = {}
  ): void {
    if (options.invalidateAmbientStart !== false) {
      this.ambientStartToken++
      this.isStartingAmbient = false
      this.ambientStartPromise = null
    }
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
  async resumeMusic(): Promise<boolean> {
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
      return false
    }
  }

  /**
   * Ensures the AudioContext is running (Tone.js).
   * Should be called after a user gesture.
   * @returns {Promise<boolean>} True if successful.
   */
  async ensureAudioContext(): Promise<boolean> {
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
  playSFX(key: AudioSfxType): void {
    if (!this.prefsLoaded) return
    if (!AudioSystem.VALID_SFX_TYPES.has(key)) {
      logger.warn('AudioSystem', `Unknown SFX type: ${key}`)
      return
    }
    audioEngine.playSFX(key)
  }

  /**
   * Sets the music volume and persists it.
   * @param {number} vol - Volume level between 0 and 1.
   */
  setMusicVolume(vol: number): boolean {
    if (!Number.isFinite(vol)) {
      logger.warn('AudioSystem', `Invalid music volume: ${String(vol)}`)
      return false
    }
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
        localStorage.setItem('neurotoxic_vol_music', String(next))
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
  setSFXVolume(vol: number): boolean {
    if (!Number.isFinite(vol)) {
      logger.warn('AudioSystem', `Invalid SFX volume: ${String(vol)}`)
      return false
    }
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
        localStorage.setItem('neurotoxic_vol_sfx', String(next))
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
  toggleMute(): boolean {
    this.muted = !this.muted

    try {
      audioEngine.setDestinationMute(this.muted)
    } catch (e) {
      logger.warn('AudioSystem', 'audioEngine mute failed:', e)
    }

    this.emitChange()

    try {
      localStorage.setItem('neurotoxic_muted', String(this.muted))
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to persist mute preference' })
    }
    return this.muted
  }

  /**
   * Disposes of the audio system, unloading resources.
   */
  dispose(): void {
    this.stopMusic({ emit: false })
    this.currentSongId = null
    this.ambientStartToken++
    this.ambientStartPromise = null
    this.isStartingAmbient = false
    this.prefsLoaded = false

    // Explicitly call the engine's dispose function to clear contexts
    try {
      if (typeof audioEngine.disposeAudio === 'function') {
        audioEngine.disposeAudio()
      }
    } catch (e) {
      logger.warn('AudioSystem', 'Error during engine dispose:', e)
    }

    // Clear all listeners to prevent memory leaks in the React tree
    this.listeners.clear()
  }
}

export const audioManager = new AudioSystem()
audioManager.init()
