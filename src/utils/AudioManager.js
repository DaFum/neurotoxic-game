import { Howl, Howler } from 'howler'
import * as Tone from 'tone'
import * as audioEngine from './audioEngine.js'
import { handleError } from './errorHandler.js'

/**
 * Manages global audio playback including music (Howler.js) and SFX (audioEngine.js).
 */
class AudioSystem {
  constructor() {
    this.music = null
    this.currentSongId = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.5
    this.muted = false
    this.initialized = false
  }

  /**
   * Initializes the audio system, loading preferences and setting up synthesizers.
   * Note: Audio playback remains blocked until ensureAudioContext() is called after a user gesture.
   */
  init() {
    if (this.initialized) return

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

      // Apply global mute
      Howler.mute(this.muted)

      // Initialize Audio Engine settings (but don't start Context yet)
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)

      // Tone mute is handled globally by Volume node in engine if implemented, or we can use Destination
      Tone.Destination.mute = this.muted
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'AudioSystem initialization failed'
      })
    }
  }

  /**
   * Plays a music track by ID.
   * @param {string} songId - The ID of the song to play (or 'ambient').
   * @param {boolean} [loop=false] - Whether to loop the track.
   * @param {number} [volume] - Volume override (defaults to global music volume).
   * @returns {object|null} The Howl instance or null if not initialized.
   */
  playMusic(songId, loop = false, volume = this.musicVolume) {
    if (!this.initialized) return null

    // If ambient, delegate to MIDI engine
    if (songId === 'ambient') {
      this.startAmbient()
      return null
    }

    // Clean up previous instance explicitly
    this.stopMusic()

    const src = this.getAudioSrc(songId)
    this.currentSongId = songId

    this.music = new Howl({
      src: [src],
      html5: true,
      loop: loop,
      volume: volume,
      onplayerror: (id, err) => {
        console.warn('[AudioSystem] Play error, attempting unlock:', err)
        this.music.once('unlock', () => {
          this.music.play()
        })
      }
    })

    this.music.play()
    return this.music
  }

  /**
   * Starts the ambient background music stream if not already playing.
   */
  async startAmbient() {
    if (!this.initialized) return

    // If already playing MIDI ambient (Tone Transport running and current ID is ambient)
    if (
      Tone.Transport.state === 'started' &&
      this.currentSongId === 'ambient'
    ) {
      return
    }

    this.stopMusic()
    this.currentSongId = 'ambient'
    try {
      await audioEngine.playRandomAmbientMidi()
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to start ambient MIDI' })
      this.currentSongId = null
      this.stopMusic()
    }
  }

  /**
   * Stops the currently playing music (Howler or Tone).
   */
  stopMusic() {
    if (this.music) {
      this.music.stop()
      this.music.unload()
      this.music = null
    }
    audioEngine.stopAudio()
    this.currentSongId = null
  }

  /**
   * Pauses the currently playing music.
   */
  pauseMusic() {
    if (this.music) this.music.pause()
    if (Tone.Transport.state === 'started') {
      audioEngine.pauseAudio()
    }
  }

  /**
   * Resumes the paused music or starts ambient if none is loaded.
   * Note: The logic here is asymmetric compared to pauseMusic(). We assume mutually exclusive
   * playback states (either Howl or Tone is active, not both).
   */
  resumeMusic() {
    if (this.music && !this.music.playing()) {
      if (this.music.state() === 'loaded') {
        this.music.play()
      }
    } else if (Tone.Transport.state === 'paused') {
      audioEngine.resumeAudio()
    } else if (!this.music && Tone.Transport.state !== 'started') {
      this.startAmbient()
    }
  }

  /**
   * Ensures the AudioContext is running (Tone.js and Howler).
   * Should be called after a user gesture.
   */
  async ensureAudioContext() {
    try {
      if (!this.initialized) {
        await audioEngine.setupAudio()
        this.initialized = true
      }
      await audioEngine.ensureAudioContext()
      if (Howler.ctx && Howler.ctx.state !== 'running') {
        await Howler.ctx.resume()
      }
    } catch (e) {
      console.warn('[AudioSystem] Failed to resume AudioContext:', e)
    }
  }

  /**
   * Plays a sound effect by key.
   * @param {string} key - The SFX identifier (e.g., 'CLICK', 'ERROR').
   */
  playSFX(key) {
    if (!this.initialized) return
    const validTypes = ['hit', 'miss', 'menu', 'travel', 'cash']
    if (!validTypes.includes(key)) {
      console.warn(`[AudioSystem] Unknown SFX type: ${key}`)
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
    if (this.music) {
      this.music.volume(next)
    }
    // Scale Tone.js master volume so MIDI ambient respects the music slider
    try {
      // Avoid -Infinity by clamping to a minimum dB floor for 0 volume
      if (next <= 0.001) {
        Tone.Destination.volume.value = -Infinity // Mute
      } else {
        Tone.Destination.volume.value = Tone.gainToDb(next)
      }
    } catch (e) {
      handleError(e, { fallbackMessage: 'Failed to set Tone volume' })
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
    audioEngine.setSFXVolume(next)
  }

  /**
   * Toggles global mute state.
   * @returns {boolean} The new mute state.
   */
  toggleMute() {
    this.muted = !this.muted
    Howler.mute(this.muted)

    try {
      Tone.Destination.mute = this.muted
      audioEngine.setSFXVolume(this.muted ? 0 : this.sfxVolume)
    } catch (e) {
      console.warn('[AudioSystem] Tone.js mute failed:', e)
    }

    localStorage.setItem('neurotoxic_muted', this.muted)
    return this.muted
  }

  /**
   * Resolves the source URL for a given song ID.
   * @param {string} songId - The song ID.
   * @returns {string} The URL string.
   */
  getAudioSrc(songId) {
    // Ambient is now handled via MIDI engine.
    // TODO: Implement actual URL mapping for non-ambient tracks if needed.
    if (songId !== 'ambient') {
      console.warn(
        `[AudioSystem] getAudioSrc returning placeholder for songId: ${songId}`
      )
    }
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  }

  /**
   * Wrapper for playSFX to match guidelines.
   * @param {string} soundId - The SFX identifier.
   */
  playSound(soundId) {
    this.playSFX(soundId)
  }

  /**
   * Stops all audio playback.
   */
  stopAll() {
    this.stopMusic()
    // Could also stop SFX if tracked
  }

  /**
   * Sets the master volume (affects both music and SFX).
   * @param {number} level - Volume level (0-1).
   */
  setMasterVolume(level) {
    this.setMusicVolume(level)
    this.setSFXVolume(level)
  }

  /**
   * Disposes of the audio system, unloading resources.
   */
  dispose() {
    this.stopMusic()
    Howler.unload()
    audioEngine.disposeAudio?.()
    this.initialized = false
  }
}

export const audioManager = new AudioSystem()
audioManager.init()
